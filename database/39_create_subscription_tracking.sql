-- ============================================================
-- 39. CREATE SUBSCRIPTION TRACKING TABLE
-- Fixes missing table referenced in SubscriptionService.js
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('trial', 'paid_monthly', 'paid_yearly')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0,
    payment_proof_url TEXT,
    payment_proof_submitted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id) -- One active tracking record per restaurant usually
);

-- Enable RLS
ALTER TABLE public.subscription_tracking ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super admins and accountants can manage subscription_tracking"
    ON public.subscription_tracking FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT')
        )
    );

CREATE POLICY "Outlet owners can view own subscription_tracking"
    ON public.subscription_tracking FOR SELECT
    USING (
        restaurant_id IN (
            SELECT r.id FROM public.restaurants r
            JOIN public.restaurant_owners ro ON r.owner_id = ro.id
            WHERE ro.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_subscription_tracking_updated_at
    BEFORE UPDATE ON public.subscription_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
