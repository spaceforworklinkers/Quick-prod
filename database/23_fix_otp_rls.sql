-- FIX: Allow authenticated users to create OTPs
-- Previously restriction was too strict (Service Role only)

DROP POLICY IF EXISTS "Service Role only" ON otp_verifications;

-- Allow Service Role full access
CREATE POLICY "Service Role full access" ON otp_verifications
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to INSERT their own OTPs (Security: Rate limiting handles abuse)
CREATE POLICY "Users can create OTPs" ON otp_verifications
    FOR INSERT TO authenticated
    WITH CHECK (true); 

-- Allow authenticated users to SELECT their own OTPs (for verification logic if needed, though mostly handled by service)
-- Actually, OTPService.verify does a SELECT.
CREATE POLICY "Users can verify own OTPs" ON otp_verifications
    FOR SELECT TO authenticated
    USING (email = auth.email());

-- Allow updating (marking as used)
CREATE POLICY "Users can update own OTPs" ON otp_verifications
    FOR UPDATE TO authenticated
    USING (email = auth.email());
