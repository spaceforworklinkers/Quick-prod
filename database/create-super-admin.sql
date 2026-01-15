-- Create Initial Super Admin User
-- Email: admin@quickservepos.com
-- Password: admin123
-- Role: OWNER_SUPER_ADMIN

-- IMPORTANT: Run this AFTER running schema.sql

-- Step 1: Create user in Supabase Auth (via Dashboard)
-- Go to Authentication → Users → Add User
-- Email: admin@quickservepos.com
-- Password: admin123
-- Auto Confirm: YES
-- Copy the User ID after creation

-- Step 2: Insert into user_profiles
-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from Step 1

INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES (
  'PASTE_USER_ID_HERE'::uuid,
  'admin@quickservepos.com',
  'Super Admin',
  'OWNER_SUPER_ADMIN',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verify the user was created
SELECT id, email, full_name, role, is_active, created_at
FROM public.user_profiles
WHERE email = 'admin@quickservepos.com';
