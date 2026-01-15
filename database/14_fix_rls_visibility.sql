-- ============================================================
-- 14. FIX RLS VISIBILITY FOR USERS
-- Ensures Super Admins can SELECT from user_profiles.
-- ============================================================

-- 1. Drop existing policy if it's too restrictive
DROP POLICY IF EXISTS "Platform admin view all profiles" ON public.user_profiles;

-- 2. Create a broader policy for Super Admins
CREATE POLICY "Super Admins View All"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is a Super Admin
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'OWNER_SUPER_ADMIN')
    OR 
    -- Allow user to view their own profile
    auth.uid() = id
  );

-- 3. Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
