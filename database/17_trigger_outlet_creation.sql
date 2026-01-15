
-- TRIGGER: Create Outlet when a Request is APPROVED
CREATE OR REPLACE FUNCTION public.approve_conversion_request()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to create auth users
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id uuid;
    generated_password text;
    new_restaurant_id uuid;
BEGIN
    -- Only run if status changes to APPROVED
    IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
        
        -- 1. Generate secure random password
        generated_password := 'QS-' || substr(md5(random()::text), 1, 8);
        
        -- 2. Create User in auth.users (if not exists)
        BEGIN
            INSERT INTO auth.users (
                email, 
                encrypted_password, 
                email_confirmed_at, 
                raw_app_meta_data, 
                raw_user_meta_data,
                aud, 
                role
            )
            VALUES (
                NEW.owner_email,
                crypt(generated_password, gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object('full_name', 'Owner ' || NEW.outlet_name),
                'authenticated',
                'authenticated'
            )
            RETURNING id INTO new_user_id;
        EXCEPTION WHEN unique_violation THEN
            -- If user exists, get ID
            SELECT id INTO new_user_id FROM auth.users WHERE email = NEW.owner_email;
        END;

        -- 3. Create Restaurant (Tenant)
        INSERT INTO public.restaurants (
            name,
            subscription_status,
            trial_expiry
        )
        VALUES (
            NEW.outlet_name,
            'trial',
            NOW() + (NEW.trial_days || ' days')::INTERVAL
        )
        RETURNING id INTO new_restaurant_id;

        -- 4. Create User Profile
        INSERT INTO public.user_profiles (
            id,
            role,
            is_active
        )
        VALUES (
            new_user_id,
            'OWNER',
            true
        )
        ON CONFLICT (id) DO UPDATE 
        SET role = 'OWNER'; -- Ensure they get OWNER role

        -- 5. Link Owner to Restaurant
        INSERT INTO public.restaurant_owners (
            restaurant_id,
            owner_id,
            is_primary
        )
        VALUES (
            new_restaurant_id,
            new_user_id,
            true
        );

        -- 6. Log Approval Timestamp
        NEW.approved_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- CREATE TRIGGER
DROP TRIGGER IF EXISTS on_approve_request ON public.conversion_requests;
CREATE TRIGGER on_approve_request
    BEFORE UPDATE ON public.conversion_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.approve_conversion_request();
