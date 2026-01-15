import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Loader2,
  PieChart
} from 'lucide-react';

/**
 * ACCOUNTANT DASHBOARD
 * 
 * Purpose: Financial overview and compliance monitoring.
 * Restrictions: Read-Only, No Operational/POS data.
 */
export const AccountantDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingInvoices: 0,
        activeSubscriptions: 0,
        trialUsers: 0,
        taxCollected: 0,
        conversionRate: 0 
    });

    useEffect(() => {
        fetchFinancialStats();
    }, []);

    const fetchFinancialStats = async () => {
        setLoading(true);
        try {
            // Mocking some financial aggregations since actual tables like 'invoices' might be empty or not fully set up in this demo environment.
            // In a real scenario, these would be precise `count` or `sum` queries.
            
            // 1. Subscription Counts
            const { count: activeSubs } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active');

            const { count: trials } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'trial');

            // 2. Conversion Pipeline (Aggregated)
            const { count: totalRequests } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true });

             const { count: approvedRequests } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'APPROVED');

            // 3. Revenue (Mocked for Demo as 'payments' table is not populated yet)
            const mockRevenue = activeSubs * 299; 
            const mockTax = mockRevenue * 0.18;

            setStats({
                totalRevenue: mockRevenue,
                pendingInvoices: 12, // Mock
                activeSubscriptions: activeSubs || 0,
                trialUsers: trials || 0,
                taxCollected: mockTax,
                conversionRate: totalRequests ? Math.round((approvedRequests / totalRequests) * 100) : 0
            });

        } catch (error) {
            console.error('Accountant Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

    const StatCard = ({ title, value, prefix = '', suffix = '', icon: Icon, colorClass }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`w-5 h-5 ${colorClass.text}`} />
                </div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{prefix}{value.toLocaleString()}{suffix}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor revenue, billing cycles, and tax compliance.</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-1 flex">
                    <button className="px-3 py-1 text-xs font-bold bg-white rounded shadow-sm text-gray-900">This Month</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900">Last Quarter</button>
                    <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900">YTD</button>
                </div>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value={stats.totalRevenue} 
                    prefix="$"
                    icon={DollarSign}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                 <StatCard 
                    title="Tax Collected" 
                    value={stats.taxCollected} 
                    prefix="$"
                    icon={FileText}
                    colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                />
                <StatCard 
                    title="Pending Invoices" 
                    value={stats.pendingInvoices} 
                    icon={AlertCircle}
                    colorClass={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                />
            </div>

            {/* Subscription & Growth Health */}
            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Subscription Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Active Subscriptions" 
                    value={stats.activeSubscriptions} 
                    icon={CreditCard}
                    colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                />
                <StatCard 
                    title="Trial Outlets" 
                    value={stats.trialUsers} 
                    icon={Users}
                    colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                />
                <StatCard 
                    title="Trial-to-Paid" 
                    value={stats.conversionRate} 
                    suffix="%"
                    icon={TrendingUp}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard 
                    title="Revenue Forecast" 
                    value={(stats.activeSubscriptions * 299) + (stats.trialUsers * 0.4 * 299)} 
                    prefix="$"
                    icon={PieChart}
                    colorClass={{ bg: 'bg-gray-50', text: 'text-gray-600' }}
                />
            </div>

            {/* Read-Only Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 text-gray-500 text-xs">
                 <AlertCircle className="w-4 h-4 mt-0.5" />
                 <p>
                    <strong>Compliance Role:</strong> You have full read-only access to all financial records. 
                    Operational data such as leads, POS transactions, and user management are strictly hidden.
                 </p>
            </div>
        </div>
    );
};
