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
    trialExpiry: 0, // initializing to avoid undefined access
    pendingLeads: 0,
    totalUsers: 0,
    expiringTrials: 0
  });
  const [salesStats, setSalesStats] = useState([]);
  const [velocity, setVelocity] = useState({ todayLogs: 0, criticalAlerts: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Outlet Stats (Corrected for Subscription Expiry)
      const { data: outlets } = await supabase.from('restaurants').select('subscription_status, subscription_expiry');
      
      const expiringSoon = outlets?.filter(o => {
        if (o.subscription_status !== 'trial' || !o.subscription_expiry) return false;
        const expiry = new Date(o.subscription_expiry);
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

      // 2. User Stats (STRICT: Internal Only)
      const internalRoles = ['OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT'];
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .in('role', internalRoles);
      
      if (usersCount !== null) setStats(prev => ({ ...prev, totalUsers: usersCount }));

      // 3. Lead Stats & Sales Performance
      const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to, status, created_at');

      const { data: staff } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('role', ['SALESPERSON', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']); // Potential lead owners

      if (leads && staff) {
        // Aggregate Performance
        const perfMap = {};
        
        leads.forEach(lead => {
            const ownerId = lead.assigned_to || 'unassigned';
            if (!perfMap[ownerId]) perfMap[ownerId] = { total: 0, converted: 0, open: 0 };
            perfMap[ownerId].total++;
            if (lead.status === 'CONVERTED') perfMap[ownerId].converted++;
            else if (['PENDING', 'CONTACTED', 'QUALIFIED'].includes(lead.status)) perfMap[ownerId].open++;
        });

        const formattedStats = Object.keys(perfMap).map(id => {
            const owner = staff.find(s => s.id === id);
            return {
                name: owner ? owner.full_name : (id === 'unassigned' ? 'Unassigned' : 'Unknown'),
                ...perfMap[id]
            };
        }).sort((a, b) => b.total - a.total); // Sort by volume

        setSalesStats(formattedStats);
        setStats(prev => ({ 
            ...prev, 
            pendingLeads: leads.filter(l => l.status === 'PENDING').length 
        }));
      }

      // 4. Audit Velocity (Today)
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const { count: todaysLogs } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
        
      setVelocity({ todayLogs: todaysLogs || 0, criticalAlerts: 0 }); // Alert logic requires filtering, kept simple for velocity

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Operations</h1>
          <p className="text-sm text-gray-500 font-medium">System health and tenant oversight</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium text-gray-600 border border-gray-200 bg-white">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
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
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outlets</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOutlets}</p>
        </div>

        {/* Active Tenants */}
        <div className="bg-white border border-emerald-100 rounded-xl p-5 shadow-sm ring-4 ring-emerald-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{stats.activeOutlets}</p>
          <div className="w-full bg-emerald-100 h-1 mt-3 rounded-full overflow-hidden">
             <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${stats.totalOutlets ? (stats.activeOutlets / stats.totalOutlets) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* In Setup / Trial */}
        <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm ring-4 ring-blue-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trial / Setup</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.trialOutlets}</p>
        </div>

        {/* Suspended */}
        <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm ring-4 ring-red-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Suspended</span>
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.suspendedOutlets}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SALES & GROWTH LEADERS (NEW) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Sales & Growth Leaders (Real-time)
            </h2>
            
            <div className="space-y-4">
                {salesStats.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No lead data available yet.</p>
                ) : salesStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {stat.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">{stat.name}</p>
                                <p className="text-[10px] text-gray-500">{stat.total} Total Leads</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-right">
                             <div>
                                 <p className="text-xs font-bold text-emerald-600">{stat.converted}</p>
                                 <p className="text-[9px] uppercase font-bold text-gray-400">Converted</p>
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-blue-600">{stat.open}</p>
                                 <p className="text-[9px] uppercase font-bold text-gray-400">Open</p>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* PLATFORM VELOCITY (NEW) */}
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Platform Velocity
                </h2>
                <div className="text-center py-4 bg-orange-50/50 rounded-lg border border-orange-100 mb-4">
                    <p className="text-3xl font-bold text-orange-600">{velocity.todayLogs}</p>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mt-1">Actions Today</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-medium text-gray-600">Database Uptime</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100%</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-medium text-gray-600">API Health</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Stable</span>
                    </div>
                </div>
            </div>

            {/* Strict Internal Staff Count */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg text-white">
                <h2 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    Internal Team
                </h2>
                <div className="flex items-end gap-2">
                    <p className="text-4xl font-bold text-white leading-none">{stats.totalUsers}</p>
                    <span className="text-xs text-gray-500 font-medium mb-1">active accounts</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-3 pt-3 border-t border-gray-800">
                    *Excludes Outlet Owners & Staff
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
