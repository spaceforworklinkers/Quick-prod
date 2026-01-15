-- ============================================================
-- 10. FORCE CREATE ANJUL (CLEAN SLATE)
-- Deletes any existing 'anjulforwork@gmail.com' and creates fresh.
-- ============================================================

-- 1. Clean up old user (if exists) via User Profiles
-- This cascades to auth.users if foreign keys are set up, 
-- but usually auth.users is the parent. 
-- Since we can't delete from auth.users easily in all Supabase setups without strict permissions,
-- we will try to Insert. If it exists, we assume the password might be wrong, so we UPDATE it.

DO $$
DECLARE
  target_email text := 'anjulforwork@gmail.com';
  target_pass text := 'Anjul@9027';
  new_user_id uuid;
BEGIN

  -- A. Check if user exists in auth.users
  SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;

  IF new_user_id IS NOT NULL THEN
    -- User exists: Update Password and Ensure Role
    RAISE NOTICE 'User % exists (ID: %). Updating password and role...', target_email, new_user_id;
    
    UPDATE auth.users
    SET encrypted_password = crypt(target_pass, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = new_user_id;
    
    -- Ensure profile exists and has SUPER_ADMIN role
    INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
    VALUES (new_user_id, target_email, 'Anjul (Super Admin)', 'SUPER_ADMIN', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'SUPER_ADMIN', is_active = true;
    
  ELSE
    -- User does NOT exist: Create fresh
    new_user_id := uuid_generate_v4();
    RAISE NOTICE 'Creating fresh user % (ID: %)...', target_email, new_user_id;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
      target_email, crypt(target_pass, gen_salt('bf')), NOW(),
      '{"provider": "email", "providers": ["email"]}', 
      jsonb_build_object('full_name', 'Anjul (Super Admin)'), 
      NOW(), NOW()
    );

    INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
    VALUES (new_user_id, target_email, 'Anjul (Super Admin)', 'SUPER_ADMIN', true);
    
  END IF;

END $$;
