-- ============================================================
-- 12. FORCE CLEANUP CORRUPTED USER
-- Removes references from public tables so Auth user can be deleted.
-- ============================================================

-- 1. Identify the user ID first (optional verification)
-- SELECT id FROM auth.users WHERE email = 'anjulforwork@gmail.com';

-- 2. Delete from public.user_profiles (Cascade should handle this, but manual is safer for stuck users)
DELETE FROM public.user_profiles WHERE email = 'anjulforwork@gmail.com';

-- 3. Delete from public.restaurant_owners (if any)
DELETE FROM public.restaurant_owners WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'anjulforwork@gmail.com'
);

-- 4. Delete from auth.users (This is the usually restricted part, but works if we are Postgres role)
-- Try this. If it fails due to permissions, you must use the Dashboard.
-- But clearing the child tables above usually fixes "Database error loading user" in Dashboard.

DELETE FROM auth.users WHERE email = 'anjulforwork@gmail.com';
