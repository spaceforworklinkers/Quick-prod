
-- Fix Infinite Recursion in RLS Policies
-- This usually happens when a policy on table A queries table B, and table B has a policy querying table A.
-- Or when checking Admin roles involves querying a table that itself relies on the policy being checked.

-- Strategy: Use 'SECURITY DEFINER' functions to bypass RLS for role checks.

-- 1. Create a secure function to check if user is an admin of a restaurant
CREATE OR REPLACE FUNCTION public.is_restaurant_admin(lookup_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres/admin), bypassing RLS
AS $$
BEGIN
  -- 1. Check if user is the Owner of the restaurant
  IF EXISTS (
    SELECT 1 FROM public.restaurants r
    JOIN public.restaurant_owners ro ON r.owner_id = ro.id
    WHERE r.id = lookup_restaurant_id
    AND ro.user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if user is ANY Staff in the restaurant
  RETURN EXISTS (
    SELECT 1 
    FROM public.restaurant_users 
    WHERE user_id = auth.uid() 
    AND restaurant_id = lookup_restaurant_id 
    -- Allow all staff to bypass RLS for reading data they have access to
    AND role IN ('MANAGER', 'STAFF', 'KITCHEN', 'ACCOUNTANT') 
  );
END;
$$;

-- 2. Update Policies to use this function
-- Example for 'orders' table
-- DROP POLICY IF EXISTS "Orders are viewable by owners" ON orders;
-- CREATE POLICY "Orders are viewable by owners" ON orders
-- FOR SELECT USING (
--   auth.uid() = customer_id -- Users can see their own orders
--   OR
--   public.is_restaurant_admin(restaurant_id) -- Admins checks via secure function
-- );

-- 3. Ensure user_roles itself is readable by the user
-- CREATE POLICY "Users can see their own roles" ON user_roles
-- FOR SELECT USING (user_id = auth.uid());
