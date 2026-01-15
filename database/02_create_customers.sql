
-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT,
  mobile TEXT,
  email TEXT,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, mobile)
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Tenant scoped access - customers"
  ON public.customers FOR ALL
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
