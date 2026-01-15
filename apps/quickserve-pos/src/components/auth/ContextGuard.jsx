import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { 
  ALL_PLATFORM_ROLES, 
  ALL_OUTLET_ROLES,
  isPlatformRole,
  isOutletRole 
} from '@/config/permissions';

// Roles and permissions should be imported directly from @/config/permissions.

export const ContextGuard = ({ context, children }) => {
    const { role, user, loading, logout } = useAuth();
    const { outletId } = useOutlet();

    // Show loading while auth state is determined
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin w-8 h-8 text-gray-500"/>
            </div>
        );
    }

    // If not logged in at platform routes, let the login page render
    if (context === 'platform' && !user) {
        return children;
    }

    // If not logged in at outlet routes, let the login screen render
    if (context === 'outlet' && !user) {
        return children;
    }

    // ==========================================
    // STRICT CONTEXT ENFORCEMENT
    // ==========================================
    
    if (context === 'platform') {
        // Outlet users at platform URL = BLOCK
        if (ALL_OUTLET_ROLES.includes(role)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 text-white">
                    <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-700">
                        <div className="text-5xl mb-6">🚫</div>
                        <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
                        <p className="text-slate-400 mb-8">
                            This portal is strictly for Company Platform users. 
                            Outlet Staff and Owners must use their dedicated outlet link.
                        </p>
                        <div className="space-y-4">
                            <button 
                                onClick={() => {
                                    const lastOutlet = localStorage.getItem('last_outlet_id');
                                    if (lastOutlet) {
                                        window.location.href = `/${lastOutlet}`;
                                    } else {
                                        logout();
                                        window.location.href = '/';
                                    }
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors"
                            >
                                Back to POS
                            </button>
                            <button 
                                onClick={logout}
                                className="w-full py-3 border border-slate-600 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    if (context === 'outlet') {
        // Platform users at outlet URL = REDIRECT to admin
        if (ALL_PLATFORM_ROLES.includes(role)) {
            return <Navigate to="/admin" replace />;
        }
    }

    return children;
};
