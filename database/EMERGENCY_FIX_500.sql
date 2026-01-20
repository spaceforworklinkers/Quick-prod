
-- ================================================================
-- EMERGENCY FIX FOR 500 ERRORS (Infinite Recursion)
-- ================================================================
-- This script temporarily disables Row Level Security (RLS) on key tables.
-- The 500 Error is caused by a recursive permission check (Loop).
-- Disabling RLS breaks the loop and restores access immediately.
-- ================================================================

BEGIN;

-- 1. Disable RLS on User Profiles (Main Cause of Login 500)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on other potential recursive tables
ALTER TABLE public.restaurant_owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- 3. Notify
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Disabled. 500 Errors should be resolved.';
  RAISE NOTICE '⚠️ SECURITY WARNING: Database is now open. Re-enable RLS after fixing the recursive policy.';
END $$;

COMMIT;
