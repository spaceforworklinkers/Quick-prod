
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';

const OutletContext = createContext(null);

/**
 * =========================================================================
 * OUTLET CONTEXT
 * =========================================================================
 * 
 * Purpose:
 * Provides data about the CURRENT restaurant/outlet based on the URL parameter (`:outletId`).
 * This, combined with AuthContext, forms the basis of the multi-tenant architecture.
 * 
 * Key Responsibilities:
 * 1. Read `outletId` from URL.
 * 2. Fetch public restaurant details (Name, Logo, Settings).
 * 3. Handle Development/Demo placeholder modes.
 */
export const OutletProvider = ({ children }) => {
    const { outletId } = useParams();
    const [currentOutlet, setCurrentOutlet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Optimization: If no ID in URL, we are likely in Platform Admin or Public Root.
        // No need to fetch anything.
        if (!outletId) {
            setLoading(false);
            return;
        }

        // -----------------------------------------------------------------
        // DEV MODE / DEMO LOGIC
        // -----------------------------------------------------------------
        // If the Supabase URL is a placeholder (local dev without full backend),
        // we mock the data to allow UI work to continue.
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

        // -----------------------------------------------------------------
        // DATA FETCH
        // -----------------------------------------------------------------
        const fetchOutlet = async () => {
            try {
                // We fetch from 'restaurants' table.
                // NOTE: Row Level Security (RLS) is active.
                // However, basic details (Name, Address) might need to be public 
                // for login screens to show the logo before auth.
                // Ensure specific PUBLIC policies exist for minimal read access if this fails for guests.
                
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

    // Expose data to children
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
