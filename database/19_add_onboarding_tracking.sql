-- Add onboarding tracking to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'setup_pending' 
CHECK (onboarding_status IN ('setup_pending', 'setup_in_progress', 'active'));

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS business_info_completed BOOLEAN DEFAULT false;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS menu_created BOOLEAN DEFAULT false;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS tables_created BOOLEAN DEFAULT false;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS tax_configured BOOLEAN DEFAULT false;

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS qr_generated BOOLEAN DEFAULT false;

-- Create an index to quickly find outlets pending setup
CREATE INDEX IF NOT EXISTS idx_restaurants_onboarding_status ON public.restaurants(onboarding_status);
