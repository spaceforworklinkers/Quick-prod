import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { PLATFORM_ROLES } from '@/config/permissions';
import { Loader2, ShieldAlert } from 'lucide-react';

// Import Role Dashboards
import { OwnerSuperAdminDashboard } from './OwnerSuperAdminDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { SalespersonDashboard } from './SalespersonDashboard';
import { AccountantDashboard } from './AccountantDashboard';

/**
 * DYNAMIC DASHBOARD ROUTER
 * 
 * Renders the appropriate dashboard based on the user's role.
 * Each role sees a DIFFERENT dashboard with role-specific widgets.
 * 
 * All dashboards follow the clean SaaS standards for Platform Admin.
 */
export const DynamicDashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600 mb-4" />
        <p className="text-sm font-medium text-gray-500">Preparing your dashboard...</p>
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  switch (role) {
    case PLATFORM_ROLES.OWNER_SUPER_ADMIN:
      return <OwnerSuperAdminDashboard />;
    
    case PLATFORM_ROLES.SUPER_ADMIN:
      return <SuperAdminDashboard />;
    
    case PLATFORM_ROLES.ADMIN:
      return <AdminDashboard />;
    
    case PLATFORM_ROLES.MANAGER:
      return <ManagerDashboard />;
    
    case PLATFORM_ROLES.SALESPERSON:
      return <SalespersonDashboard />;
    
    case PLATFORM_ROLES.ACCOUNTANT:
      return <AccountantDashboard />;
    
    default:
      return <UnauthorizedDashboard />;
  }
};

const UnauthorizedDashboard = () => (
  <div className="max-w-md mx-auto mt-20 p-8 bg-black/5 rounded-2xl border border-black/5 text-center backdrop-blur-sm">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <ShieldAlert className="w-8 h-8 text-red-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
    <p className="text-gray-600 mt-2 text-sm leading-relaxed">
      Your account role does not have permission to view this dashboard. 
      Please contact the system administrator if you believe this is an error.
    </p>
  </div>
);

export default DynamicDashboard;
