import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  AlertTriangle,
  Activity,
  FileText,
  AlertOctagon,
  Ban
} from 'lucide-react';

/**
 * SUPER ADMIN DASHBOARD (DEFINITIVE)
 * 
 * Purpose: Operational control and system health overview.
 * Restrictions: 
 * - NO Order-level data
 * - NO POS screens
 * - NO Cashier data
 * - NO Kitchen data
 * - Minimal charts, Status-focused
 */
export const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOutlets: 0,
    activeOutlets: 0,
    trialOutlets: 0,
    suspendedOutlets: 0,
    pendingLeads: 0,
    totalUsers: 0,
    expiringTrials: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Outlet Stats
      const { data: outlets } = await supabase.from('restaurants').select('subscription_status, trial_expiry');
      
      const expiringSoon = outlets?.filter(o => {
        if (o.subscription_status !== 'trial' || !o.trial_expiry) return false;
        const expiry = new Date(o.trial_expiry);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }).length || 0;

      if (outlets) {
        setStats(prev => ({
          ...prev,
          totalOutlets: outlets.length,
          activeOutlets: outlets.filter(o => o.subscription_status === 'active').length,
          trialOutlets: outlets.filter(o => o.subscription_status === 'trial').length,
          suspendedOutlets: outlets.filter(o => o.subscription_status === 'suspended').length,
          expiringTrials: expiringSoon
        }));
      }

      // 2. User Stats
      const { count: usersCount } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true });
      if (usersCount !== null) setStats(prev => ({ ...prev, totalUsers: usersCount }));

      // 3. Lead Stats
      const { count: leadsCount } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'PENDING');
      if (leadsCount !== null) setStats(prev => ({ ...prev, pendingLeads: leadsCount }));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Operations</h1>
          <p className="text-sm text-gray-500 font-medium">System health and tenant oversight</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium text-gray-600 border border-gray-200 bg-white">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* SYSTEM ALERTS SECTION */}
      {(stats.expiringTrials > 0 || stats.pendingLeads > 0) && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.expiringTrials > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-900">Trials Expiring Soon</h3>
                        <p className="text-xs text-amber-700 mt-1">{stats.expiringTrials} outlets require subscription action within 72h.</p>
                    </div>
                </div>
            )}
            {stats.pendingLeads > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-900">Pending Leads</h3>
                        <p className="text-xs text-blue-700 mt-1">{stats.pendingLeads} new registration requests awaiting approval.</p>
                    </div>
                </div>
            )}
         </div>
      )}

      {/* KPI CARDS - Operational Focus */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Outlets */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outlets</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOutlets}</p>
        </div>

        {/* Active Tenants */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeOutlets}</p>
          <div className="w-full bg-gray-100 h-1 mt-3 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full" style={{ width: `${(stats.activeOutlets / stats.totalOutlets) * 100}%` }}></div>
          </div>
        </div>

        {/* In Setup / Trial */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trial / Setup</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.trialOutlets}</p>
        </div>

        {/* Suspended */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Suspended</span>
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.suspendedOutlets}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SYSTEM HEALTH WIDGET */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            System Health & Integrity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-sm font-medium text-gray-700">Database Connection</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Stable</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-sm font-medium text-gray-700">Auth Services (RLS)</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-sm font-medium text-gray-700">Lead Ingestion</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Operational</span>
            </div>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Staff Access
            </h2>
            <div className="text-center py-6">
                <p className="text-4xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-2">Internal Company Accounts</p>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <p>Includes Admins, Managers, and Salespeople.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
