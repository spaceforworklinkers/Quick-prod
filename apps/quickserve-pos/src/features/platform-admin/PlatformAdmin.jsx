import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Users, 
  LogOut,
  Settings,
  ChevronRight, 
  Menu,
  X,
  DollarSign,
  Shield,
  Briefcase,
  PieChart,
  History,
  CreditCard,
  Clock,
  Moon,
  Sun,
  Loader2
} from 'lucide-react';
import { PLATFORM_ROLES, hasPermission, PLATFORM_PERMISSIONS } from '@/config/permissions';

// Import modules
import { DynamicDashboard } from './dashboards/DynamicDashboard';
import { ConversionRequestsRouter } from './ConversionRequestsRouter';
import { UserManagement } from './UserManagement';
import { FinanceManagement } from './FinanceManagement';
import NotificationBell from './components/NotificationBell';
import { PlatformSettings } from './PlatformSettings';
import { AuditLogs } from './AuditLogs';
import { OutletManagement } from './OutletManagement';
import { SubscriptionManagement } from './SubscriptionManagement';

/**
 * ============================================================
 * PLATFORM ADMIN SHELL
 * ============================================================
 */
const PlatformAdmin = () => {
  const { user, profile, loading: authLoading, logout, role } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Persist choice
    if (typeof window !== 'undefined') {
      return localStorage.getItem('platform-theme') === 'dark';
    }
    return false;
  });

  // Toggle Dark Mode Logic
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('platform-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('platform-theme', 'light');
    }
  }, [isDarkMode]);

  // Define Navigation Items (Full Menu) - Show all during loading for better UX
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'System Overview', 
      icon: LayoutDashboard,
      visible: true 
    },
    { 
      id: 'pipeline', 
      label: 'Conversion Requests', 
      icon: FileText,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_CONVERSION_REQUESTS) 
    },
    { 
      id: 'outlets', 
      label: 'Outlets', 
      icon: Building2,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_OUTLETS) 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_USERS) 
    },
    { 
      id: 'trials', 
      label: 'Trials', 
      icon: Clock,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SUBSCRIPTIONS) 
    },
    { 
      id: 'revenue', 
      label: 'Revenue', 
      icon: DollarSign,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCIALS) 
    },
    { 
      id: 'subscriptions', 
      label: 'Subscriptions', 
      icon: CreditCard,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SUBSCRIPTIONS) 
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: FileText,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCIALS) 
    },
    { 
      id: 'taxes', 
      label: 'Taxes', 
      icon: Shield,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCIALS) 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: PieChart,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_ANALYTICS) 
    },
    { 
      id: 'audit', 
      label: 'Audit Logs', 
      icon: History,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS) 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      visible: authLoading || hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SYSTEM_SETTINGS) 
    }
  ].filter(item => item.visible); 

  const menuItems = navItems;

  const ContentComponent = (() => {
    switch (activeView) {
      case 'dashboard': return DynamicDashboard;
      case 'pipeline': return ConversionRequestsRouter;
      case 'outlets': return OutletManagement;
      case 'users': return UserManagement;
      case 'trials':
      case 'revenue':
      case 'invoices':
      case 'taxes':
      case 'reports': return () => <FinanceManagement role={role} view={activeView} />;
      case 'subscriptions': return SubscriptionManagement;
      case 'audit': return AuditLogs;
      case 'settings': return PlatformSettings;
      default: return null;
    }
  })();

  const signOut = async () => {
    await logout();
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className={`flex h-screen font-sans overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300`}>
        {/* MOBILE OVERLAY */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            />
        )}

        {/* SIDEBAR */}
        <aside className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-72 
            bg-white border-r border-gray-200
            dark:bg-gray-950 dark:border-gray-800
            transform transition-transform duration-300 ease-in-out
            flex flex-col
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            shadow-xl lg:shadow-none
        `}>
            {/* LOGO */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                 <div className="flex items-center gap-3">
                    <img 
                        src={isDarkMode ? "/images/logo/QuickServe-logo-white.png" : "/images/logo/QuickServe-logo-black.png"}
                        alt="QuickServe Logo" 
                        className="h-8 w-auto object-contain"
                    />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">QuickServe POS</h1>
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest leading-none">Platform Admin</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden ml-auto text-gray-400 hover:text-gray-900 dark:hover:text-white"
                 >
                    <X className="w-6 h-6" />
                 </button>
            </div>

            {/* USER PROFILE */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                         <span className="text-sm font-bold text-white">
                            {authLoading ? '...' : (user?.email?.charAt(0).toUpperCase() || 'U')}
                         </span>
                    </div>
                    <div className="overflow-hidden flex-1">
                        {authLoading ? (
                            <>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate">{profile?.full_name || user?.email || 'Admin User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{role?.replace(/_/g, ' ') || 'User'}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* NAV MENU */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                 {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveView(item.id);
                            setIsMobileMenuOpen(false);
                        }}
                        className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                            ${activeView === item.id 
                                ? 'bg-orange-50 text-orange-700 shadow-sm dark:bg-orange-600 dark:text-white dark:shadow-orange-900/50' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-orange-600 dark:text-white' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`} />
                            <span>{item.label}</span>
                        </div>
                        {activeView === item.id && <ChevronRight className="w-4 h-4 opacity-50" />}
                    </button>
                 ))}
            </nav>

            {/* THEME TOGGLE & LOGOUT */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0 space-y-2">
                {/* Dark Mode Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    {/* Toggle Switch Visual */}
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200 ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isDarkMode ? '18px' : '2px' }} />
                    </div>
                </button>

                {/* Logout Button */}
                <button 
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative">
            {/* MOBILE HEADER */}
            <header className="lg:hidden h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30 transition-colors">
                 <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 dark:text-gray-400">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-gray-100">QuickServe</span>
                 </div>
                 <NotificationBell />
            </header>

            {/* CONTENT SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto min-h-full pb-20">
                     {/* DESKTOP TOP BAR */}
                     <div className="hidden lg:flex justify-end mb-6 items-center gap-4">
                        <NotificationBell />
                     </div>

                     {ContentComponent ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <ContentComponent />
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-600" />
                            <p>Loading view...</p>
                        </div>
                     )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default PlatformAdmin;