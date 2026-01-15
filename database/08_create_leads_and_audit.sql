-- ============================================================
-- 08. CREATE LEADS AND AUDIT LOGS TABLES
-- Implements real data storage to remove mock data.
-- ============================================================

-- A. Leads Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED')),
    source TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads Policies
CREATE POLICY "Platform admins can manage leads" ON public.leads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SALESPERSON', 'MANAGER'))
    );

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- B. Audit Logs Table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor_id UUID REFERENCES public.user_profiles(id),
    actor_email TEXT, -- Snapshot in case user is deleted
    details TEXT,
    status TEXT DEFAULT 'SUCCESS',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs Policies
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN'))
    );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        -- Allow any authenticated user to create a log entry (for their own actions)
        auth.role() = 'authenticated'
    );
