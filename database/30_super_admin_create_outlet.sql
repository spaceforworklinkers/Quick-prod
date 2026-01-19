-- Super Admin Direct Outlet Creation (Database Function)
-- This allows Super Admin to create outlets without Edge Function deployment

CREATE OR REPLACE FUNCTION create_outlet_direct(
    p_outlet_name TEXT,
    p_owner_name TEXT,
    p_owner_email TEXT,
    p_owner_phone TEXT,
    p_business_type TEXT DEFAULT 'Restaurant',
    p_subscription_intent TEXT DEFAULT 'trial',
    p_trial_duration INTEGER DEFAULT 15,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_restaurant_id UUID;
    v_temp_password TEXT;
    v_trial_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM user_profiles WHERE email = p_owner_email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Generate temporary password (simplified for database)
    v_temp_password := 'Temp' || floor(random() * 10000)::TEXT || '!';

    -- Calculate trial expiry
    IF p_subscription_intent = 'trial' THEN
        v_trial_expiry := NOW() + (p_trial_duration || ' days')::INTERVAL;
    ELSE
        v_trial_expiry := NOW() + INTERVAL '1 month';
    END IF;

    -- Note: Auth user creation must be done via Edge Function
    -- This function only creates the database records
    -- You'll need to manually create the auth user or use the Edge Function

    -- For now, create a placeholder owner record
    INSERT INTO restaurant_owners (max_restaurants_allowed)
    VALUES (1)
    RETURNING id INTO v_owner_id;

    -- Create restaurant
    INSERT INTO restaurants (
        owner_id,
        name,
        phone,
        email,
        subscription_status,
        trial_expiry,
        is_active
    )
    VALUES (
        v_owner_id,
        p_outlet_name,
        p_owner_phone,
        p_owner_email,
        CASE WHEN p_subscription_intent = 'trial' THEN 'trial' ELSE 'active' END,
        v_trial_expiry,
        TRUE
    )
    RETURNING id INTO v_restaurant_id;

    -- Create audit log
    IF p_admin_id IS NOT NULL THEN
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            details,
            performed_by,
            created_at
        )
        VALUES (
            'CREATE_OUTLET_DIRECT',
            'restaurant',
            v_restaurant_id,
            json_build_object(
                'outlet_name', p_outlet_name,
                'owner_email', p_owner_email,
                'created_by', 'super_admin'
            ),
            p_admin_id,
            NOW()
        );
    END IF;

    RETURN json_build_object(
        'success', TRUE,
        'outlet_id', v_restaurant_id,
        'message', 'Outlet created. Auth user must be created separately.',
        'temp_password', v_temp_password
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_outlet_direct TO authenticated;

COMMENT ON FUNCTION create_outlet_direct IS 'Super Admin function to create outlets directly without approval workflow. Note: Auth user creation requires Edge Function.';
