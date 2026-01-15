-- ============================================================
-- 11. ASSIGN ROLE TO ANJUL (BY ID)
-- 1. DELETE USER 'anjulforwork@gmail.com' from Supabase Dashboard.
-- 2. CREATE USER 'anjulforwork@gmail.com' manually in Dashboard.
-- 3. PASTE THE NEW USER UUID BELOW inside the quotes.
-- ============================================================

DO $$
DECLARE
  -- REPLACE THIS UUID WITH YOUR NEW USER ID
  target_user_id uuid := 'PASTE_YOUR_UUID_HERE'::uuid; 
  
  target_email text := 'anjulforwork@gmail.com';
BEGIN

  -- 1. Insert/Update into User Profiles with SUPER_ADMIN role
  INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
  VALUES (
    target_user_id,
    target_email,
    'Anjul (Super Admin)',
    'SUPER_ADMIN',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'SUPER_ADMIN',
    full_name = 'Anjul (Super Admin)',
    is_active = true;

  RAISE NOTICE 'Role SUPER_ADMIN assigned to user ID: %', target_user_id;

END $$;
