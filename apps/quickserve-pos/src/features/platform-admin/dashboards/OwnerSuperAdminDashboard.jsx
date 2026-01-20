import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  FileText,
  Download,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * OWNER_SUPER_ADMIN Dashboard (DEFINITIVE)
 * High-level system & business health overview.
 */
export const OwnerSuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalOutlets: 0,
    activeSubs: 0,
    monthlyRevenue: 263000
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: requests } = await supabase.from('conversion_requests').select('*', { count: 'exact', head: true });
      const { data: outlets } = await supabase.from('restaurants').select('subscription_status');
      
      setStats({
        totalRequests: requests || 0,
        totalOutlets: outlets?.length || 0,
        activeSubs: outlets?.filter(o => o.subscription_status === 'active').length || 0,
        monthlyRevenue: 263000 // In a real app, this would be aggregated from payments
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-200" /></div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Executive Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Summary</h1>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest opacity-70">Platform Health & Strategic Metrics</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="text-[11px] font-bold px-4 border-gray-200 shadow-sm bg-white">
              <Download className="w-3.5 h-3.5 mr-2 opacity-60" /> Export Summary PDF
           </Button>
           <button onClick={fetchStats} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 transition-all">
              <RefreshCw className="w-4 h-4 text-gray-400" />
           </button>
        </div>
      </div>

      {/* Primary Strategic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Platform Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-orange-600', trend: '+14% vs last mo', bg: 'bg-orange-50' },
          { label: 'Active Tenants', value: stats.totalOutlets, icon: Building2, color: 'text-blue-600', trend: `${stats.activeSubs} Subscribed`, bg: 'bg-blue-50' },
          { label: 'Total Requests', value: stats.totalRequests, icon: FileText, color: 'text-indigo-600', trend: 'New conversion requests', bg: 'bg-indigo-50' },
          { label: 'System Health', value: '100%', icon: ShieldCheck, color: 'text-emerald-600', trend: 'All services active', bg: 'bg-emerald-50' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-4`}>
               <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <div className="flex items-center gap-1.5 mt-3">
               <div className="w-1 h-1 bg-emerald-500 rounded-full" />
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{kpi.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytical View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-50 rounded-lg"><Activity className="w-4 h-4 text-orange-600" /></div>
                 <h3 className="text-sm font-bold text-gray-900">Tenant Acquisition Trend</h3>
              </div>
              <div className="flex gap-1">
                 {['7D', '1M', '1Y'].map(t => <button key={t} className={`px-2 py-1 text-[9px] font-bold rounded ${t === '1M' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{t}</button>)}
              </div>
           </div>
           <div className="h-48 flex items-end gap-3 px-2">
              {[20, 35, 25, 60, 45, 80, 75, 95, 85, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-50 hover:bg-orange-600 rounded-t-sm transition-all duration-300" style={{ height: `${h}%` }} />
              ))}
           </div>
           <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>JAN</span>
              <span>OCT</span>
           </div>
        </div>

        {/* Global Awareness Widget */}
        <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
           <div className="relative z-10">
              <Globe className="w-8 h-8 text-orange-600 mb-6" />
              <h3 className="text-lg font-bold tracking-tight mb-2">Platform Scale</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">QuickServe is currently powering establishments across <span className="text-white">4 regions</span>. System utilization is at <span className="text-emerald-500">Peak Efficiency</span>.</p>
              
              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">North Region</span>
                    <span className="text-xs font-bold text-white text-nowrap">85% Capacity</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-orange-600" />
                 </div>
              </div>
           </div>
           <ArrowUpRight className="absolute -right-10 -bottom-10 w-48 h-48 text-white/[0.03] rotate-12" />
        </div>
      </div>
    </div>
  );
};
