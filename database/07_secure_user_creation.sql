-- ============================================================
-- SECURE USER CREATION RPC (FIXED v3)
-- Allows OWNER_SUPER_ADMIN to create new users directly.
-- v3: Includes DROP FUNCTION to handle parameter name changes.
-- ============================================================

-- 1. CLEANUP: Remove the old function with the old parameter names
DROP FUNCTION IF EXISTS public.create_platform_user(text, text, text, text);

-- 2. CREATE EXTENSION: Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. DEFINE THE NEW FUNCTION
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
  -- A. SECURITY CHECK (Explicit column reference)
  SELECT up.role INTO current_user_role 
  FROM public.user_profiles up 
  WHERE up.id = auth.uid();
  
  IF current_user_role NOT IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to create users.';
  END IF;

  -- B. Generate ID
  new_user_id := gen_random_uuid();
  
  -- C. Create User in Supabase Auth
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
    'authenticated', -- Supabase role
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

  -- D. Insert into public.user_profiles
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
