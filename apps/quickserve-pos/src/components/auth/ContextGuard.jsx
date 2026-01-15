import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOutlet } from '@/context/OutletContext';
import { Navigate } from 'react-router-dom';

export const PLATFORM_ROLES = ['OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SALESPERSON', 'ACCOUNTANT'];
export const OUTLET_ROLES = ['OWNER', 'MANAGER', 'STAFF', 'KITCHEN'];

export const ContextGuard = ({ context, children }) => {
    const { role, user, loading, logout } = useAuth();
    const { outletId } = useOutlet();

    if (loading) return null;

    // If not logged in, just show the intended (Login) page
    if (!user) return children;

    // STRICT ENFORCEMENT
    
    if (context === 'platform') {
        // If an outlet user is at the root/platform URL
        if (OUTLET_ROLES.includes(role)) {
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
                                onClick={() => window.location.href = `/${localStorage.getItem('last_outlet_id') || ''}`}
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
        // If a company platform user tries to access an outlet link
        if (PLATFORM_ROLES.includes(role)) {
            // Silently redirect platform users back to their dashboard context
            return <Navigate to="/admin" replace />;
        }
    }

    return children;
};
