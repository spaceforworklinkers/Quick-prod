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
  History
} from 'lucide-react';
import { PLATFORM_ROLES, hasPermission, PLATFORM_PERMISSIONS } from '@/config/permissions';

// Import modules
import { DynamicDashboard } from './dashboards/DynamicDashboard';
import { LeadManagement } from './LeadManagement';
import { UserManagement } from './UserManagement';
import { FinanceManagement } from './FinanceManagement';
import { PlatformSettings } from './PlatformSettings';
import { AuditLogs } from './AuditLogs';

/**
 * PLATFORM ADMIN SHELL (DEFINITIVE)
 * 
 * Layout: Left sidebar with branding
 * UX: Minimal, professional SaaS standard
 */
export default function PlatformAdmin() {
  const { user, role, logout, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    if (user && role) {
      fetchRestaurants();
    }
  }, [user, role]);

  const fetchRestaurants = async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRestaurants(data);
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Platform Overview', 
      icon: LayoutDashboard,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_DASHBOARD)
    },
    { 
      id: 'leads', 
      label: 'Lead Management', 
      icon: Briefcase,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_LEADS)
    },
    { 
      id: 'outlets', 
      label: 'Outlet Management', 
      icon: Building2,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_OUTLETS)
    },
    { 
      id: 'finance', 
      label: 'Finance & Billing', 
      icon: DollarSign,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_FINANCE)
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_USERS)
    },
    { 
      id: 'audit', 
      label: 'Audit Logs', 
      icon: History,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.VIEW_AUDIT_LOGS)
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      icon: Settings,
      visible: hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_SYSTEM_SETTINGS)
    }
  ].filter(item => item.visible);

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 px-6 flex items-center border-b border-gray-100 mb-4 focus:outline-none" onClick={() => setActiveView('dashboard')}>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 bg-orange-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-base">QS</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-gray-900 text-sm tracking-tight text-nowrap">QuickServe POS</h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Company Panel</p>
              </div>
            )}
          </div>
        </div>

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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
        {/* Top Header Placeholder for Desktop Search/Notifications */}
        <header className="h-16 hidden lg:flex items-center justify-between px-8 bg-white/10 backdrop-blur-sm border-b border-gray-100/50">
           <div className="text-xs text-gray-400 font-medium">QuickServe Management System v1.1.0</div>
           <div className="flex items-center gap-4">
              {/* Optional secondary actions can go here */}
           </div>
        </header>

        <section className="p-8 max-w-[1400px] mx-auto w-full flex-1">
          {activeView === 'dashboard' && <DynamicDashboard />}
          {activeView === 'leads' && <LeadManagement />}
          {activeView === 'outlets' && <OutletsView restaurants={restaurants} />}
          {activeView === 'finance' && <FinanceManagement role={role} />}
          {activeView === 'users' && <UserManagement />}
          {activeView === 'audit' && <AuditLogs />}
          {activeView === 'settings' && <PlatformSettings />}
        </section>
      </main>
    </div>
  );
}

// Redesigned Outlets View for the Definitive Spec
const OutletsView = ({ restaurants }) => {
  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      trial: 'bg-blue-50 text-blue-700 border-blue-100',
      expired: 'bg-orange-50 text-orange-700 border-orange-100',
      suspended: 'bg-red-50 text-red-700 border-red-100'
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Outlet Management</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Manage all cafe and restaurant tenants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-semibold px-4">
            <FileText className="w-3.5 h-3.5 mr-2 opacity-60" /> Export Summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {restaurants.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Restaurant</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subscription</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trial Ends</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {restaurants.map(rest => (
                  <tr key={rest.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{rest.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">ID: {rest.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadge(rest.subscription_status)}`}>
                        {rest.subscription_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                      {rest.trial_expiry ? new Date(rest.trial_expiry).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 lowercase">
                      {rest.city || 'not set'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:bg-blue-50 tracking-tight"
                        onClick={() => window.open(`/${rest.id}`, '_blank')}
                      >
                        Launch POS <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Building2 className="w-8 h-8 text-gray-200" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No active outlets</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto leading-relaxed">Approve leads or create tenants to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
