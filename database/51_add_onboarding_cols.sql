-- Add missing onboarding columns to restaurants table
-- These are required for the OnboardingWizard to track progress

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'setup_pending';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS business_info_completed BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS menu_created BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS tables_created BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS tax_configured BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS qr_generated BOOLEAN DEFAULT false;

-- Backfill default values for existing rows where null
UPDATE public.restaurants 
SET onboarding_status = 'setup_pending' 
WHERE onboarding_status IS NULL;

UPDATE public.restaurants 
SET onboarding_step = 0 
WHERE onboarding_step IS NULL;

UPDATE public.restaurants SET business_info_completed = false WHERE business_info_completed IS NULL;
UPDATE public.restaurants SET menu_created = false WHERE menu_created IS NULL;
UPDATE public.restaurants SET tables_created = false WHERE tables_created IS NULL;
UPDATE public.restaurants SET tax_configured = false WHERE tax_configured IS NULL;
UPDATE public.restaurants SET qr_generated = false WHERE qr_generated IS NULL;

-- Ensure RLS allows updating these columns (Covered by existing UPDATE policy, but good to verify)
-- Policy: "Owners and Staff can update assigned restaurants" check owners list.

-- Add generic trigger to keep updated_at fresh if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
