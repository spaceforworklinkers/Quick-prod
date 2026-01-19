-- ============================================================
-- FIX: SECURE DELETE USER + CREATE AUDIT LOG COLUMNS
-- ============================================================

-- 1. Ensure `audit_logs` has the `performed_by` column if it's missing.
-- The current schema uses `actor_id`, but the deletion script tried to use `performed_by`.
-- We will consolidate to use `actor_id` which is the standard in schema 08.
-- Note: 'details' is JSONB in some versions, TEXT in others. We cast to be safe.

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.user_profiles(id);

-- 2. Update the delete function to use the CORRECT column name (actor_id)
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
    
    -- 1. Delete associated data first using the CORRECT column name
    -- We delete logs where this user was the ACTOR (actor_id)
    DELETE FROM public.audit_logs WHERE actor_id = target_user_id;

    -- 2. Delete user profile (in public schema)
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    
    -- 3. CRITICAL: Delete from auth.users (in auth schema)
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
