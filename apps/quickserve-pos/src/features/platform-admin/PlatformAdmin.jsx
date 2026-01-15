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
  Clock
} from 'lucide-react';
import { PLATFORM_ROLES, hasPermission, PLATFORM_PERMISSIONS } from '@/config/permissions';

// Import modules
import { DynamicDashboard } from './dashboards/DynamicDashboard';
import { ConversionRequests } from './ConversionRequests';
import { UserManagement } from './UserManagement';
import { FinanceManagement } from './FinanceManagement';
import { PlatformSettings } from './PlatformSettings';
import { AuditLogs } from './AuditLogs';
import { OutletManagement } from './OutletManagement';
import { SubscriptionManagement } from './SubscriptionManagement';

/**
 * ============================================================
 * PLATFORM ADMIN SHELL
 * ============================================================
 * 
 * Purpose:
 * This component acts as the main layout container for the entire
 * Company Admin / Platform side of the application.
 * 
 * Features:
 * 1. Responsive Sidebar Navigation.
 * 2. Role-Based Menu Generation (Dynamic visibility based on permissions).
 * 3. User Identity Display.
 * 4. Dynamic Content Routing (Switches views without page reload).
 */
export default function PlatformAdmin() {
  // Auth Context provides current user info and role permissions
  const { user, role, logout, loading: authLoading } = useAuth();
  
  // State for UI controls
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ----------------------------------------------------------------
  // NAVIGATION CONFIGURATION
  // ----------------------------------------------------------------
  // This list defines all possible navigation items.
  // The 'visible' property uses the centralized permission config
  // to toggle items on/off for specific roles.
  const navItems = [
    { 
      id: 'dashboard', 
      label: role === PLATFORM_ROLES.SALESPERSON ? 'Workspace' : 'System Overview', 
      icon: LayoutDashboard,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_DASHBOARD)
    },
    { 
      id: 'pipeline', 
      label: 'Conversion Requests', 
      icon: FileText,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_LEADS)
    },
    { 
      id: 'outlets', 
      label: 'Outlets', 
      icon: Building2,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_OUTLETS)
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_USERS)
    },
    { 
      id: 'trials', 
      label: 'Trials', 
      icon: Clock,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_OUTLETS)
    },
    { 
      id: 'revenue', 
      label: 'Revenue', 
      icon: DollarSign, 
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCE)
    },
    { 
      id: 'subscriptions', 
      label: 'Subscriptions', 
      icon: CreditCard,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_SUBSCRIPTIONS)
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: FileText,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCE)
    },
    { 
      id: 'taxes', 
      label: 'Taxes', 
      icon: Shield, // Using Shield as placeholder for Tax/Compliance
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCE)
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: PieChart, 
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCE)
    },
    { 
      id: 'audit', 
      label: 'Audit Logs', 
      icon: History,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS)
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SYSTEM_SETTINGS)
    }
  ].filter(item => item.visible); // Filter out unauthorized items

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* =======================================
          SIDEBAR NAVIGATION
          ======================================= */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo Area */}
        <div className="h-16 px-6 flex items-center border-b border-gray-100 mb-4 focus:outline-none" onClick={() => setActiveView('dashboard')}>
          <div className="flex items-center gap-3 cursor-pointer select-none">
            <img 
               src="/images/logo/QuickServe-logo-black.png" 
               alt="QuickServe" 
               className="h-8 w-auto object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-['Outfit'] font-bold text-gray-900 text-lg tracking-tight whitespace-nowrap leading-none">QuickServe POS</h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Company Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-50 text-orange-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                {sidebarOpen && <span>{item.label}</span>}
                {isActive && sidebarOpen && <div className="ml-auto w-1 h-4 bg-orange-600 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {sidebarOpen && (
            <div className="px-2 py-2 mb-3 bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-900 truncate">{user?.email}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-tighter">{role?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =======================================
          MAIN CONTENT AREA
          ======================================= */}
      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
        {/* Top Header */}
        <header className="h-16 hidden lg:flex items-center justify-between px-8 bg-white/10 backdrop-blur-sm border-b border-gray-100/50">
           <div className="text-xs text-gray-400 font-medium">QuickServe Management System v2.0</div>
           <div className="flex items-center gap-4">
              {/* Future: Notifications, Global Search */}
           </div>
        </header>

        {/* Dynamic Content Renderer */}
        <section className="p-8 max-w-[1400px] mx-auto w-full flex-1">
          {activeView === 'dashboard' && <DynamicDashboard />}
          {activeView === 'pipeline' && <ConversionRequests />}
          {(activeView === 'outlets' || activeView === 'trials') && <OutletManagement />}
          {['revenue', 'invoices', 'taxes', 'reports'].includes(activeView) && (
              <FinanceManagement role={role} view={activeView} />
          )}
          {activeView === 'subscriptions' && <SubscriptionManagement />}
          {activeView === 'users' && <UserManagement />}
          {activeView === 'audit' && <AuditLogs />}
          {activeView === 'settings' && <PlatformSettings />}
        </section>
      </main>
    </div>
  );
}
