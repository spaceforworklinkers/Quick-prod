
-- ================================================================
-- FINAL RESET FOR LOGIN (53)
-- ================================================================
-- This script force-deletes ALL policies on user_profiles to ensure
-- no hidden recursive policies remain.
-- ================================================================

BEGIN;

-- 1. DROP ALL TRIGGERS ON USER_PROFILES (To be safe)
DROP TRIGGER IF EXISTS on_profile_role_change ON public.user_profiles;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- 2. DISABLE RLS (TEMPORARILY) - This clears the state
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. DROP ALL EXISTING POLICIES (Dynamic SQL)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_profiles';
  END LOOP;
END $$;

-- 4. RE-ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREATE ONE SINGLE, SIMPLE POLICY
-- This policy has ZERO recursion. It only checks ID match.
CREATE POLICY "Simple Login Access" ON public.user_profiles 
FOR SELECT USING ( auth.uid() = id );

-- 6. SYNC METADATA (One time fix)
UPDATE auth.users u
SET raw_user_meta_data = 
  COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', p.role)
FROM public.user_profiles p
WHERE u.id = p.id;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ Login Policies Reset. Try logging in now.';
END $$;
