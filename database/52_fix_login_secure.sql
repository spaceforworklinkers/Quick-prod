
-- ================================================================
-- PERMANENT SECURE FIX FOR LOGIN & 500 ERRORS
-- ================================================================
-- Root Cause: Infinite Recursion Loop in RLS Policies.
-- Solution: Move Role Check to JWT Metadata (Zero DB Permission Lookups).
-- Security: Maintains strict access control without database loops.
-- ================================================================

BEGIN;

-- 1. MIGRATION: Sync 'role' from user_profiles to auth.users metadata
-- This ensures the JWT token contains the role for instant secure checks.
UPDATE auth.users u
SET raw_user_meta_data = 
  COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', p.role)
FROM public.user_profiles p
WHERE u.id = p.id;

-- 2. UPDATE FUNCTION: is_platform_admin
-- Now strictly checks the JWT Token. NO Database Reads = NO Recursion.
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'), 
    ''
  ) IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN');
$$;

-- 3. FIX POLICIES (User Profiles)
-- Remove the recursive 'EXISTS' check. Use the safe function.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (
    auth.uid() = id 
    OR 
    public.is_platform_admin() -- Safe check via JWT
);

-- 4. FIX POLICIES (Restaurants)
-- Ensure Admin check is safe
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants
FOR ALL USING ( 
    public.is_platform_admin() 
);

-- 5. FIX POLICIES (Restaurant Owners)
DROP POLICY IF EXISTS "Super admins can manage all owners" ON public.restaurant_owners;
CREATE POLICY "Super admins can manage all owners" ON public.restaurant_owners
FOR ALL USING ( 
    public.is_platform_admin() 
);

-- 6. ENSURE NEW USERS GET ROLE IN METADATA (Trigger)
-- We need to ensure that when a profile is updated/inserted, the metadata is synced.
CREATE OR REPLACE FUNCTION public.sync_user_role_to_metadata()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, extensions
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.user_profiles;
CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE OF role ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_metadata();

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ Secure Login Fix Applied. Recursion Eliminated.';
END $$;
