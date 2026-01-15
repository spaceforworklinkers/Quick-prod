-- ACID Transaction for Order Submission
-- Ensures Order, Items, Stock, and Table Status update atomically.

CREATE OR REPLACE FUNCTION public.submit_order(
  p_order jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_restaurant_id uuid;
  v_table_id uuid;
  item_record jsonb;
  v_menu_id uuid;
  v_qty int;
BEGIN
  v_order_id := (p_order->>'id')::uuid;
  v_restaurant_id := (p_order->>'restaurant_id')::uuid;
  v_table_id := (p_order->>'table_id')::uuid;

  -- 1. Idempotency Check
  -- If order already exists, assume sync loop retry and return success
  IF EXISTS (SELECT 1 FROM public.orders WHERE id = v_order_id) THEN
     RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'message', 'Already processed');
  END IF;

  -- 2. Insert Order
  INSERT INTO public.orders (
    id, 
    restaurant_id, 
    table_id, 
    order_number, 
    order_type, 
    status, 
    subtotal,
    tax,
    total, 
    created_at, 
    created_by
  ) VALUES (
    v_order_id,
    v_restaurant_id,
    v_table_id,
    p_order->>'order_number',
    p_order->>'order_type',
    COALESCE(p_order->>'status', 'NEW'),
    (p_order->>'subtotal')::decimal,
    (p_order->>'tax')::decimal,
    (p_order->>'total')::decimal,
    (p_order->>'created_at')::timestamptz,
    auth.uid() -- Tracks the staff member syncing this
  );

  -- 3. Process Items & Stock
  FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_menu_id := (item_record->>'menu_item_id')::uuid;
    v_qty := (item_record->>'quantity')::int;

    -- Insert Item
    INSERT INTO public.order_items (
        id, 
        order_id, 
        menu_item_id, 
        quantity, 
        price, 
        notes
    ) VALUES (
        (item_record->>'id')::uuid,
        v_order_id,
        v_menu_id,
        v_qty,
        (item_record->>'price')::decimal,
        item_record->>'notes'
    );

    -- Deduct Stock (if ingredients exist)
    UPDATE public.inventory_items ii
    SET current_stock = current_stock - (mi.quantity_used * v_qty),
        updated_at = NOW()
    FROM public.menu_ingredients mi
    WHERE mi.inventory_item_id = ii.id
    AND mi.menu_item_id = v_menu_id;

  END LOOP;

  -- 4. Update Table Status (Side Effect)
  IF v_table_id IS NOT NULL THEN
      -- Typically mark as occupied. Logic can be refined.
      UPDATE public.restaurant_tables
      SET 
        status = 'Occupied', 
        updated_at = NOW()
      WHERE id = v_table_id;
      
      -- Note: Occupancy count logic is usually complex (add to existing? replace?).
      -- For ACID simplicity, we just flag it as Occupied.
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
  -- All rollbacks happen automatically on error
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
