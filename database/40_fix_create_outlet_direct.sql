-- ============================================================
-- 40. IMPROVED CREATE OUTLET DIRECT
-- Enables Super Admin to create Outlet + Owner + Auth User in one go.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_outlet_direct_v2(
    p_outlet_name TEXT,
    p_owner_name TEXT,
    p_owner_email TEXT,
    p_owner_phone TEXT,
    p_owner_password TEXT,
    p_city TEXT,
    p_state TEXT,
    p_trial_days INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_restaurant_id UUID;
    v_trial_expiry TIMESTAMPTZ;
BEGIN
    -- 1. Authorization Check
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can create outlets directly.';
    END IF;

    -- 2. Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_owner_email;

    IF v_user_id IS NOT NULL THEN
        -- User exists, check if they are already an owner
        IF EXISTS (SELECT 1 FROM public.restaurant_owners WHERE user_id = v_user_id) THEN
            -- Existing owner, just get their ID
            SELECT id INTO v_owner_id FROM public.restaurant_owners WHERE user_id = v_user_id;
        ELSE
            -- User exists but is NOT an owner (maybe a staff member?). Upgrade them.
            -- This is risky without warnings, but for Super Admin tool, we assume intent.
            INSERT INTO public.restaurant_owners (user_id, max_restaurants_allowed)
            VALUES (v_user_id, 3) -- Give them capacity
            RETURNING id INTO v_owner_id;
            
            -- Update profile role
            UPDATE public.user_profiles SET role = 'OWNER' WHERE id = v_user_id;
        END IF;
    ELSE
        -- 3. Validation
        IF p_owner_password IS NULL OR LENGTH(p_owner_password) < 6 THEN
            RAISE EXCEPTION 'Password must be at least 6 characters for new users.';
        END IF;

        -- 4. Create New Auth User
        v_user_id := uuid_generate_v4();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            p_owner_email,
            crypt(p_owner_password, gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            json_build_object('full_name', p_owner_name),
            NOW(),
            NOW()
        );

        -- 5. Create Profile (Trigger usually handles this, but let's be explicit to ensure ROLE is correct immediately)
        INSERT INTO public.user_profiles (id, email, full_name, role)
        VALUES (v_user_id, p_owner_email, p_owner_name, 'OWNER')
        ON CONFLICT (id) DO UPDATE SET role = 'OWNER'; -- Handle race condition if trigger fired

        -- 6. Create Owner Record
        INSERT INTO public.restaurant_owners (user_id, max_restaurants_allowed)
        VALUES (v_user_id, 1)
        RETURNING id INTO v_owner_id;
    END IF;

    -- 7. Create Restaurant
    v_trial_expiry := NOW() + (p_trial_days || ' days')::INTERVAL;

    INSERT INTO public.restaurants (
        owner_id,
        name,
        phone,
        email,
        city,
        state,
        subscription_status,
        subscription_expiry,
        is_active
    ) VALUES (
        v_owner_id,
        p_outlet_name,
        p_owner_phone,
        p_owner_email,
        p_city,
        p_state,
        'trial',
        v_trial_expiry,
        TRUE
    )
    RETURNING id INTO v_restaurant_id;

    -- 8. Init Subscription Tracking
    INSERT INTO public.subscription_tracking (
        restaurant_id,
        subscription_type,
        status,
        start_date,
        end_date
    ) VALUES (
        v_restaurant_id,
        'trial',
        'active',
        CURRENT_DATE,
        v_trial_expiry::DATE
    );

    -- 9. Audit Log
    INSERT INTO public.audit_logs (
        action,
        actor_id,
        details
    ) VALUES (
        'CREATE_OUTLET_DIRECT',
        auth.uid(),
        json_build_object(
            'outlet_name', p_outlet_name,
            'owner_email', p_owner_email,
            'restaurant_id', v_restaurant_id
        )
    );

    RETURN json_build_object(
        'success', true,
        'restaurant_id', v_restaurant_id,
        'owner_id', v_owner_id,
        'user_created', (v_user_id IS NOT NULL)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
