-- ============================================================
-- 15. FIX RLS RECURSION ERROR (URGENT)
-- Solves the "Access Denied" by preventing infinite loops in security checks.
-- ============================================================

-- 1. Create a secure function to read roles WITHOUT triggering RLS loops
CREATE OR REPLACE FUNCTION public.get_my_claim_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- <--- This is the key. It bypasses RLS.
SET search_path = public, auth
AS $$
BEGIN
  RETURN (SELECT role FROM public.user_profiles WHERE id = auth.uid());
END;
$$;

-- 2. Drop the broken policy
DROP POLICY IF EXISTS "Super Admins View All" ON public.user_profiles;
DROP POLICY IF EXISTS "Platform admin view all profiles" ON public.user_profiles;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Super Admins View All"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Now safe because get_my_claim_role() bypasses RLS
    public.get_my_claim_role() IN ('SUPER_ADMIN', 'OWNER_SUPER_ADMIN')
    OR 
    auth.uid() = id
  );
