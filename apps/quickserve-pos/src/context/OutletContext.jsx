
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

const OutletContext = createContext(null);

export const OutletProvider = ({ children }) => {
    const { outletId } = useParams();
    const [currentOutlet, setCurrentOutlet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!outletId) {
            setLoading(false);
            return;
        }

        const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');
        if (isPlaceholder) {
            console.warn("Using placeholder Supabase URL. Mocking outlet data.");
            setCurrentOutlet({
                id: outletId,
                name: "QuickServe Demo Café",
                city: "Agra",
                state: "UP",
                logo_url: "https://rxuezlqrzfkxujkkilnq.supabase.co/storage/v1/object/public/assets/logo.png"
            });
            setLoading(false);
            return;
        }

        const fetchOutlet = async () => {
            try {
                // Fetch basic outlet info
                // RLS will ensure we only see what we are allowed to see 
                // BUT current business rule: outletId is in URL.
                // We should check if this outlet exists and is active.
                
                // Note: The public 'restaurants' table is usually protected.
                // We might need a public wrapper or just rely on the user being logged in 
                // to see it. For now, assume protected.

                const { data, error } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('id', outletId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Outlet not found");

                setCurrentOutlet(data);
            } catch (err) {
                console.error("Outlet load error", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOutlet();
    }, [outletId]);

    // This context exposes the tenant ID to the rest of the app
    return (
        <OutletContext.Provider value={{ outletId, currentOutlet, loading, error }}>
            {children}
        </OutletContext.Provider>
    );
};

export const useOutlet = () => {
    const context = useContext(OutletContext);
    if (!context) {
        throw new Error('useOutlet must be used within OutletProvider');
    }
    return context;
};
