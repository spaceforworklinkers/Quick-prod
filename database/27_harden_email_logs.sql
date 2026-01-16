-- This script locks down the email logs table.
-- It ensures that ONLY the backend server (Service Role) can write logs.
-- This prevents hackers (or bugs) from creating fake email logs.

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Remove previous permissive policies
DROP POLICY IF EXISTS "Allow anon insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow authenticated insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Allow authenticated select email_logs" ON public.email_logs;

-- NOTE: By default, if no INSERT policy exists, only Service Role (superuser) can INSERT.
-- This effectively restricts writes to backend functions (create-outlet, send-email).

-- Grant SELECT to authenticated (Admin) if needed for Audit?
-- Assuming Admins might want to view logs.
CREATE POLICY "Allow authenticated select email_logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (true); -- Or filter by role if needed

-- Grant permissions for function usage
GRANT ALL ON public.email_logs TO service_role;
-- Revoke insert from public/anon
REVOKE INSERT ON public.email_logs FROM anon;
REVOKE INSERT ON public.email_logs FROM authenticated;
