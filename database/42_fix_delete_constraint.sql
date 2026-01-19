-- ============================================================
-- 42. FIX DELETE CONSTRAINT & ADD PWA SUPPORT
-- Updates delete_outlet_complete to handle non-cascading relations
-- like subscription_tracking.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_outlet_complete(
    target_restaurant_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_owner_id UUID;
    v_owner_user_id UUID;
BEGIN
    -- 1. Authorization Check
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('OWNER_SUPER_ADMIN', 'SUPER_ADMIN')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Admins can delete outlets.';
    END IF;

    -- 2. Get Owner Details before deletion
    SELECT owner_id INTO v_owner_id FROM public.restaurants WHERE id = target_restaurant_id;
    
    -- 3. MANUAL CLEANUP (For tables that might restrict deletion)
    -- Explicitly delete dependent records that might not have ON DELETE CASCADE
    DELETE FROM public.conversion_requests WHERE created_outlet_id = target_restaurant_id;
    DELETE FROM public.subscription_tracking WHERE restaurant_id = target_restaurant_id;
    DELETE FROM public.store_settings WHERE restaurant_id = target_restaurant_id;
    -- (Add other tables here if needed in future)

    -- 4. Delete Restaurant (Now safe to delete)
    DELETE FROM public.restaurants WHERE id = target_restaurant_id;

    -- 5. Clean up Owner Record if orphan
    IF v_owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.restaurants WHERE owner_id = v_owner_id) THEN
        -- Get the User ID associated with this Owner
        SELECT user_id INTO v_owner_user_id FROM public.restaurant_owners WHERE id = v_owner_id;
        
        -- Delete Owner Profile
        DELETE FROM public.restaurant_owners WHERE id = v_owner_id;
        
        -- Delete User Profile
        DELETE FROM public.user_profiles WHERE id = v_owner_user_id;
    END IF;

    -- 6. Log Action
    INSERT INTO public.audit_logs (
        action,
        actor_id,
        details
    ) VALUES (
        'DELETE_OUTLET',
        auth.uid(),
        json_build_object('restaurant_id', target_restaurant_id)
    );

    RETURN json_build_object('success', true, 'message', 'Outlet and associated data deleted.');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
