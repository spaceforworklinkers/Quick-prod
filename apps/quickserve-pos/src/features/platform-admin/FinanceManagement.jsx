import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download,
  Loader2,
  PieChart,
  DollarSign,
  CreditCard,
  FileText,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLATFORM_ROLES } from '@/config/permissions';

/**
 * Finance Management Module
 * 
 * Handles: Revenue, Subscriptions, Invoices, Taxes, and General Reports.
 * Roles: ACCOUNTANT (Full Financial Access), SUPER_ADMIN (Limited/No Financial Access).
 */
export const FinanceManagement = ({ role, view = 'reports' }) => {
  const [loading, setLoading] = useState(true);
  const isAccountant = role === PLATFORM_ROLES.ACCOUNTANT || role === PLATFORM_ROLES.OWNER_SUPER_ADMIN;

  useEffect(() => {
    // Simulate data fetch
    setTimeout(() => setLoading(false), 600);
  }, [view]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-300" /></div>;

  // SUPER ADMIN View (Non-Financial Reports) - Fallback
  if (!isAccountant) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-xl font-bold text-gray-900">System Reports</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Platform Utilization</h3>
                    <p className="text-xs text-gray-500">Non-financial metrics on system usage.</p>
                </div>
            </div>
        </div>
      );
  }

  // ACCOUNTANT Views
  const renderContent = () => {
      switch (view) {
          case 'revenue':
              return (
                  <div className="space-y-6">
                       <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Revenue Analysis</h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                                Detailed breakdown of MRR, ARR, and one-time payments. 
                                <br/>(Mock Data: $142,500 YTD Revenue)
                            </p>
                            <Button className="mt-6" variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
                       </div>
                  </div>
              );
          case 'subscriptions':
              return (
                  <div className="space-y-6">
                       <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Subscription Management</h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                                Active plans, churn rates, and renewal forecasts. 
                                <br/>(Mock Data: 145 Active, 12 Churned this month)
                            </p>
                       </div>
                  </div>
              );
          case 'invoices':
              return (
                  <div className="space-y-6">
                       <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-6 h-6 text-orange-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Invoices & Billing</h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                                View and download generated invoices for all tenants.
                                <br/>(Mock Data: 12 Pending Invoices)
                            </p>
                       </div>
                  </div>
              );
          case 'taxes':
              return (
                  <div className="space-y-6">
                       <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Tax & GST Compliance</h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                                Aggregated tax collected reports for filing.
                                <br/>(Mock Data: $24,500 Tax Collected YTD)
                            </p>
                            <Button className="mt-6" variant="outline"><Download className="w-4 h-4 mr-2" /> Download Report</Button>
                       </div>
                  </div>
              );
          default: // 'reports'
              return (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-900">Executive Summary</h3>
                            <p className="text-xs text-gray-500 mt-2">High-level financial health indicators.</p>
                        </div>
                   </div>
              );
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight capitalize">
            {view === 'reports' ? 'Financial Reports' : view}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Financial visibility and compliance module
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs font-semibold px-4">
            <Download className="w-3.5 h-3.5 mr-2 opacity-60" /> Export Data
          </Button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};
