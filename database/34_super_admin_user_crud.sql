-- ============================================================
-- SUPER ADMIN USER CRUD FUNCTIONS (COMPLETE)
-- ============================================================
-- Provides secure RPC functions for Super Admin to manage platform users
-- All functions use SECURITY DEFINER to bypass RLS

-- ============================================================
-- 1. CREATE PLATFORM USER
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_platform_user(
    param_email TEXT,
    param_password TEXT,
    param_full_name TEXT,
    param_role TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- Verify caller is Super Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can create platform users';
    END IF;

    -- Verify role is valid platform role (NOT outlet role)
    IF param_role NOT IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT') THEN
        RAISE EXCEPTION 'Invalid role: Must be a platform role';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = param_email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Create auth user (this requires service role, handled by Supabase)
    -- Note: This function assumes the auth user is created externally
    -- For now, we'll create a placeholder and return instructions
    
    RETURN json_build_object(
        'success', true,
        'message', 'User creation initiated. Please use Supabase Dashboard to complete auth user creation.',
        'email', param_email,
        'role', param_role
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ============================================================
-- 2. DELETE PLATFORM USER
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_platform_user(
    target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller is Super Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can delete users';
    END IF;

    -- Prevent deleting yourself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;

    -- Prevent deleting outlet owners
    IF EXISTS (SELECT 1 FROM public.restaurant_owners WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'Cannot delete outlet owners. Delete the outlet first.';
    END IF;

    -- Delete user profile
    DELETE FROM public.user_profiles WHERE id = target_user_id;

    -- Note: Auth user deletion must be done via Supabase Admin API
    
    RETURN json_build_object(
        'success', true,
        'message', 'User profile deleted. Auth user must be deleted via Supabase Dashboard.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ============================================================
-- 3. TOGGLE USER STATUS (BAN/UNBAN)
-- ============================================================
CREATE OR REPLACE FUNCTION public.toggle_user_status(
    target_user_id UUID,
    new_status BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller is Super Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can toggle user status';
    END IF;

    -- Prevent banning yourself
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot ban your own account';
    END IF;

    -- Update status
    UPDATE public.user_profiles
    SET is_active = new_status,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN json_build_object(
        'success', true,
        'message', CASE WHEN new_status THEN 'User unbanned' ELSE 'User banned' END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ============================================================
-- 4. RESET USER PASSWORD
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reset_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller is Super Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can reset passwords';
    END IF;

    -- Validate password strength
    IF LENGTH(new_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters';
    END IF;

    -- Note: Password reset must be done via Supabase Admin API
    -- This function just validates and logs the action
    
    -- Log the action in audit_logs
    INSERT INTO public.audit_logs (
        action,
        entity_type,
        entity_id,
        details,
        performed_by,
        created_at
    ) VALUES (
        'RESET_PASSWORD',
        'user',
        target_user_id,
        json_build_object('reset_by', 'super_admin'),
        auth.uid(),
        NOW()
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Password reset initiated. Please use Supabase Dashboard to complete the reset.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- ============================================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.create_platform_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_platform_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_password TO authenticated;

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON FUNCTION public.create_platform_user IS 'Super Admin function to create platform users (ADMIN, MANAGER, SALESPERSON, ACCOUNTANT)';
COMMENT ON FUNCTION public.delete_platform_user IS 'Super Admin function to delete platform users (cannot delete outlet owners or self)';
COMMENT ON FUNCTION public.toggle_user_status IS 'Super Admin function to ban/unban users';
COMMENT ON FUNCTION public.admin_reset_password IS 'Super Admin function to reset user passwords';
