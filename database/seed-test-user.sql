-- SEED SCRIPT: Create Demo User & Restaurant
-- Usage: Run this in Supabase SQL Editor

-- 1. Constants (Hardcoded in this script for Supabase SQL Editor compatibility)
-- User Email: demo@example.com
-- User Pass: password123
-- Restaurant ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

BEGIN;

-- 2. Create Auth User (if not exists)
INSERT INTO auth.users (
  id,
  instance_id,
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
)
SELECT 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', -- Fixed User ID
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@example.com',
  crypt('password123', gen_salt('bf')), -- Encrypted Password
  NOW(),
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Owner"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@example.com');

-- 3. Create Public Profile
INSERT INTO public.user_profiles (id, email, full_name, role)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00',
  'demo@example.com',
  'Demo Owner',
  'OWNER_SUPER_ADMIN'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create Restaurant Owner Record
INSERT INTO public.restaurant_owners (user_id, max_restaurants_allowed)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 5)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Create Restaurant (The Outlet)
-- ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
INSERT INTO public.restaurants (
    id, 
    owner_id, 
    name, 
    address, 
    city, 
    subscription_status
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    (SELECT id FROM public.restaurant_owners WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00'),
    'Demo Cafe',
    '123 Tech Street',
    'Startup City',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Assign User as Manager (for explicit access)
INSERT INTO public.restaurant_users (restaurant_id, user_id, role)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00',
    'MANAGER'
)
ON CONFLICT (restaurant_id, user_id) DO NOTHING;

-- 7. Add Tables for Heatmap testing
INSERT INTO public.restaurant_tables (restaurant_id, table_number, capacity, floor)
VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'T1', 4, 'Ground'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'T2', 2, 'Ground'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'T3', 6, 'Patio')
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

COMMIT;
