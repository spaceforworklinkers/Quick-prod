-- IMPORTANT: Ensure you have (Re)Run 'fix-rls-recursion.sql' first!

-- 1. Secure Restaurant Assignments (Staff)
-- Allows users to see which restaurants they work at (prevents recursion if queried)
DROP POLICY IF EXISTS "Users can see own assignments" ON restaurant_users;
CREATE POLICY "Users can see own assignments" ON restaurant_users
FOR SELECT USING (user_id = auth.uid());

-- 2. Secure Owner Records
-- Allows owners to see their own owner profile
DROP POLICY IF EXISTS "Owners can see own record" ON restaurant_owners;
CREATE POLICY "Owners can see own record" ON restaurant_owners
FOR SELECT USING (user_id = auth.uid());

-- 3. Secure Orders Access
-- Uses the non-recursive function for Admin check
DROP POLICY IF EXISTS "Orders viewable by owners and customers" ON orders;
CREATE POLICY "Orders viewable by owners and customers" ON orders 
FOR SELECT USING (
  public.is_restaurant_admin(restaurant_id)
);

-- 4. Secure Restaurant Tables
DROP POLICY IF EXISTS "Tables editable by owners" ON restaurant_tables;
CREATE POLICY "Tables editable by owners" ON restaurant_tables 
FOR ALL USING (
  public.is_restaurant_admin(restaurant_id)
);
