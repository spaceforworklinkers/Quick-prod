-- ============================================
-- AUTOMATION: LEAD TO TENANT CONVERSION
-- ============================================
-- 
-- Objective: Atomic transaction to turn an Approved Lead into a functional Restaurant.
-- Triggers: When a Platform Admin clicks "Approve" on a Lead.
-- Actions:
-- 1. Create User Profile for the Owner (if not exists)
-- 2. Create Restaurant Owner record
-- 3. Create Restaurant (Tenant)
-- 4. Assign Owner Role in Restaurant Users
-- 5. Initialize Default Store Settings
-- 6. Set Subscription to Trial

CREATE OR REPLACE FUNCTION public.approve_lead_and_create_restaurant(
    lead_email TEXT,
    lead_name TEXT,
    rest_name TEXT,
    rest_phone TEXT,
    trial_days INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Must run as superuser to bypass RLS during creation
AS $$
DECLARE
    new_user_id UUID;
    new_owner_id UUID;
    new_rest_id UUID;
    temp_password TEXT;
BEGIN
    -- 1. Check or Create User (Idempotent)
    -- In a real scenario, we might trigger an Edge Function to create Auth User.
    -- For SQL-only, we assume the Auth User might already exist or we link by email.
    -- LIMITATION: We cannot create 'auth.users' record directly from PL/PGSQL easily without pg_net extensions or Supabase hooks.
    -- WORKAROUND: We will look for an existing user or RAISE ERROR if they haven't signed up yet.
    -- BETTER: We accept 'user_id' as input if we can, but let's assume we look up by email.
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = lead_email;
    
    IF new_user_id IS NULL THEN
        -- If Auth User doesn't exist, we can't proceed purely in SQL.
        -- The Frontend/API must create the Auth User first.
        -- We return a structured error.
        RETURN jsonb_build_object('success', false, 'error', 'Auth user not found. Create auth user first.');
    END IF;

    -- 2. Create/Update User Profile
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (new_user_id, lead_email, lead_name, 'OWNER')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'OWNER'; -- Upgrade them to Owner

    -- 3. Create Restaurant Owner Record
    INSERT INTO public.restaurant_owners (user_id)
    VALUES (new_user_id)
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO new_owner_id;

    -- 4. Create Restaurant
    INSERT INTO public.restaurants (
        owner_id, 
        name, 
        phone, 
        subscription_status, 
        subscription_expiry
    )
    VALUES (
        new_owner_id,
        rest_name,
        rest_phone,
        'trial',
        NOW() + (trial_days || ' days')::INTERVAL
    )
    RETURNING id INTO new_rest_id;

    -- 5. Assign Owner as 'OWNER' in restaurant_users (for permission checks)
    INSERT INTO public.restaurant_users (restaurant_id, user_id, role)
    VALUES (new_rest_id, new_user_id, 'OWNER');

    -- 6. Initialize Settings (Critical for Zero-State Safety)
    INSERT INTO public.store_settings (restaurant_id, order_settings, billing_settings, marketing_settings)
    VALUES (
        new_rest_id,
        '{"auto_accept": false, "allow_guest": true}'::jsonb,
        '{"gst_mode": "exclusive", "gst_percentage": 5}'::jsonb,
        '{"sms_enabled": false}'::jsonb
    );

    RETURN jsonb_build_object(
        'success', true, 
        'restaurant_id', new_rest_id,
        'owner_id', new_owner_id,
        'message', 'Restaurant created successfully with 15-day trial.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
