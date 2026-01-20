import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { OutletProvider } from '@/context/OutletContext';
import { AuthProvider } from '@/context/AuthContext';
import { ContextGuard } from '@/components/auth/ContextGuard';
import { ALL_PLATFORM_ROLES } from '@/config/permissions';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

/**
 * ==================================================
 * APP.JSX - APPLICATION ENTRY POINT & ROUTING
 * ==================================================
 * 
 * 1. ARCHITECTURE:
 *    The app is split into two distinct contexts:
 *    - PLATFORM (Company Admin): Managing tenants, subscriptions, users.
 *    - OUTLET (POS): The actual Point of Sale used by restaurants.
 * 
 * 2. PERFORMANCE (LAZY LOADING):
 *    We use React.lazy() to split the bundle.
 *    - A POS user will ONLY download the Outlet bundle.
 *    - An Admin user will ONLY download the Platform bundle.
 *    - This significantly improves load times (FCP).
 */

// ==================================================
// LAZY LOADED MODULES (Chunk Splitting)
// ==================================================

// The POS Application (Heavy logic: Orders, Menu, Kitchen)
const LegacyApp = React.lazy(() => import('@/features/legacy-pos/LegacyApp'));

// Public Utility Pages
const InvoiceView = React.lazy(() => import('@/features/legacy-pos/InvoiceView')); // Order Receipt
const GuestOrder = React.lazy(() => import('@/features/legacy-pos/GuestOrder'));   // QR Ordering

// The Platform Admin Application (Heavy logic: Dashboards, Analytics, User Mgmt)
const PlatformAdmin = React.lazy(() => import('@/features/platform-admin/PlatformAdmin'));
const CompanyLogin = React.lazy(() => import('@/features/platform-admin/CompanyLogin')); // Dedicated Admin Login
const WelcomeWebsite = React.lazy(() => import('@/features/platform-admin/WelcomeWebsite')); // Landing Page

// Onboarding Wizard
const OnboardingWizard = React.lazy(() => import('@/features/onboarding/OnboardingWizard'));

// ==================================================
// LOADING FALLBACK
// ==================================================
// Shown while a lazy-loaded chunk is being fetched over the network.
const FullPageLoader = () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
        <p className="text-sm font-medium text-gray-500">Loading QuickServe...</p>
    </div>
);

// ==================================================
// SHELL WRAPPERS (Context & Security Boundaries)
// ==================================================

/**
 * PlatformShell
 * Wraps all Company/Admin routes.
 * Enforces 'platform' context so Outline Users cannot access it.
 */
const PlatformShell = ({ children }) => (
    <OutletProvider>
        <AuthProvider>
            <ContextGuard context="platform">
                {children}
            </ContextGuard>
        </AuthProvider>
    </OutletProvider>
);

/**
 * AppShell (OutletShell)
 * Wraps all POS/Outlet routes (/:outletId/*).
 * Enforces 'outlet' context and provides restaurant-specific data (menu, settings).
 */
const AppShell = () => {
  return (
    <OutletProvider>
      <AuthProvider>
        <ContextGuard context="outlet">
          <LegacyApp />
        </ContextGuard>
      </AuthProvider>
    </OutletProvider>
  );
};

// Onboarding Shell
const OnboardingShell = () => (
    <OutletProvider>
        <AuthProvider>
             {/* We strictly want to ensure user is logged in, but not full POS shell yet? */}
             {/* For now, just context. OnboardingWizard handles its own logic/checks */}
             <ContextGuard context="outlet">
                <OnboardingWizard />
             </ContextGuard>
        </AuthProvider>
    </OutletProvider>
);

// Invoice Wrapper (Public Link Access)
const InvoiceWrapper = ({ printMode = false }) => {
    const { orderId } = useParams();
    return (
        <OutletProvider>
            <InvoiceView orderId={orderId} autoPrint={printMode} />
        </OutletProvider>
    );
};

// Guest Order Wrapper (QR Scan Access)
const GuestOrderWrapper = () => {
    return (
        <OutletProvider>
            <GuestOrder />
        </OutletProvider>
    );
};

// ==================================================
// MAIN ROUTER CONFIGURATION
// ==================================================
export default function App() {
  return (
    <BrowserRouter>
      {/* Suspense handles the loading state for lazy components */}
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
            {/* ============================================
                1. LANDING PAGE (Public)
                ============================================ */}
            <Route path="/" element={<WelcomeWebsite />} />
            
            {/* ============================================
                2. PLATFORM AUTH (Public -> Protected)
                Direct access to company login
                ============================================ */}
            <Route path="/login" element={
                <PlatformShell>
                    <CompanyLogin />
                </PlatformShell>
            } />
            
            
            {/* ============================================
                3. PLATFORM ADMIN (Protected)
                Secure area for Super Admins, Managers, etc.
                - Auth Required
                - Role Check Required
                ============================================ */}
            <Route path="/admin/*" element={
                <PlatformShell>
                    <RequireAuth allowedRoles={ALL_PLATFORM_ROLES} redirectTo="/login">
                        <PlatformAdmin />
                    </RequireAuth>
                </PlatformShell>
            } />
            
            {/* ============================================
                4. PUBLIC UTILITY ROUTES (Unauthenticated)
                These are safe, read-only or limited interaction views.
                ============================================ */}
            <Route path="/:outletId/invoice/:orderId" element={<InvoiceWrapper />} />
            <Route path="/:outletId/invoice/:orderId/print" element={<InvoiceWrapper printMode={true} />} />
            <Route path="/:outletId/order/table/:tableId" element={<GuestOrderWrapper />} />
            
             {/* ============================================
                5. ONBOARDING (New Outlet Setup)
                Dedicated route for setup flow
                ============================================ */}
            <Route path="/:outletId/setup" element={<OnboardingShell />} />

            {/* ============================================
                6. OUTLET POS APPLICATION
                Dynamic route based on Outlet ID.
                - Loads the POS bundle
                - Enforces separation from Platform logic
                ============================================ */}
            <Route path="/:outletId/*" element={<AppShell />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}
