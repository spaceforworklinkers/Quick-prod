
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
import { Toaster } from '@/components/ui/toaster';

// Wrapper to provide platform context
const PlatformShell = ({ children }) => (
    <OutletProvider> {/* No outletId means platform context */}
        <AuthProvider>
            <ContextGuard context="platform">
                {children}
            </ContextGuard>
        </AuthProvider>
    </OutletProvider>
);

// Wrapper to provide outlet context
const AppShell = () => {
  const { outletId } = useParams();
  
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

// Wrapper for Invoice to extract params
const InvoiceWrapper = ({ printMode = false }) => {
    const { orderId } = useParams();
    return (
        <OutletProvider>
            <InvoiceView orderId={orderId} autoPrint={printMode} />
        </OutletProvider>
    );
};

// Wrapper for Guest/QR Order
const GuestOrderWrapper = () => {
    return (
        <OutletProvider>
            <GuestOrder />
        </OutletProvider>
    );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* GLOBAL RULE: ROOT URL = PUBLIC WELCOME WEBSITE */}
        <Route path="/" element={<WelcomeWebsite />} />
        
        {/* COMPANY PLATFORM LOGIN (Internal Access Only) */}
        <Route path="/login" element={
            <PlatformShell>
                <CompanyLogin />
            </PlatformShell>
        } />
        
        {/* PLATFORM ADMIN PROTECTED AREA */}
        <Route path="/admin/*" element={
            <PlatformShell>
                <PlatformAdmin />
            </PlatformShell>
        } />
        
        {/* PUBLIC / UTILITY ROUTES (No Auth/Context context needed) */}
        <Route path="/:outletId/invoice/:orderId" element={<InvoiceWrapper />} />
        <Route path="/:outletId/invoice/:orderId/print" element={<InvoiceWrapper printMode={true} />} />
        <Route path="/:outletId/order/table/:tableId" element={<GuestOrderWrapper />} />
        
        {/* OUTLET OWNER & STAFF LOGIN / POS (OUTLET CONTEXT) */}
        <Route path="/:outletId/*" element={<AppShell />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
