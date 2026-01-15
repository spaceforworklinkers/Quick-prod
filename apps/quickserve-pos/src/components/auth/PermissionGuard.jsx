import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/config/permissions';

export const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { role } = useAuth();
  
  if (!hasPermission(role, permission)) {
    return fallback;
  }
  
  return <>{children}</>;
};

// Guard for Routes/Views (Redirects or shows error)
export const ViewGuard = ({ permission, children }) => {
    const { role } = useAuth();

    if (!hasPermission(role, permission)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p>You do not have permission to view this page.</p>
                <p className="text-sm mt-2">Required: {permission}</p>
            </div>
        );
    }

    return <>{children}</>;
};
