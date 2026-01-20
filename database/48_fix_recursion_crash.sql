-- ============================================
-- MIGRATION 48: Fix RLS Infinite Recursion
-- ============================================
-- Purpose: Fix 500 Errors caused by self-referencing RLS policies on user_profiles
-- Strategy: Use SECURITY DEFINER function to break the loop

-- 1. Ensure the Helper Function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Critical: Bypasses RLS to prevent recursion
SET search_path = public -- Secure search path
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
  );
$$;

-- 2. Fix user_profiles Policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Super admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    -- Use the function instead of direct table query
    public.is_platform_admin() 
    OR 
    auth.uid() = id -- Users can always see themselves
  );

-- 3. Fix restaurants Policy
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
CREATE POLICY "Super admins can manage all restaurants"
  ON public.restaurants FOR ALL
  USING (
    public.is_platform_admin()
  );

-- 4. Fix restaurant_owners Policy
DROP POLICY IF EXISTS "Super admins can manage all owners" ON public.restaurant_owners;
CREATE POLICY "Super admins can manage all owners"
  ON public.restaurant_owners FOR ALL
  USING (
    public.is_platform_admin()
  );

-- 5. Fix restaurant_users Policy (from Migration 47)
-- Re-apply with safe function
DROP POLICY IF EXISTS "Tenant scoped access - restaurant_users" ON restaurant_users;
CREATE POLICY "Tenant scoped access - restaurant_users"
  ON public.restaurant_users FOR ALL
  USING (
    user_id = auth.uid()
    OR
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() 
      OR (ru.user_id = auth.uid() AND ru.role = 'MANAGER')
    )
    OR
    public.is_platform_admin() -- Safe check
  );

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_platform_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin TO service_role;
