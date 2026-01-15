-- Create conversion_requests table
CREATE TABLE public.conversion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_id UUID NOT NULL REFERENCES public.user_profiles(id),
    outlet_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    trial_type TEXT NOT NULL CHECK (trial_type IN ('STANDARD', 'PREMIUM', 'ENTERPRISE')),
    trial_days INTEGER NOT NULL DEFAULT 14,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    manager_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE public.conversion_requests ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin: Select All
CREATE POLICY "Super Admins View All Requests"
ON public.conversion_requests
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'OWNER_SUPER_ADMIN')
);

-- 2. Admin: Select All
CREATE POLICY "Admins View All Requests"
ON public.conversion_requests
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- 3. Manager: Select All + Update (Approve/Reject)
CREATE POLICY "Managers View All Requests"
ON public.conversion_requests
FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'MANAGER'
);

CREATE POLICY "Managers Update Requests"
ON public.conversion_requests
FOR UPDATE
TO authenticated
USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'MANAGER'
)
WITH CHECK (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'MANAGER'
);

-- 4. Salesperson: Select Own + Insert
CREATE POLICY "Salespersons View Own Requests"
ON public.conversion_requests
FOR SELECT
TO authenticated
USING (
    salesperson_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'SALESPERSON' AND salesperson_id = auth.uid()
);

CREATE POLICY "Salespersons Create Requests"
ON public.conversion_requests
FOR INSERT
TO authenticated
WITH CHECK (
    salesperson_id = auth.uid() AND
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'SALESPERSON'
);
