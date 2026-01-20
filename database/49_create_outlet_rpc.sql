-- ============================================
-- MIGRATION 49: Direct SQL Outlet Creation (Bypass Edge Function)
-- ============================================
-- Purpose: Allow Platform Admins to create outlets directly via SQL RPC
--          This bypasses Edge Function Auth/CORS issues permanently.

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the RPC Function
CREATE OR REPLACE FUNCTION create_outlet_direct_v2(
    outlet_name text,
    owner_name text,
    owner_email text,
    owner_phone text,
    owner_password text,
    city text DEFAULT '',
    state text DEFAULT '',
    trial_days int DEFAULT 14
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Run as superuser to access auth schema
SET search_path = public, auth, extensions -- Secure search path
AS $$
DECLARE
    new_user_id uuid;
    owner_record_id uuid;
    restaurant_record_id uuid;
    encrypted_pw text;
BEGIN
    -- 1. Security Check: Verify Caller is Platform Admin
    -- (Relies on is_platform_admin from Migration 48 or 04)
    IF NOT public.is_platform_admin() THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: Only Platform Admins can create outlets.');
    END IF;

    -- 2. Check if user exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = owner_email) THEN
        RETURN json_build_object('success', false, 'error', format('User with email %s already exists', owner_email));
    END IF;

    -- 3. Create Auth User
    new_user_id := uuid_generate_v4();
    encrypted_pw := crypt(owner_password, gen_salt('bf'));
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
        owner_email, encrypted_pw, now(), 
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object('full_name', owner_name),
        now(), now()
    );

    -- 4. Create Public Profile
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (new_user_id, owner_email, owner_name, 'OWNER');

    -- 5. Create Owner Record
    INSERT INTO public.restaurant_owners (user_id, max_restaurants_allowed)
    VALUES (new_user_id, 1)
    RETURNING id INTO owner_record_id;

    -- 6. Create Restaurant
    INSERT INTO public.restaurants (
        owner_id, name, city, state, phone, email, 
        subscription_status, subscription_expiry, is_active
    ) VALUES (
        owner_record_id, outlet_name, city, state, owner_phone, owner_email,
        'trial', now() + (trial_days || ' days')::interval, true
    )
    RETURNING id INTO restaurant_record_id;

    -- 7. Assign Manager Role
    INSERT INTO public.restaurant_users (restaurant_id, user_id, role)
    VALUES (restaurant_record_id, new_user_id, 'MANAGER');

    -- 8. Init Subscription Tracking
    INSERT INTO public.subscription_tracking (
        restaurant_id, subscription_type, status, start_date, end_date
    ) VALUES (
        restaurant_record_id, 'trial', 'active', now(), now() + (trial_days || ' days')::interval
    );

    -- 9. Audit Log
    INSERT INTO public.audit_logs (action, actor_id, details)
    VALUES (
        'CREATE_OUTLET_RPC', 
        auth.uid(), 
        jsonb_build_object(
            'outlet_name', outlet_name,
            'owner_email', owner_email,
            'restaurant_id', restaurant_record_id
        )
    );

    RETURN json_build_object(
        'success', true,
        'restaurant_id', restaurant_record_id,
        'owner_id', owner_record_id,
        'user_id', new_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
