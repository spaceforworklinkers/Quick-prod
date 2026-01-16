-- Allow Anonymous users (login screen) to insert email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert email_logs"
ON public.email_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated to insert too
CREATE POLICY "Allow authenticated insert email_logs"
ON public.email_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role full access
GRANT ALL ON public.email_logs TO service_role;
GRANT INSERT ON public.email_logs TO anon;
GRANT INSERT ON public.email_logs TO authenticated;
