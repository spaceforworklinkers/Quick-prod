
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

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
 * 4. Handle Redirection for Onboarding (New Feature).
 */
export const OutletProvider = ({ children }) => {
    const { outletId } = useParams();
    const [currentOutlet, setCurrentOutlet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

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
        const isPlaceholder = supabase.supabaseUrl.includes('placeholder.supabase.co');
        if (isPlaceholder) {
            console.warn("Using placeholder Supabase URL. Mocking outlet data.");
            setCurrentOutlet({
                id: outletId,
                name: "QuickServe Demo Café",
                city: "Agra",
                state: "UP",
                logo_url: "https://rxuezlqrzfkxujkkilnq.supabase.co/storage/v1/object/public/assets/logo.png",
                onboarding_status: 'active' // Demo is always active
            });
            setLoading(false);
            return;
        }

        // -----------------------------------------------------------------
        // DATA FETCH
        // -----------------------------------------------------------------
        const fetchOutlet = async () => {
            try {
                // Fetch onboarding_status too
                const { data, error } = await supabase
                    .from('restaurants')
                    .select('*, onboarding_status')
                    .eq('id', outletId)
                    .maybeSingle();

                if (error) throw error;
                if (!data) throw new Error("Outlet not found");

                setCurrentOutlet(data);
                
                // -------------------------------------------------------------
                // ONBOARDING REDIRECT LOGIC
                // -------------------------------------------------------------
                // If status is not active, force redirect to /setup
                // Except if we are already ON the setup page or a public invoice page
                
                const isSetupPage = location.pathname.includes(`/setup`);
                const isInvoicePage = location.pathname.includes(`/invoice/`);
                const isLoginPage = location.pathname.includes(`/login`);
                
                // If not active, and not on setup/login/invoice, redirect to setup.
                // We MUST allow login, otherwise unauthenticated users verify loop.
                if (data.onboarding_status !== 'active' && !isSetupPage && !isInvoicePage && !isLoginPage) {
                    console.log("Redirecting to setup due to non-active status:", data.onboarding_status);
                    navigate(`/${outletId}/setup`);
                }
                
            } catch (err) {
                console.error("Outlet load error", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOutlet();
    }, [outletId, location.pathname]); // Re-run if location changes to enforce check? Actually loops might happen.
    // Better to depend on outletId and just check once on mount/load.
    // If we add location.pathname, we must ensure we don't loop.
    // Logic: if (!isSetupPage && status != active) -> Redirect.
    // If we are on setup page, we do NOTHING.
    // So safe to include.

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
