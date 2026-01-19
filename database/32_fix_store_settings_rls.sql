-- Fix store_settings RLS policy for new outlet owners during onboarding
-- Issue: New owners can't access store_settings during onboarding setup

-- Drop existing policy
DROP POLICY IF EXISTS "Strict Isolation: store_settings" ON store_settings;

-- Create new policy with proper owner check
CREATE POLICY "Store settings access for owners and admins"
ON store_settings
FOR ALL 
USING (
    -- Check if user is the owner of the restaurant
    EXISTS (
        SELECT 1 FROM public.restaurants r
        JOIN public.restaurant_owners ro ON r.owner_id = ro.id
        WHERE r.id = store_settings.restaurant_id
        AND ro.user_id = auth.uid()
    )
    OR
    -- Check if user is staff of the restaurant
    EXISTS (
        SELECT 1 FROM public.restaurant_users ru
        WHERE ru.restaurant_id = store_settings.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('MANAGER', 'STAFF', 'KITCHEN', 'ACCOUNTANT')
    )
    OR
    -- Platform admins can access all
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN')
    )
)
WITH CHECK (
    -- Same check for INSERT/UPDATE
    EXISTS (
        SELECT 1 FROM public.restaurants r
        JOIN public.restaurant_owners ro ON r.owner_id = ro.id
        WHERE r.id = store_settings.restaurant_id
        AND ro.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.restaurant_users ru
        WHERE ru.restaurant_id = store_settings.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('MANAGER', 'STAFF')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN')
    )
);

COMMENT ON POLICY "Store settings access for owners and admins" ON store_settings 
IS 'Allows restaurant owners and staff to manage store settings, platform admins have full access';
