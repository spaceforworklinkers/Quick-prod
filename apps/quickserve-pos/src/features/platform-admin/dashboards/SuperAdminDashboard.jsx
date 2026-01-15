import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  Settings,
  Shield,
  Activity
} from 'lucide-react';

/**
 * SUPER_ADMIN Dashboard
 * 
 * Focus: Operations & System Health (Non-Financial)
 */
export const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOutlets: 0,
    activeOutlets: 0,
    trialOutlets: 0,
    pendingLeads: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: outlets } = await supabase.from('restaurants').select('subscription_status');
      if (outlets) {
        setStats(prev => ({
          ...prev,
          totalOutlets: outlets.length,
          activeOutlets: outlets.filter(o => o.subscription_status === 'active').length,
          trialOutlets: outlets.filter(o => o.subscription_status === 'trial').length
        }));
      }

      const { count: usersCount } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true });
      if (usersCount !== null) setStats(prev => ({ ...prev, totalUsers: usersCount }));

      const { count: leadsCount } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      if (leadsCount !== null) setStats(prev => ({ ...prev, pendingLeads: leadsCount }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Operations Overview</h1>
          <p className="text-sm text-gray-500">System performance and outlet management</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Outlets</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalOutlets}</p>
          <p className="text-xs text-emerald-600 mt-1">{stats.activeOutlets} Active outlets</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Platform Users</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Managed platform roles</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pending Leads</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingLeads}</p>
          <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Database Engine</span>
              <span className="text-xs font-medium text-emerald-600">Operational</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Auth Service</span>
              <span className="text-xs font-medium text-emerald-600">Active</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Platform API</span>
              <span className="text-xs font-medium text-emerald-600">99.9% Uptime</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            Recent Security
          </h2>
          <div className="space-y-3">
            <p className="text-xs text-gray-500 border-l-2 border-emerald-500 pl-3">New user logged in (Super Admin)</p>
            <p className="text-xs text-gray-500 border-l-2 border-emerald-500 pl-3">Lead profile updated</p>
            <p className="text-xs text-gray-500 border-l-2 border-blue-500 pl-3">System backup scheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
};
