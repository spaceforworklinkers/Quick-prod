import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  FileText, 
  CreditCard,
  TrendingUp,
  Download,
  Filter,
  Search,
  ChevronRight,
  Clock,
  Loader2,
  PieChart,
  BarChart3,
  ShieldAlert,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PLATFORM_ROLES } from '@/config/permissions';

/**
 * Finance & Billing Module (DEFINITIVE)
 * For: OWNER_SUPER_ADMIN, ACCOUNTANT
 */
export const FinanceManagement = ({ role }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 1850000,
    thisMonth: 263000,
    activeSubs: 12,
    pendingInvoices: 2
  });

  const isFinanceRole = role === PLATFORM_ROLES.OWNER_SUPER_ADMIN || role === PLATFORM_ROLES.ACCOUNTANT;

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => setLoading(false), 800);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isFinanceRole) {
    return (
      <div className="p-8 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
        <ShieldAlert className="w-12 h-12 text-red-100 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-gray-900">Access Restricted</h3>
        <p className="text-xs text-gray-500 mt-2">Only Owner or Accountant can view financial data.</p>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Finance & Billing</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Monitor platform revenue and subscription health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-semibold px-4 border-gray-200 shadow-sm">
            <Download className="w-3.5 h-3.5 mr-2 opacity-60" /> Export GST Report
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-xs font-semibold px-4 text-white shadow-md">
            View All Invoices
          </Button>
        </div>
      </div>

      {/* Financial Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Platform Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-orange-600', sub: 'Lifetime growth' },
          { label: 'Revenue (This Month)', value: formatCurrency(stats.thisMonth), icon: TrendingUp, color: 'text-emerald-600', sub: '+12.5% vs last month' },
          { label: 'Active Subscriptions', value: stats.activeSubs, icon: CreditCard, color: 'text-blue-600', sub: 'Verified tenants' },
          { label: 'Pending Collections', value: stats.pendingInvoices, icon: Clock, color: 'text-amber-600', sub: 'Awaiting clearance' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-gray-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-80`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`text-[10px] font-bold mt-2 ${kpi.color} opacity-90`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Professional Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Billing Logs */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
           <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h3 className="text-[13px] font-bold text-gray-800">Latest Invoices</h3>
              <PieChart className="w-4 h-4 text-gray-300" />
           </div>
           <div className="divide-y divide-gray-50">
              {[
                { id: 'INV-2026-001', rest: 'Cafe Delight', amt: 2999, status: 'Paid', date: 'Jan 14, 2026' },
                { id: 'INV-2026-002', rest: 'Spicy Wok', amt: 5499, status: 'Pending', date: 'Jan 12, 2026' },
                { id: 'INV-2026-003', rest: 'Urban Brew', amt: 2999, status: 'Paid', date: 'Jan 10, 2026' }
              ].map((inv, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{inv.id}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{inv.rest}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.amt)}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
              <button className="text-[11px] font-bold text-orange-600 hover:text-orange-700">Explore Full Billing History</button>
           </div>
        </div>

        {/* Revenue Analytics Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <h3 className="text-[13px] font-bold text-gray-800">Growth Forecast</h3>
           </div>
           <div className="h-40 flex items-end gap-1.5 mb-4">
              {[40, 60, 45, 90, 70, 85, 95].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 bg-orange-100 hover:bg-orange-600`} style={{ height: `${h}%` }} />
              ))}
           </div>
           <div className="flex justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>Mon</span>
              <span>Sun</span>
           </div>
           <div className="mt-6 pt-6 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">System predicts a <span className="text-emerald-500 font-bold">14% increase</span> in revenue next week based on current lead approvals.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
