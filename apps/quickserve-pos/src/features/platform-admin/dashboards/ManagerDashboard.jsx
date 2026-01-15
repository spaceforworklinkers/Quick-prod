import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  FileText,
  Clock, 
  RefreshCw, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

/**
 * MANAGER Dashboard
 * 
 * Focus: Approvals & Monitoring
 */
export const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingLeads: 0,
    activeOutlets: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: leadsCount } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      if (leadsCount !== null) setStats(prev => ({ ...prev, pendingLeads: leadsCount }));

      const { data: outlets } = await supabase.from('restaurants').select('id').eq('subscription_status', 'active');
      if (outlets) setStats(prev => ({ ...prev, activeOutlets: outlets.length }));
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
          <h1 className="text-xl font-semibold text-gray-900">Manager Dashboard</h1>
          <p className="text-sm text-gray-500">Approvals and monitoring status</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-full">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Awaiting Approval</p>
              <p className="text-xs text-gray-500">Leads needing your attention</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingLeads}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Outlets</p>
              <p className="text-xs text-gray-500">Live platform subscribers</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeOutlets}</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-orange-200 transition-colors">
            <span className="text-sm text-gray-700">Review pending leads</span>
            <FileText className="w-4 h-4 text-gray-300" />
          </button>
          <button className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-orange-200 transition-colors">
            <span className="text-sm text-gray-700">View active outlets</span>
            <Building2 className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
