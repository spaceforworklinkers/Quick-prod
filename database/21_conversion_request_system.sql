-- ============================================================
-- 21. CONVERSION REQUEST SYSTEM
-- Multi-level approval workflow for outlet creation
-- ============================================================

-- Create conversion_requests table
CREATE TABLE IF NOT EXISTS public.conversion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE NOT NULL,
  
  -- Outlet Details
  outlet_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  business_type TEXT NOT NULL,
  
  -- Subscription Details
  subscription_intent TEXT NOT NULL CHECK (subscription_intent IN ('trial', 'paid')),
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')),
  trial_duration INTEGER CHECK (trial_duration IN (15, 30)),
  
  -- Workflow Status
  status TEXT NOT NULL DEFAULT 'pending_manager_review' 
    CHECK (status IN (
      'pending_manager_review',
      'query_from_manager',
      'manager_approved',
      'pending_admin_approval',
      'fully_approved',
      'rejected',
      'outlet_created'
    )),
  
  -- Actors
  salesperson_id UUID REFERENCES auth.users(id),
  manager_id UUID REFERENCES auth.users(id),
  approver_id UUID REFERENCES auth.users(id),
  
  -- Notes
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Created Outlet
  created_outlet_id UUID REFERENCES public.restaurants(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  manager_reviewed_at TIMESTAMPTZ,
  admin_approved_at TIMESTAMPTZ,
  outlet_created_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversion_request_queries table
CREATE TABLE IF NOT EXISTS public.conversion_request_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.conversion_requests(id) ON DELETE CASCADE,
  
  query_type TEXT NOT NULL CHECK (query_type IN ('manager_query', 'salesperson_reply')),
  message TEXT NOT NULL,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_tracking table
CREATE TABLE IF NOT EXISTS public.subscription_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES public.restaurants(id) UNIQUE,
  
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('trial', 'paid_monthly', 'paid_yearly')),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  payment_proof_required BOOLEAN DEFAULT FALSE,
  payment_proof_url TEXT,
  payment_proof_submitted_at TIMESTAMPTZ,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'cancelled')),
  
  alert_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update restaurants table
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_generation_required BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversion_requests_status ON public.conversion_requests(status);
CREATE INDEX IF NOT EXISTS idx_conversion_requests_salesperson ON public.conversion_requests(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_conversion_requests_created_at ON public.conversion_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_restaurant ON public.subscription_tracking(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_end_date ON public.subscription_tracking(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_status ON public.subscription_tracking(status);

-- Add comments
COMMENT ON TABLE public.conversion_requests IS 'Conversion requests for outlet creation with multi-level approval';
COMMENT ON TABLE public.conversion_request_queries IS 'Query/reply communication between manager and salesperson';
COMMENT ON TABLE public.subscription_tracking IS 'Subscription tracking for outlets (trial/paid)';

-- Enable RLS
ALTER TABLE public.conversion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_request_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversion_requests

-- Salesperson: Can view their own requests
CREATE POLICY "Salesperson can view own requests"
ON public.conversion_requests
FOR SELECT
USING (
  auth.uid() = salesperson_id
  OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  )
);

-- Salesperson: Can create requests
CREATE POLICY "Salesperson can create requests"
ON public.conversion_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'SALESPERSON'
  )
);

-- Salesperson: Can update their own requests (for replies)
CREATE POLICY "Salesperson can update own requests"
ON public.conversion_requests
FOR UPDATE
USING (
  auth.uid() = salesperson_id
  AND status IN ('query_from_manager', 'rejected')
);

-- Manager/Admin: Can view all requests
CREATE POLICY "Manager/Admin can view all requests"
ON public.conversion_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  )
);

-- Manager/Admin: Can update requests
CREATE POLICY "Manager/Admin can update requests"
ON public.conversion_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  )
);

-- RLS Policies for conversion_request_queries

-- Users can view queries for requests they have access to
CREATE POLICY "Users can view relevant queries"
ON public.conversion_request_queries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversion_requests cr
    WHERE cr.id = request_id
    AND (
      cr.salesperson_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
      )
    )
  )
);

-- Users can create queries for requests they have access to
CREATE POLICY "Users can create queries"
ON public.conversion_request_queries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversion_requests cr
    WHERE cr.id = request_id
    AND (
      cr.salesperson_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
      )
    )
  )
);

-- RLS Policies for subscription_tracking

-- Super Admin/Admin/Accountant: Full access
CREATE POLICY "Admin can view all subscriptions"
ON public.subscription_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
  )
);

-- Manager: Read-only access
CREATE POLICY "Manager can view subscriptions"
ON public.subscription_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'MANAGER'
  )
);

-- Admin can manage subscriptions
CREATE POLICY "Admin can manage subscriptions"
ON public.subscription_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Create function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of requests today
  SELECT COUNT(*) INTO counter
  FROM public.conversion_requests
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: REQ-YYYYMMDD-XXX
  new_number := 'REQ-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate request number
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_request_number
BEFORE INSERT ON public.conversion_requests
FOR EACH ROW
EXECUTE FUNCTION set_request_number();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversion_request_timestamp
BEFORE UPDATE ON public.conversion_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_subscription_tracking_timestamp
BEFORE UPDATE ON public.subscription_tracking
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
