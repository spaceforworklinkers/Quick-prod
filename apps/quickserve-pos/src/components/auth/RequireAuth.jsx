import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ALL_PLATFORM_ROLES, ALL_OUTLET_ROLES, isPlatformRole, isOutletRole } from '@/config/permissions';

/**
 * STRICT AUTH MIDDLEWARE
 * Enforces authentication and role-based authorization on protected routes.
 * 
 * Props:
 * - allowedRoles: Array of roles permitted to access this route
 * - redirectTo: Where to redirect unauthenticated users (default: /login)
 */
export const RequireAuth = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    // RULE 1: Show loading spinner while auth state is being determined
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin w-10 h-10 text-blue-600 mx-auto"/>
                    <p className="mt-4 text-gray-500 text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    // RULE 2: NO USER = REDIRECT TO LOGIN
    if (!user) {
        console.log("[RequireAuth] No user, redirecting to:", redirectTo);
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // RULE 3: NO ROLE = ACCESS DENIED (profile missing or no permission)
    if (!role) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-red-50">
                <div className="text-5xl mb-4">⛔</div>
                <h1 className="text-2xl font-bold text-red-800">Access Denied</h1>
                <p className="text-red-600 mt-2">Your account does not have permission to access this resource.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    // RULE 4: ROLE CHECK (if specific roles required)
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-orange-50">
                <div className="text-5xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-orange-800">Insufficient Permissions</h1>
                <p className="text-orange-600 mt-2">
                    Your role <span className="font-mono bg-orange-100 px-2 py-1 rounded">{role}</span> cannot access this page.
                </p>
                <button 
                    onClick={() => window.history.back()}
                    className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // ALL CHECKS PASSED
    return children;
};

/**
 * OUTLET-SPECIFIC AUTH GUARD
 * Ensures user is authenticated AND has a valid outlet role
 */
export const RequireOutletAuth = ({ children }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin w-10 h-10 text-orange-500"/>
            </div>
        );
    }

    // No user = show login screen (handled by LegacyApp)
    if (!user) {
        return null; // Let LegacyApp handle showing LoginScreen
    }

    // Platform user at outlet URL = BLOCK
    if (ALL_PLATFORM_ROLES.includes(role)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
                <div className="text-5xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold">Wrong Portal</h1>
                <p className="text-gray-400 mt-2">Platform administrators cannot access outlet POS systems.</p>
                <button 
                    onClick={() => window.location.href = '/admin'}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Go to Platform Admin
                </button>
            </div>
        );
    }

    // No role for this outlet
    if (!role || !ALL_OUTLET_ROLES.includes(role)) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-red-50">
                <div className="text-5xl mb-4">⛔</div>
                <h1 className="text-2xl font-bold text-red-800">No Access</h1>
                <p className="text-red-600 mt-2">You are not authorized to access this outlet.</p>
            </div>
        );
    }

    return children;
};
