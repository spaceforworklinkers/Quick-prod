-- ============================================================
-- 22. OTP VERIFICATION & EMAIL LOGGING SYSTEM
-- Secure OTP-based login for company users only
-- ============================================================

-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  session_id TEXT,
  
  -- Index for cleanup
  CONSTRAINT otp_expires_check CHECK (expires_at > created_at)
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('otp_login', 'outlet_credentials', 'subscription_expiry', 'internal_notification')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_email ON public.otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_used ON public.otp_verifications(used);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE public.otp_verifications IS 'OTP verification for company user login (2-minute validity)';
COMMENT ON TABLE public.email_logs IS 'Audit log for all system-sent emails';

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for otp_verifications
-- Only backend service should access this (no direct user access)
CREATE POLICY "Service role only access"
ON public.otp_verifications
FOR ALL
USING (false); -- Block all direct access, only service role can bypass

-- RLS Policies for email_logs
-- Admin/Super Admin can view email logs
CREATE POLICY "Admin can view email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Function to cleanup expired OTPs (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old email logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
