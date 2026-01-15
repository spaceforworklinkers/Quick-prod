-- QuickServe POS - Complete Database Schema
-- Multi-Tenant SaaS Restaurant POS Platform
-- Generated: 2026-01-14

-- ============================================
-- SECTION 1: EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SECTION 2: CORE USER TABLES
-- ============================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'OWNER_SUPER_ADMIN',
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'SALESPERSON',
    'ACCOUNTANT',
    'STAFF',
    'KITCHEN'
  )),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Owners
CREATE TABLE IF NOT EXISTS public.restaurant_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  max_restaurants_allowed INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Restaurants (Tenants)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.restaurant_owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  gst_number TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (
    subscription_status IN ('trial', 'active', 'suspended', 'expired')
  ),
  subscription_expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Users (Staff assignments)
CREATE TABLE IF NOT EXISTS public.restaurant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('MANAGER', 'STAFF', 'ACCOUNTANT', 'KITCHEN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- ============================================
-- SECTION 3: MENU & INVENTORY TABLES
-- ============================================

-- Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_alert_level DECIMAL(10,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Ingredients (Recipe tracking)
CREATE TABLE IF NOT EXISTS public.menu_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Logs (Inventory history)
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  change_qty DECIMAL(10,2) NOT NULL,
  reason TEXT CHECK (reason IN ('sale', 'purchase', 'manual', 'adjustment', 'wastage')),
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 4: OPERATIONS TABLES
-- ============================================

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  floor TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  order_type TEXT CHECK (order_type IN ('dine_in', 'takeaway', 'delivery', 'qr')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_kitchen', 'ready', 'completed', 'cancelled')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(restaurant_id, order_number)
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Sessions (for customer self-ordering)
CREATE TABLE IF NOT EXISTS public.qr_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

-- ============================================
-- SECTION 5: BUSINESS & ANALYTICS TABLES
-- ============================================

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Invoices
CREATE TABLE IF NOT EXISTS public.platform_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Sales Summary (Daily aggregation)
CREATE TABLE IF NOT EXISTS public.sales_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Store Settings (JSONB for flexibility)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID UNIQUE NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  whatsapp_settings JSONB DEFAULT '{}'::jsonb,
  billing_settings JSONB DEFAULT '{}'::jsonb,
  marketing_settings JSONB DEFAULT '{}'::jsonb,
  order_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 6: INDEXES FOR PERFORMANCE
-- ============================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON public.restaurants(subscription_status);

-- Restaurant Users
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON public.restaurant_users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id ON public.restaurant_users(user_id);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_date ON public.orders(restaurant_id, created_at DESC);

-- Sales Summary
CREATE INDEX IF NOT EXISTS idx_sales_summary_restaurant_date ON public.sales_summary(restaurant_id, date DESC);

-- Stock Logs
CREATE INDEX IF NOT EXISTS idx_stock_logs_restaurant_id ON public.stock_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_inventory_item_id ON public.stock_logs(inventory_item_id);

-- ============================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Restaurant Owners Policies
CREATE POLICY "Owners can view own record"
  ON public.restaurant_owners FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all owners"
  ON public.restaurant_owners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Restaurants Policies
CREATE POLICY "Owners can view own restaurants"
  ON public.restaurants FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM public.restaurant_owners
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant staff can view assigned restaurant"
  ON public.restaurants FOR SELECT
  USING (
    id IN (
      SELECT restaurant_id FROM public.restaurant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all restaurants"
  ON public.restaurants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Generic tenant-scoped policy for operational tables
CREATE POLICY "Tenant scoped access - menu_categories"
  ON public.menu_categories FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - menu_items"
  ON public.menu_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - inventory_items"
  ON public.inventory_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - restaurant_tables"
  ON public.restaurant_tables FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - orders"
  ON public.orders FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - stock_logs"
  ON public.stock_logs FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Tenant scoped access - sales_summary"
  ON public.sales_summary FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    )
  );

-- QR Sessions - Public read for active sessions
CREATE POLICY "Public can view active QR sessions"
  ON public.qr_sessions FOR SELECT
  USING (is_active = true AND expires_at > NOW());

CREATE POLICY "Restaurant staff can manage QR sessions"
  ON public.qr_sessions FOR ALL
  USING (
    restaurant_id IN (
      SELECT r.id FROM public.restaurants r
      LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
      LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
      WHERE ro.user_id = auth.uid() OR ru.user_id = auth.uid()
    )
  );

-- ============================================
-- SECTION 8: TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_owners_updated_at
  BEFORE UPDATE ON public.restaurant_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_summary_updated_at
  BEFORE UPDATE ON public.sales_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECTION 9: HELPER FUNCTIONS
-- ============================================

-- Function: Get user's accessible restaurants
CREATE OR REPLACE FUNCTION get_user_restaurants(user_uuid UUID)
RETURNS TABLE (restaurant_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id
  FROM public.restaurants r
  LEFT JOIN public.restaurant_owners ro ON r.owner_id = ro.id
  LEFT JOIN public.restaurant_users ru ON r.id = ru.restaurant_id
  WHERE ro.user_id = user_uuid OR ru.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ QuickServe POS Database Schema Created Successfully!';
  RAISE NOTICE '📊 Total Tables: 18';
  RAISE NOTICE '🔐 RLS Enabled: Yes';
  RAISE NOTICE '⚡ Indexes Created: Yes';
  RAISE NOTICE '🔧 Triggers Active: Yes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create initial Super Admin user';
  RAISE NOTICE '2. Test authentication from frontend';
  RAISE NOTICE '3. Start building features!';
END $$;
