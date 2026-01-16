import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateBill } from '@/lib/billCalculations';
import { useOutlet } from '@/context/OutletContext';

/**
 * React Hook for centralized billing calculations
 * Fetches GST settings from store_settings and provides calculate function
 * Multi-tenant aware - filters by outletId
 */
export const useBillCalculation = () => {
    const { outletId } = useOutlet();
    const [settings, setSettings] = useState({
        gstRate: 5.0,
        gstMode: 'inclusive',
        loading: true
    });

    useEffect(() => {
        let isMounted = true;

        const fetchSettings = async () => {
            if (!outletId) {
                if (isMounted) setSettings(prev => ({ ...prev, loading: false }));
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('store_settings')
                    .select('gst_percentage, gst_mode')
                    .eq('restaurant_id', outletId)
                    .limit(1)
                    .maybeSingle();
                
                if (error) throw error;

                if (isMounted && data) {
                    setSettings({
                        gstRate: data.gst_percentage !== undefined ? parseFloat(data.gst_percentage) : 5.0,
                        gstMode: data.gst_mode || 'inclusive',
                        loading: false
                    });
                } else if (isMounted) {
                    // Fallback if no settings found
                    setSettings(prev => ({ ...prev, loading: false }));
                }
            } catch (err) {
                console.error("Failed to fetch bill calculation settings:", err);
                if (isMounted) setSettings(prev => ({ ...prev, loading: false }));
            }
        };

        fetchSettings();

        return () => { isMounted = false; };
    }, [outletId]);

    const calculate = useCallback((items, discount = 0) => {
        return calculateBill(items, discount, settings.gstRate, settings.gstMode);
    }, [settings.gstRate, settings.gstMode]);

    return {
        calculate,
        gstRate: settings.gstRate,
        gstMode: settings.gstMode,
        loading: settings.loading
    };
};
