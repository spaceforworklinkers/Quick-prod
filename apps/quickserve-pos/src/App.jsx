
import React from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { OutletProvider } from '@/context/OutletContext';
import { AuthProvider } from '@/context/AuthContext';
import LegacyApp from '@/features/legacy-pos/LegacyApp';
import InvoiceView from '@/features/legacy-pos/InvoiceView';
import GuestOrder from '@/features/legacy-pos/GuestOrder';
import PlatformAdmin from '@/features/platform-admin/PlatformAdmin';
import CompanyLogin from '@/features/platform-admin/CompanyLogin';
import WelcomeWebsite from '@/features/platform-admin/WelcomeWebsite';
import { ContextGuard } from '@/components/auth/ContextGuard';
import { ALL_PLATFORM_ROLES } from '@/config/permissions';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Toaster } from '@/components/ui/toaster';

// ==================================================
// SHELL WRAPPERS (Context Providers)
// ==================================================

// Platform Shell: For /login and /admin routes
const PlatformShell = ({ children }) => (
    <OutletProvider>
        <AuthProvider>
            <ContextGuard context="platform">
                {children}
            </ContextGuard>
        </AuthProvider>
    </OutletProvider>
);

// Outlet Shell: For /:outletId routes (POS, Kitchen, etc.)
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

// Invoice Wrapper (public utility route)
const InvoiceWrapper = ({ printMode = false }) => {
    const { orderId } = useParams();
    return (
        <OutletProvider>
            <InvoiceView orderId={orderId} autoPrint={printMode} />
        </OutletProvider>
    );
};

// Guest Order Wrapper (QR code public access)
const GuestOrderWrapper = () => {
    return (
        <OutletProvider>
            <GuestOrder />
        </OutletProvider>
    );
};

// ==================================================
// MAIN APP ROUTING
// ==================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            RULE 1: ROOT URL = PUBLIC WELCOME WEBSITE
            This is the ONLY public page (no auth required)
            ============================================ */}
        <Route path="/" element={<WelcomeWebsite />} />
        
        {/* ============================================
            RULE 2: COMPANY LOGIN
            Public login page for platform users
            ============================================ */}
        <Route path="/login" element={
            <PlatformShell>
                <CompanyLogin />
            </PlatformShell>
        } />
        
        {/* ============================================
            RULE 3: PLATFORM ADMIN - STRICTLY PROTECTED
            - Must be authenticated
            - Must have PLATFORM_ROLES
            - ContextGuard blocks outlet users
            - RequireAuth blocks unauthenticated users
            ============================================ */}
        <Route path="/admin/*" element={
            <PlatformShell>
                <RequireAuth allowedRoles={ALL_PLATFORM_ROLES} redirectTo="/login">
                    <PlatformAdmin />
                </RequireAuth>
            </PlatformShell>
        } />
        
        {/* ============================================
            RULE 4: PUBLIC UTILITY ROUTES
            Invoice viewing (shared links)
            QR Code ordering (customer facing)
            ============================================ */}
        <Route path="/:outletId/invoice/:orderId" element={<InvoiceWrapper />} />
        <Route path="/:outletId/invoice/:orderId/print" element={<InvoiceWrapper printMode={true} />} />
        <Route path="/:outletId/order/table/:tableId" element={<GuestOrderWrapper />} />
        
        {/* ============================================
            RULE 5: OUTLET POS - CONTEXT PROTECTED
            - ContextGuard handles outlet context
            - LegacyApp shows LoginScreen if not authenticated
            - Role-based view restrictions inside LegacyApp
            ============================================ */}
        <Route path="/:outletId/*" element={<AppShell />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
