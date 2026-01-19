-- ============================================================
-- 41. SUPER ADMIN DELETE OUTLET (CASCADE)
-- Allows clearing an outlet and all its data (Orders, Menus, Users)
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

    -- 2. Get Owner Details before deletion (to delete the owner user if needed)
    SELECT owner_id INTO v_owner_id FROM public.restaurants WHERE id = target_restaurant_id;
    
    -- 3. Delete Restaurant (Cascades to Orders, Items, Menus, Table etc.)
    -- Note: Our schema defines strict CASCADE on restaurant_id FKs
    DELETE FROM public.restaurants WHERE id = target_restaurant_id;

    -- 4. Clean up Owner Record if they have no more restaurants?
    -- (Logic: If owner has 0 restaurants, we might want to keep the account or delete it.)
    -- (For 'test deletion' requested by user, usually implies full cleanup)
    
    -- Check remaining restaurants for this owner
    IF v_owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.restaurants WHERE owner_id = v_owner_id) THEN
        -- Get the User ID associated with this Owner
        SELECT user_id INTO v_owner_user_id FROM public.restaurant_owners WHERE id = v_owner_id;
        
        -- Delete Owner Profile
        DELETE FROM public.restaurant_owners WHERE id = v_owner_id;
        
        -- Delete User Profile (Cascades to auth.users usually requires admin API, but our delete_platform_user covers profile)
        DELETE FROM public.user_profiles WHERE id = v_owner_user_id;
        
        -- Note: Auth user in Supabase auth.users is NOT deleted by SQL cascade usually.
        -- But for cleaning up 'data', this is sufficient to remove them from the app.
        -- To delete from auth.users, we would need a special Edge Function or Cron.
    END IF;

    -- 5. Log Action
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
