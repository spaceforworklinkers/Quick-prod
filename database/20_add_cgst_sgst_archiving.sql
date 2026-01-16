-- ============================================================
-- 20. ADD CGST/SGST AND ORDER ARCHIVING SUPPORT
-- Adds tax breakdown columns and archiving metadata to orders table
-- ============================================================

-- Add CGST/SGST columns for Indian GST compliance
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cgst NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst NUMERIC(10,2) DEFAULT 0;

-- Add order archiving columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS original_status TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.cgst IS 'Central GST amount (50% of total GST)';
COMMENT ON COLUMN public.orders.sgst IS 'State GST amount (50% of total GST)';
COMMENT ON COLUMN public.orders.archived_at IS 'Timestamp when order was archived';
COMMENT ON COLUMN public.orders.original_status IS 'Original status before archiving';

-- Create index for archived orders queries
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON public.orders(archived_at) WHERE archived_at IS NOT NULL;
