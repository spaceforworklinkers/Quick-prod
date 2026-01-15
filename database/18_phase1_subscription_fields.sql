
-- Phase 1: Subscription Visibility Enhancements
-- Adds fields for manual tracking of payments and notes

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other'));

-- Ensure RLS allows read for platform roles
DROP POLICY IF EXISTS "Platform admin read subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admin read subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT')
    )
  );

-- Ensure RLS allows write for Super Admin / Admin / Accountant (for manual entry)
DROP POLICY IF EXISTS "Platform admin write subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admin write subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT') -- Manager read-only
    )
  );

DROP POLICY IF EXISTS "Platform admin update subscriptions" ON public.subscriptions;
CREATE POLICY "Platform admin update subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
    )
  );
