import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  FileText,
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  Bell
} from 'lucide-react';

/**
 * ADMIN Dashboard
 * 
 * Focus: Operational management & Lead monitoring
 */
export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOutlets: 0,
    trialOutlets: 0,
    pendingLeads: 0
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
          trialOutlets: outlets.filter(o => o.subscription_status === 'trial').length
        }));
      }

      const { count: leadsCount } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      if (leadsCount !== null) setStats(prev => ({ ...prev, pendingLeads: leadsCount }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
          <p className="text-sm text-gray-500">Managing outlets and operational leads</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Tenants</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalOutlets}</p>
          <p className="text-xs text-blue-600 mt-1">{stats.trialOutlets} currently on trial</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Open Leads</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.pendingLeads}</p>
          <p className="text-xs text-amber-600 mt-1">Awaiting your review</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">System Tasks</span>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">0</p>
          <p className="text-xs text-emerald-600 mt-1">All tasks completed</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">Administrative Actions</h2>
        <p className="text-sm text-blue-700">You can manage users, oversee lead approvals, and configure platform settings from the sidebar.</p>
      </div>
    </div>
  );
};
