-- ============================================================
-- 13. SUPER ADMIN ACTION SUITE
-- Implements secure RPCs for Deleting, Banning, and Resetting Passwords.
-- ============================================================

-- A. DELETE USER (Hard Delete)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_platform_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  -- 1. Security Check
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  
  IF caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can delete users.';
  END IF;

  -- 2. Prevent Self-Deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operation Failed: You cannot delete your own account.';
  END IF;

  -- 3. Delete from auth.users (Cascades to profiles/owners automatically)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- B. TOGGLE BAN STATUS (Soft Ban)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_user_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  -- 1. Security Check
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  
  IF caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can manage user status.';
  END IF;

  -- 2. Prevent Self-Ban
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Operation Failed: You cannot ban your own account.';
  END IF;

  -- 3. Update Status
  UPDATE public.user_profiles 
  SET is_active = new_status, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- C. RESET PASSWORD
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_role text;
BEGIN
  -- 1. Security Check
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  
  IF caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can reset passwords.';
  END IF;

  -- 2. Update Password in Auth
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;
