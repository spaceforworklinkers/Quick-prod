import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  RefreshCw, 
  Loader2,
  DollarSign,
  PieChart
} from 'lucide-react';

/**
 * ACCOUNTANT Dashboard
 * 
 * Focus: Financial metrics & Subscriptions
 */
export const AccountantDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Finance Board</h1>
          <p className="text-sm text-gray-500">Revenue and billing oversight</p>
        </div>
        <button onClick={() => {}} className="p-2 hover:bg-gray-100 rounded-full">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Monthly Revenue</p>
              <p className="text-xs text-gray-500">Subscription billing</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(263000)}</p>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            12% vs last month
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Subscriptions</p>
              <p className="text-xs text-gray-500">Paying tenants</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting first subscriber</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Growth Forecast
          </h2>
          <div className="h-32 flex items-end gap-2 px-2">
            {[30, 45, 35, 60, 55, 75, 65, 85, 80, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-100 rounded-t hover:bg-indigo-200 transition-colors" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 px-2">
             <span className="text-[10px] text-gray-400">Jan</span>
             <span className="text-[10px] text-gray-400">Oct</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-orange-500" />
            Billing Mix
          </h2>
          <div className="space-y-4">
             <div className="flex items-center justify-between text-xs">
               <span className="text-gray-500 italic">No data yet</span>
             </div>
             <p className="text-xs text-gray-400">Revenue mix will appear here once outlets start paying.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
