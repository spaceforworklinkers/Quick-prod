-- ============================================================
-- ADD HELPER RPCS for Stock Management
-- ============================================================

-- Function: Decrement Stock
-- Used by: stockHelpers.js (POS Stock Deduction)
CREATE OR REPLACE FUNCTION public.decrement_stock(
    row_id UUID,
    amount DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.inventory_items
    SET current_stock = current_stock - amount,
        updated_at = NOW()
    WHERE id = row_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Item not found');
    END IF;

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
