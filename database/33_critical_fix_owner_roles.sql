-- CRITICAL FIX: Update user_profiles constraint to allow OWNER role
-- Then fix outlet owner roles

-- 1. Drop and recreate the constraint to include OWNER
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT', 'OWNER', 'KITCHEN', 'OWNER_SUPER_ADMIN'));

-- 2. Now fix the outlet owner roles
UPDATE user_profiles 
SET role = 'OWNER' 
WHERE role = 'OWNER_SUPER_ADMIN'
AND id IN (
    SELECT ro.user_id 
    FROM restaurant_owners ro
);

-- 3. Remove OWNER_SUPER_ADMIN from allowed roles (now that we've fixed existing data)
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT', 'OWNER', 'KITCHEN'));

-- 4. Verify the fix
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role as current_role,
    CASE 
        WHEN EXISTS (SELECT 1 FROM restaurant_owners WHERE user_id = up.id) THEN 'OWNER (Outlet Owner)'
        ELSE 'Platform User'
    END as user_type
FROM user_profiles up
WHERE EXISTS (SELECT 1 FROM restaurant_owners WHERE user_id = up.id)
OR up.role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT');

-- 5. Summary
SELECT 
    'Fixed' as status,
    COUNT(*) as outlet_owners_fixed
FROM user_profiles
WHERE role = 'OWNER'
AND id IN (SELECT user_id FROM restaurant_owners);
