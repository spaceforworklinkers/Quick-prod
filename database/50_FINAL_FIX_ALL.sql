-- ================================================================
-- FINAL FIX FOR QUICKSERVE POS - RUN THIS TO FIX EVERYTHING (V4)
-- ================================================================
-- 1. Fixes Dashboard 500 Crashes (RLS Recursion Loop 1 & 2)
-- 2. Enhance Outlet Creation (Fix 401 & Add Billing Details)
-- 3. Fixes Login 400 Error (Correct Instance ID for Cloud)
-- 4. Fixes Login Page 'Outlet Not Found' (Adds Public Read Access)
-- ================================================================

-- PART 1: FIX RECURSION CRASHES (500 Errors)

-- A. Helper Functions (SECURITY DEFINER breaks the loops)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS ( SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN') );
$$;

CREATE OR REPLACE FUNCTION public.get_accessible_restaurant_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  -- Returns IDs of restaurants where user is Owner or Staff
  -- SECURITY DEFINER ensures we don't trigger RLS loops when checking these tables
  SELECT r.id FROM public.restaurants r
  JOIN public.restaurant_owners ro ON r.owner_id = ro.id WHERE ro.user_id = auth.uid()
  UNION
  SELECT restaurant_id FROM public.restaurant_users WHERE user_id = auth.uid();
$$;

-- B. Fix User Profiles Policy (Loop 1)
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles FOR SELECT
USING ( public.is_platform_admin() OR auth.uid() = id );

-- C. Fix Restaurants Policy (Loop 2 & Public Access)
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Owners can view own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant staff can view assigned restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurants;

-- Admin: Full Access
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants FOR ALL
USING ( public.is_platform_admin() );

-- Public: Read Only (Required for Login Page to load Logo/Name)
CREATE POLICY "Public can view restaurants" ON public.restaurants FOR SELECT
USING ( true );

-- Owner/Staff: Update Usage (Select is covered by Public)
CREATE POLICY "Owners and Staff can update assigned restaurants" ON public.restaurants FOR UPDATE
USING ( id IN ( SELECT id FROM public.get_accessible_restaurant_ids() ) );

-- D. Fix Restaurant Users Policy (Loop 2)
DROP POLICY IF EXISTS "Tenant scoped access - restaurant_users" ON public.restaurant_users;
CREATE POLICY "Tenant scoped access - restaurant_users" ON public.restaurant_users FOR ALL
USING (
    user_id = auth.uid() -- Can always see own assignment
    OR
    restaurant_id IN ( SELECT id FROM public.get_accessible_restaurant_ids() ) -- Manager/Owner can see staff
    OR
    public.is_platform_admin() -- Admin can see all
);

-- Fix Owners Policy
DROP POLICY IF EXISTS "Super admins can manage all owners" ON public.restaurant_owners;
CREATE POLICY "Super admins can manage all owners" ON public.restaurant_owners FOR ALL
USING ( public.is_platform_admin() );


-- PART 2: FIX OUTLET CREATION (Enhanced RPC)

-- DROP FUNCTION to prevent signature conflict errors
DROP FUNCTION IF EXISTS create_outlet_direct_v2;
DROP FUNCTION IF EXISTS create_outlet_direct_v2(text,text,text,text,text,text,text,int);
DROP FUNCTION IF EXISTS create_outlet_direct_v2(text,text,text,text,text,text,text,int,text,text,boolean,text,text,decimal);

-- Create Robust Outlet Provisioning Function
CREATE OR REPLACE FUNCTION create_outlet_direct_v2(
    outlet_name text,
    owner_name text,
    owner_email text,
    owner_phone text,
    owner_password text,
    city text DEFAULT '',
    state text DEFAULT '',
    trial_days int DEFAULT 14,
    business_type text DEFAULT 'restaurant',
    gst_number text DEFAULT NULL,
    is_paid boolean DEFAULT false,
    plan_name text DEFAULT 'Standard',
    billing_cycle text DEFAULT 'monthly',
    paid_amount decimal DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Run as superuser
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id uuid;
    owner_record_id uuid;
    restaurant_record_id uuid;
    encrypted_pw text;
    sub_status text;
    sub_expiry timestamptz;
    v_instance_id uuid;
BEGIN
    -- Security Check
    IF NOT public.is_platform_admin() THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Only Platform Admins can create outlets.');
    END IF;

    -- Check Conflict
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = owner_email) THEN
        RETURN json_build_object('success', false, 'error', format('User with email %s already exists', owner_email));
    END IF;

    -- Get Instance ID from current admin user (Ensures compatibility with Cloud)
    SELECT instance_id INTO v_instance_id FROM auth.users WHERE id = auth.uid();
    IF v_instance_id IS NULL THEN
        SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    END IF;

    -- Determine Subscription Logic
    IF is_paid THEN
        sub_status := 'active';
        IF billing_cycle = 'yearly' THEN
            sub_expiry := now() + interval '1 year';
        ELSE
            sub_expiry := now() + interval '1 month';
        END IF;
    ELSE
        sub_status := 'trial';
        sub_expiry := now() + (trial_days || ' days')::interval;
        plan_name := 'Trial';
        paid_amount := 0;
    END IF;

    -- Create Auth User
    new_user_id := uuid_generate_v4();
    encrypted_pw := crypt(owner_password, gen_salt('bf'));
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at
    ) VALUES (
        v_instance_id, new_user_id, 'authenticated', 'authenticated', 
        owner_email, encrypted_pw, now(), 
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object('full_name', owner_name),
        now(), now()
    );

    -- Create Profile
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (new_user_id, owner_email, owner_name, 'OWNER');

    -- Create Owner
    INSERT INTO public.restaurant_owners (user_id, max_restaurants_allowed)
    VALUES (new_user_id, 1)
    RETURNING id INTO owner_record_id;

    -- Create Restaurant
    INSERT INTO public.restaurants (
        owner_id, name, city, state, phone, email, 
        subscription_status, subscription_expiry, is_active,
        gst_number
    ) VALUES (
        owner_record_id, outlet_name, city, state, owner_phone, owner_email,
        sub_status, sub_expiry, true,
        gst_number
    )
    RETURNING id INTO restaurant_record_id;

    -- Store Settings (Business Type)
    INSERT INTO public.store_settings (restaurant_id, order_settings)
    VALUES (restaurant_record_id, jsonb_build_object('business_type', business_type));

    -- Assign Manager
    INSERT INTO public.restaurant_users (restaurant_id, user_id, role)
    VALUES (restaurant_record_id, new_user_id, 'MANAGER');

    -- Subscription Record
    INSERT INTO public.subscriptions (
        restaurant_id, plan_name, amount, billing_cycle,
        start_date, end_date, status, auto_renew
    ) VALUES (
        restaurant_record_id, plan_name, paid_amount, billing_cycle,
        current_date, sub_expiry::date, 'active', true
    );
    
    -- Invoice if Paid
    IF is_paid THEN
        INSERT INTO public.platform_invoices (
            restaurant_id, invoice_number, amount, total, status, generated_at, paid_at
        ) VALUES (
            restaurant_record_id, 
            'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4),
            paid_amount, paid_amount, 'paid', now(), now()
        );
    END IF;

    -- Log
    INSERT INTO public.audit_logs (action, actor_id, details)
    VALUES ('CREATE_OUTLET_RPC', auth.uid(), jsonb_build_object('outlet', outlet_name, 'email', owner_email));

    RETURN json_build_object('success', true, 'restaurant_id', restaurant_record_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
