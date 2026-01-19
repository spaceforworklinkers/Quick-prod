-- ============================================================
-- FIX: SECURE DELETE USER (BOTH PROFILE AND AUTH)
-- ============================================================

-- Function to fully delete a user
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

    -- Prevent deleting outlet owners to preserve business data integrity
    IF EXISTS (SELECT 1 FROM public.restaurant_owners WHERE user_id = target_user_id) THEN
        RAISE EXCEPTION 'Cannot delete outlet owners. Delete the outlet first.';
    END IF;
    
    -- 1. Delete associated data first
    DELETE FROM public.audit_logs WHERE performed_by = target_user_id;

    -- 2. Delete user profile (in public schema)
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    
    -- 3. CRITICAL: Delete from auth.users (in auth schema)
    -- This is the actual login credential. Without this, the user can still "login" (get a token)
    -- even if their profile is gone.
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'User permanently deleted from both Profile and Auth systems.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;
