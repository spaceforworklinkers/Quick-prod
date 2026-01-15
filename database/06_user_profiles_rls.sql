-- ============================================================
-- SECURE RLS POLICIES FOR user_profiles TABLE
-- ============================================================
-- This script fixes the 500 error during login while keeping RLS enabled
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop existing policies on user_profiles (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;

-- Step 2: Enable RLS (ensure it's on)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create secure policies

-- Policy 1: Any authenticated user can read their OWN profile
-- This is needed for the login flow to fetch the user's role
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Platform admins can view ALL profiles (for user management)
-- Uses a SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Platform admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (
  auth.uid() = id  -- Can always see own
  OR public.is_platform_admin()  -- Admins can see all
);

-- Policy 3: Users can update their own profile (name, etc.)
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Only platform admins can insert new profiles
CREATE POLICY "Platform admins can insert profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (
  public.is_platform_admin()
  OR NOT EXISTS (SELECT 1 FROM public.user_profiles)  -- Allow first user (bootstrap)
);

-- Policy 5: Only OWNER_SUPER_ADMIN can delete profiles
CREATE POLICY "Only owner can delete profiles"
ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'OWNER_SUPER_ADMIN'
  )
);

-- ============================================================
-- Step 4: Create the Super Admin profile
-- Replace the email with your actual email
-- ============================================================

INSERT INTO public.user_profiles (id, email, full_name, role, created_at)
VALUES (
  'aa2ea177-c017-4eea-b5f8-d0aaa5a48f92',
  'anjul@spacelinkers.com',  -- Your actual email
  'Anjul - Platform Owner',
  'OWNER_SUPER_ADMIN',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'OWNER_SUPER_ADMIN',
  full_name = 'Anjul - Platform Owner';

-- ============================================================
-- VERIFICATION: Check the policies
-- ============================================================
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
