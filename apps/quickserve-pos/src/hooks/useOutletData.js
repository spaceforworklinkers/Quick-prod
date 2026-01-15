import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutlet } from '@/context/OutletContext';
import { dbOperations } from '@/lib/db';

/**
 * Hook to manage Store Settings (Local-First)
 */
export const useStoreSettings = () => {
    const { outletId } = useOutlet();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!outletId) return;
        setLoading(true);

        // 1. Local
        try {
             // We use a unique key convention for settings: `settings_${outletId}`
             const local = await dbOperations.get('settings', `settings_${outletId}`);
             if (local) {
                 setSettings(local);
                 setLoading(false);
             }
        } catch(e) { /* ignore */ }

        // 2. Remote
        try {
             const { data } = await supabase
                .from('store_settings')
                .select('*')
                .eq('restaurant_id', outletId)
                .maybeSingle();
             
             if (data) {
                 setSettings(data);
                 setLoading(false);
                 // Store with unique key
                 await dbOperations.put('settings', { ...data, unique_key: `settings_${outletId}` });
             }
        } catch(e) { 
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [outletId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return { settings, loading, refresh: fetchSettings };
};

/**
 * Hook to manage Menu Items and Categories (Local-First)
 */
export const useMenu = () => {
    const { outletId } = useOutlet();
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMenu = useCallback(async () => {
        if (!outletId) return;
        
        // 1. Local Read
        try {
            const localCats = await dbOperations.getByRestaurant('categories', outletId).catch(()=>[]);
            const localItems = await dbOperations.getByRestaurant('menu_items', outletId).catch(()=>[]);
            
            if (localCats.length > 0 || localItems.length > 0) {
                 setCategories(localCats.sort((a,b) => a.display_order - b.display_order));
                 setItems(localItems);
                 setLoading(false); // Show local data immediately
            }
        } catch(e) { console.warn(e); }

        // 2. Remote Sync
        try {
            const { data: cats } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', outletId)
                .order('display_order');
            
            const { data: menuItems } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', outletId);
                
            setCategories(cats || []);
            setItems(menuItems || []);
            setLoading(false);

            // 3. Local Write (Background)
            if (cats?.length) await dbOperations.bulkPut('categories', cats);
            if (menuItems?.length) await dbOperations.bulkPut('menu_items', menuItems);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [outletId]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    return { categories, items, loading, refresh: fetchMenu };
};

/**
 * Hook to manage Orders (Sync + Realtime + Local Cache)
 */
export const useOrders = (statusFilter = null) => {
    const { outletId } = useOutlet();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!outletId) return;
        
        // 1. Local Read (For basic display if available)
        // Orders are tricky because of joins. We assume 'orders' store has flattened or full data.
        // For now, we rely on Supabase for the main list until Write Path is fully properly cache-enabled.
        // However, we can try to load from IDB orders if we implemented bulkPut.
        
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select('*, order_items(*, menu_items(name))')
                .eq('restaurant_id', outletId)
                .order('created_at', { ascending: false });

            if (statusFilter) {
               if (Array.isArray(statusFilter)) {
                   query = query.in('status', statusFilter);
               } else {
                   query = query.eq('status', statusFilter);
               }
            }
            
            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
            
            // Cache orders for offline lookup (Bill Receipts etc)
            if (data?.length) {
                // We need to store them. 
                // Note: deeply nested objects work fine in IDB.
                await dbOperations.bulkPut('orders', data);
            }
            
        } catch (e) {
            console.error("Order fetch error:", e);
            // Fallback to local if fetch failed (Offline)
            try {
                 const localOrders = await dbOperations.getByRestaurant('orders', outletId);
                 if (localOrders?.length) {
                     // Filter locally
                     let filtered = localOrders;
                     if (statusFilter) {
                         const filters = Array.isArray(statusFilter) ? statusFilter : [statusFilter];
                         filtered = localOrders.filter(o => filters.includes(o.status));
                     }
                     // Sort desc
                     filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                     setOrders(filtered);
                 }
            } catch(localErr) { /* ignore */ }
        } finally {
            setLoading(false);
        }
    }, [outletId, statusFilter]);

    // Real-time Subscription - keeps Local DB fresh
    useEffect(() => {
        fetchOrders();

        if (!outletId) return;

        const channel = supabase
            .channel(`orders-${outletId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${outletId}` },
                () => fetchOrders() 
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchOrders, outletId]);

    return { orders, loading, refresh: fetchOrders };
};

/**
 * Hook to manage Inventory (Local-First)
 */
export const useInventory = () => {
    const { outletId } = useOutlet();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInventory = useCallback(async () => {
        if (!outletId) return;
        
        // 1. Local
        try {
            const local = await dbOperations.getByRestaurant('inventory_items', outletId).catch(()=>[]);
            if (local.length) {
                setInventory(local);
                setLoading(false);
            }
        } catch(e) { console.warn(e); }

        // 2. Remote
        try {
            const { data } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('restaurant_id', outletId);
            
            setInventory(data || []);
            setLoading(false);
            
            if (data?.length) await dbOperations.bulkPut('inventory_items', data);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [outletId]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    return { inventory, loading, refresh: fetchInventory };
};

/**
 * Hook to manage Tables (Local-First)
 */
export const useTables = () => {
    const { outletId } = useOutlet();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTables = useCallback(async () => {
        if (!outletId) return;
        
        // 1. Local
        try {
            const local = await dbOperations.getByRestaurant('restaurant_tables', outletId);
            if (local && local.length) {
                setTables(local);
                setLoading(false);
            }
        } catch (e) { console.warn(e); }

        // 2. Remote
        if (navigator.onLine) {
             try {
                const { data } = await supabase
                    .from('restaurant_tables')
                    .select('*')
                    .eq('restaurant_id', outletId)
                    .order('name');
                if (data) {
                    setTables(data);
                    await dbOperations.bulkPut('restaurant_tables', data);
                }
             } catch (e) { console.error(e); }
        }
        setLoading(false);
    }, [outletId]);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    // Real-time
    useEffect(() => {
        if (!outletId) return;
        const channel = supabase.channel(`tables-${outletId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables', filter: `restaurant_id=eq.${outletId}` }, () => {
            fetchTables();
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [outletId, fetchTables]);

    return { tables, loading, refresh: fetchTables };
};
