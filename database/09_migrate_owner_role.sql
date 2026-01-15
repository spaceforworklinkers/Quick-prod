-- ============================================================
-- 09. MIGRATE OWNER_SUPER_ADMIN TO SUPER_ADMIN
-- This script fixes your account access by migrating the role.
-- ============================================================

-- 1. Update your specific user profile (and any others)
UPDATE public.user_profiles
SET role = 'SUPER_ADMIN'
WHERE role = 'OWNER_SUPER_ADMIN';

-- 2. Update Table Constraints to remove OWNER_SUPER_ADMIN
-- We need to drop the old check constraint and add a new one

-- user_profiles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT', 'OWNER', 'KITCHEN'));

-- 3. Update RLS Policies (Clean up old role references)
-- (Supabase might keep old policies content, but future inserts need to be clean)

-- Fix Policies for user_profiles
DROP POLICY IF EXISTS "Platform admins can insert profiles" ON public.user_profiles;
CREATE POLICY "Platform admins can insert profiles" ON public.user_profiles
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  OR NOT EXISTS (SELECT 1 FROM public.user_profiles) -- Bootstrapping
);

DROP POLICY IF EXISTS "Only owner can delete profiles" ON public.user_profiles;
CREATE POLICY "Super admin can delete profiles" ON public.user_profiles
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- Fix Policies for restaurants
DROP POLICY IF EXISTS "Super admins can manage all restaurants" ON public.restaurants;
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- Fix Policies for audit_logs (from previous step 08)
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 4. Update the stored function for Create User (from step 07/10)
DROP FUNCTION IF EXISTS public.create_platform_user(text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_platform_user(
  param_email text,
  param_password text,
  param_full_name text,
  param_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  current_user_role text;
BEGIN
  -- 1. SECURITY CHECK
  SELECT up.role INTO current_user_role 
  FROM public.user_profiles up 
  WHERE up.id = auth.uid();
  
  -- Updated Check: Only SUPER_ADMIN can create users now
  IF current_user_role NOT IN ('SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to create users.';
  END IF;

  -- 2. Generate ID
  new_user_id := gen_random_uuid();
  
  -- 3. Create User in Supabase Auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    param_email,
    crypt(param_password, gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', param_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- 4. Insert into public.user_profiles
  INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
  VALUES (
    new_user_id,
    param_email,
    param_full_name,
    param_role,
    true
  );

  RETURN new_user_id;
END;
$$;
