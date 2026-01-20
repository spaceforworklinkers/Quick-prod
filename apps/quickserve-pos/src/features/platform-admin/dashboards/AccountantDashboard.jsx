import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Calendar,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { exportToCSV, exportToExcel, exportToPDF, formatINR } from '@/utils/exportUtils';
import { fetchMonthlyGrowth } from '@/utils/analyticsUtils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * ACCOUNTANT Dashboard (Enhanced 2026 B2B Edition)
 * 
 * Features:
 * - Financial analytics in INR (Real Trends)
 * - Revenue charts and trends
 * - Subscription breakdown
 * - PDF/CSV/Excel export
 * - Mobile-first responsive design
 * - Live clock with seconds
 */
export const AccountantDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        activeSubscriptions: 0,
        trialUsers: 0,
        taxCollected: 0,
        conversionRate: 0
    });
    const [revenueTrend, setRevenueTrend] = useState(0);

    const [revenueData, setRevenueData] = useState([]);
    const [subscriptionBreakdown, setSubscriptionBreakdown] = useState([]);
    const [transactionData, setTransactionData] = useState([]);

    useEffect(() => {
        fetchFinancialData();
        // Auto-refresh every 60 seconds (financial data doesn't need frequent updates)
        const interval = setInterval(fetchFinancialData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            // ... (existing fetches) ...

            // Real Trend Calculation - Using Active Sub Growth as proxy for Revenue Growth
            const growth = await fetchMonthlyGrowth('restaurants', { subscription_status: 'active' });
            setRevenueTrend(growth);

            // 1. Subscription Counts
            const { count: activeSubs } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active');

            const { count: trials } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'trial');

            const { count: suspended } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'suspended');

            // 2. Revenue Calculations (INR)
            const subscriptionPrice = 2999; // ₹2,999 per month
            const monthlyRevenue = (activeSubs || 0) * subscriptionPrice;
            const totalRevenue = monthlyRevenue * 12; // Annual projection
            const gst = monthlyRevenue * 0.18; // 18% GST

            // 3. Conversion Pipeline
            const { count: totalRequests } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true });

            const { count: approvedRequests } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .in('status', ['fully_approved', 'outlet_created']);

            const conversionRate = totalRequests ? ((approvedRequests / totalRequests) * 100).toFixed(1) : 0;

            // 4. Monthly Revenue Trend (last 6 months)
            const monthlyTrend = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-IN', { month: 'short' });
                // Simulate growth (in real app, query actual payment records)
                const baseRevenue = monthlyRevenue;
                const variance = Math.random() * 0.2 - 0.1; // ±10% variance
                monthlyTrend.push({
                    month: monthKey,
                    revenue: Math.round(baseRevenue * (1 + variance)),
                    subscriptions: Math.round((activeSubs || 0) * (1 + variance))
                });
            }

            setRevenueData(monthlyTrend);

            // 5. Subscription Breakdown
            setSubscriptionBreakdown([
                { name: 'Active', value: activeSubs || 0, color: '#10b981' },
                { name: 'Trial', value: trials || 0, color: '#f59e0b' },
                { name: 'Suspended', value: suspended || 0, color: '#ef4444' }
            ]);

            // 6. Mock transaction data for export
            setTransactionData([
                { date: new Date().toLocaleDateString('en-IN'), type: 'Subscription', amount: subscriptionPrice, status: 'Paid' },
                { date: new Date().toLocaleDateString('en-IN'), type: 'Subscription', amount: subscriptionPrice, status: 'Paid' },
            ]);

            setStats({
                totalRevenue,
                monthlyRevenue,
                pendingPayments: Math.round(monthlyRevenue * 0.15), // Mock 15% pending
                activeSubscriptions: activeSubs || 0,
                trialUsers: trials || 0,
                taxCollected: gst,
                conversionRate
            });

        } catch (error) {
            console.error('Accountant Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        exportToPDF('accountant-dashboard', 'Financial_Report');
    };

    const handleExportCSV = () => {
        const exportData = transactionData.map(txn => ({
            'Date': txn.date,
            'Type': txn.type,
            'Amount (INR)': txn.amount,
            'Status': txn.status
        }));
        exportToCSV(exportData, 'Financial_Transactions');
    };

    const handleExportExcel = () => {
        const exportData = [
            { 'Metric': 'Total Revenue (Annual)', 'Value (INR)': stats.totalRevenue },
            { 'Metric': 'Monthly Revenue', 'Value (INR)': stats.monthlyRevenue },
            { 'Metric': 'GST Collected', 'Value (INR)': stats.taxCollected },
            { 'Metric': 'Active Subscriptions', 'Value (INR)': stats.activeSubscriptions },
            { 'Metric': 'Trial Users', 'Value (INR)': stats.trialUsers },
            { 'Metric': 'Conversion Rate', 'Value (INR)': `${stats.conversionRate}%` }
        ];
        exportToExcel(exportData, 'Financial_Summary');
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600 w-8 h-8" />
        </div>
    );

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick, trend }) => (
        <div 
            onClick={onClick}
            className={`
                bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-md transition-all duration-200
                ${onClick ? 'cursor-pointer hover:border-orange-200 dark:hover:border-gray-700 hover:scale-105' : ''}
            `}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass.bg} dark:bg-gray-800`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass.text}`} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
            </div>
            {subtext && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">{subtext}</p>}
            {trend !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                    {trend >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                    ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-500" />
                    )}
                    <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                        {Math.abs(trend)}% vs last month
                    </span>
                </div>
            )}
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    return (
        <div id="accountant-dashboard" className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 p-4 sm:p-6 lg:p-0">
            {/* Header with Live Clock */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Financial Overview</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor revenue, billing cycles, and tax compliance</p>
                </div>
                <LiveClock />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button 
                    onClick={fetchFinancialData} 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                </Button>
                <Button 
                    onClick={handleExportPDF} 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <Download className="w-3 h-3 mr-2" /> Export PDF
                </Button>
                <Button 
                    onClick={handleExportCSV} 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export CSV
                </Button>
                <Button 
                    onClick={handleExportExcel} 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Excel
                </Button>
            </div>

            {/* Primary Financial KPIs - Mobile First Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    title="Monthly Revenue" 
                    value={formatINR(stats.monthlyRevenue)} 
                    subtext="Current month recurring"
                    icon={DollarSign}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600 dark:text-emerald-500' }}
                    trend={revenueTrend}
                    onClick={() => navigate('/admin/revenue')}
                />
                <StatCard 
                    title="GST Collected" 
                    value={formatINR(stats.taxCollected)} 
                    subtext="18% on subscriptions"
                    icon={FileText}
                    colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600 dark:text-blue-500' }}
                    onClick={() => navigate('/admin/taxes')}
                />
                <StatCard 
                    title="Pending Payments" 
                    value={formatINR(stats.pendingPayments)} 
                    subtext="Awaiting collection"
                    icon={AlertCircle}
                    colorClass={{ bg: 'bg-orange-50', text: 'text-orange-600 dark:text-orange-500' }}
                    onClick={() => navigate('/admin/invoices')}
                />
            </div>

            {/* Charts Section - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Revenue Trend */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-md transition-colors">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        6-Month Revenue Trend (INR)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <Tooltip 
                                formatter={(value) => formatINR(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Subscription Breakdown */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-md transition-colors">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-500" />
                        Subscription Status
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={subscriptionBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {subscriptionBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Subscription Health Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Active Subscriptions" 
                    value={stats.activeSubscriptions} 
                    subtext="Paying customers"
                    icon={CreditCard}
                    colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600 dark:text-purple-500' }}
                    onClick={() => navigate('/admin/subscriptions')}
                />
                <StatCard 
                    title="Trial Outlets" 
                    value={stats.trialUsers} 
                    subtext="Potential conversions"
                    icon={Users}
                    colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600 dark:text-indigo-500' }}
                    onClick={() => navigate('/admin/trials')}
                />
                <StatCard 
                    title="Conversion Rate" 
                    value={`${stats.conversionRate}%`} 
                    subtext="Trial to paid"
                    icon={TrendingUp}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600 dark:text-emerald-500' }}
                    onClick={() => navigate('/admin/pipeline')}
                />
                <StatCard 
                    title="Annual Projection" 
                    value={formatINR(stats.totalRevenue)} 
                    subtext="Based on current MRR"
                    icon={Calendar}
                    colorClass={{ bg: 'bg-gray-50', text: 'text-gray-600 dark:text-gray-400' }}
                    onClick={() => navigate('/admin/reports')}
                />
            </div>

            {/* Compliance Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3 text-blue-900 dark:text-blue-100 text-xs sm:text-sm shadow-sm">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                    <p className="font-bold mb-1">Compliance Role - Read-Only Access</p>
                    <p className="text-blue-700 dark:text-blue-300">
                        You have full read-only access to all financial records, subscription data, and tax information. 
                        Operational data such as leads, POS transactions, and user management are restricted for compliance.
                    </p>
                </div>
            </div>
        </div>
    );
};
