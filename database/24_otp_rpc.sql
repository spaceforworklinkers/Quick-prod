-- RPC Function to create OTP securely (bypassing RLS issues)
CREATE OR REPLACE FUNCTION create_otp(
    p_email TEXT,
    p_otp_hash TEXT,
    p_expires_at TIMESTAMPTZ,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner
AS $$
BEGIN
    INSERT INTO public.otp_verifications (email, otp_hash, expires_at, session_id)
    VALUES (p_email, p_otp_hash, p_expires_at, p_session_id);
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION create_otp TO authenticated;
GRANT EXECUTE ON FUNCTION create_otp TO anon;
GRANT EXECUTE ON FUNCTION create_otp TO service_role;
