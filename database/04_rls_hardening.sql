-- ============================================
-- AUDIT & HARDENING REPORT: RLS SECURITY
-- ============================================
--
-- Objective: Ensure strict tenant isolation.
-- Policy Strategy: 
-- 1. All queries MUST verify 'restaurant_id' checks.
-- 2. Checks must use `public.is_restaurant_admin(restaurant_id)` function which is SECURITY DEFINER.
--    This prevents infinite recursion loop when querying user roles.
-- 3. Super Admins bypass checks.

-- ============================================
-- 1. UTILITY FUNCTION (SECURITY DEFINER)
-- ============================================
-- Re-defining for absolute certainty this exists and is correct.

CREATE OR REPLACE FUNCTION public.is_restaurant_admin(lookup_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Essential: Runs as owner to bypass recursive RLS checks
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
    AND role IN ('MANAGER', 'STAFF', 'KITCHEN', 'ACCOUNTANT') -- Explicit role check
  );
END;
$$;

-- ============================================
-- 2. MENU & INVENTORY (OPERATIONAL DATA)
-- ============================================

-- Menu Categories
DROP POLICY IF EXISTS "Start menu_categories Isolation" ON menu_categories;
CREATE POLICY "Strict Isolation: menu_categories" ON menu_categories
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id) 
    OR 
    public.is_platform_admin() -- separate helper for super admins
);

-- Menu Items
DROP POLICY IF EXISTS "Strict Isolation: menu_items" ON menu_items;
CREATE POLICY "Strict Isolation: menu_items" ON menu_items
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- Inventory Items
DROP POLICY IF EXISTS "Strict Isolation: inventory_items" ON inventory_items;
CREATE POLICY "Strict Isolation: inventory_items" ON inventory_items
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- Stock Logs
DROP POLICY IF EXISTS "Strict Isolation: stock_logs" ON stock_logs;
CREATE POLICY "Strict Isolation: stock_logs" ON stock_logs
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- ============================================
-- 3. ORDERS & SALES (SENSITIVE DATA)
-- ============================================

-- Orders
DROP POLICY IF EXISTS "Strict Isolation: orders" ON orders;
CREATE POLICY "Strict Isolation: orders" ON orders
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- Order Items (Must link to Orders, but ideally also check Restaurant directly for speed)
-- Note: schema says order_items doesn't have restaurant_id directly? 
-- Wait, schema says: "menu_item_id UUID...". It does NOT have restaurant_id?
-- CHECK SCHEMAS: Schema usually puts restaurant_id on orders. 
-- Order Items rely on their parent Order.
-- So we need RLS on order_items that checks the parent order.

DROP POLICY IF EXISTS "Strict Isolation: order_items" ON order_items;
CREATE POLICY "Strict Isolation: order_items" ON order_items
FOR ALL USING (
   EXISTS (
       SELECT 1 FROM public.orders o
       WHERE o.id = order_items.order_id
       AND (public.is_restaurant_admin(o.restaurant_id) OR public.is_platform_admin())
   )
);

-- Sales Summary
DROP POLICY IF EXISTS "Strict Isolation: sales_summary" ON sales_summary;
CREATE POLICY "Strict Isolation: sales_summary" ON sales_summary
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- Platform Invoices
DROP POLICY IF EXISTS "Strict Isolation: platform_invoices" ON platform_invoices;
CREATE POLICY "Strict Isolation: platform_invoices" ON platform_invoices
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- Store Settings
DROP POLICY IF EXISTS "Strict Isolation: store_settings" ON store_settings;
CREATE POLICY "Strict Isolation: store_settings" ON store_settings
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR public.is_platform_admin()
);

-- ============================================
-- 4. CUSTOMERS & SESSIONS
-- ============================================

-- QR Sessions
DROP POLICY IF EXISTS "Strict Isolation: qr_sessions" ON qr_sessions;
CREATE POLICY "Strict Isolation: qr_sessions" ON qr_sessions
FOR ALL USING (
    public.is_restaurant_admin(restaurant_id)
    OR (is_active = true AND expires_at > NOW()) -- Public access allowed ONLY if active
);


-- ============================================
-- 5. HELPER FOR PLATFORM ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
  );
$$;

