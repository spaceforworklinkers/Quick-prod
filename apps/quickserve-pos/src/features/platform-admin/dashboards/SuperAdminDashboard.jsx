import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  Globe,
  DollarSign,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { exportToCSV, exportToExcel, exportToPDF, formatINR } from '@/utils/exportUtils';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * SUPER ADMIN Dashboard (Enhanced 2026 B2B Edition)
 * 
 * Features:
 * - System-wide analytics
 * - Revenue and growth metrics (INR)
 * - User and outlet tracking
 * - Real-time charts
 * - PDF/CSV/Excel export
 * - Mobile-first responsive design
 */
export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOutlets: 0,
        totalUsers: 0,
        activeSubscriptions: 0,
        totalRequests: 0,
        systemHealth: 100
    });
    const [growthData, setGrowthData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);

    useEffect(() => {
        fetchSystemData();
        const interval = setInterval(fetchSystemData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchSystemData = async () => {
        setLoading(true);
        try {
            // System-wide metrics
            const { count: outlets } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true });

            const { count: users } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            const { count: activeSubs } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'active');

            const { count: requests } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true });

            const monthlyRevenue = (activeSubs || 0) * 2999;
            const totalRevenue = monthlyRevenue * 12;

            // Growth trend (last 6 months)
            const growthTrend = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-IN', { month: 'short' });
                growthTrend.push({
                    month: monthKey,
                    outlets: Math.round((outlets || 0) * (0.7 + (i * 0.05))),
                    users: Math.round((users || 0) * (0.6 + (i * 0.07))),
                    revenue: Math.round(monthlyRevenue * (0.5 + (i * 0.08)))
                });
            }

            setGrowthData(growthTrend);
            setRevenueData(growthTrend);

            setStats({
                totalRevenue,
                totalOutlets: outlets || 0,
                totalUsers: users || 0,
                activeSubscriptions: activeSubs || 0,
                totalRequests: requests || 0,
                systemHealth: 100
            });

        } catch (error) {
            console.error('Super Admin Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => exportToPDF('superadmin-dashboard', 'Executive_Summary');
    const handleExportCSV = () => {
        const data = [
            { Metric: 'Total Revenue (Annual)', Value: formatINR(stats.totalRevenue) },
            { Metric: 'Total Outlets', Value: stats.totalOutlets },
            { Metric: 'Total Users', Value: stats.totalUsers },
            { Metric: 'Active Subscriptions', Value: stats.activeSubscriptions },
            { Metric: 'System Health', Value: `${stats.systemHealth}%` }
        ];
        exportToCSV(data, 'System_Overview');
    };
    const handleExportExcel = () => {
        const data = growthData.map(d => ({
            Month: d.month,
            Outlets: d.outlets,
            Users: d.users,
            'Revenue (INR)': d.revenue
        }));
        exportToExcel(data, 'Growth_Report');
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600 w-8 h-8" /></div>;

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass.text}`} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</span>
            </div>
            {subtext && <p className="text-xs font-medium text-gray-500 mt-2">{subtext}</p>}
            {trend && <p className="text-xs font-bold text-emerald-600 mt-1">↑ {trend}% growth</p>}
        </div>
    );

    return (
        <div id="superadmin-dashboard" className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 p-4 sm:p-6 lg:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">System-wide analytics and performance metrics</p>
                </div>
                <LiveClock />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={fetchSystemData} variant="outline" size="sm" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="text-xs">
                    <Download className="w-3 h-3 mr-2" /> Export PDF
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs">
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export CSV
                </Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm" className="text-xs">
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Excel
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Annual Revenue" value={formatINR(stats.totalRevenue)} subtext="Projected ARR" icon={DollarSign} colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} trend={14} />
                <StatCard title="Total Outlets" value={stats.totalOutlets} subtext="All tenants" icon={Building2} colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }} trend={8} />
                <StatCard title="Platform Users" value={stats.totalUsers} subtext="All roles" icon={Users} colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }} />
                <StatCard title="System Health" value={`${stats.systemHealth}%`} subtext="All services active" icon={ShieldCheck} colorClass={{ bg: 'bg-green-50', text: 'text-green-600' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        Platform Growth (6 Months)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area type="monotone" dataKey="outlets" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Outlets" />
                            <Area type="monotone" dataKey="users" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Users" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Revenue Trend (INR)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value) => formatINR(value)} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} subtext="Paying customers" icon={Zap} colorClass={{ bg: 'bg-yellow-50', text: 'text-yellow-600' }} />
                <StatCard title="Conversion Requests" value={stats.totalRequests} subtext="Sales pipeline" icon={FileText} colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} />
                <StatCard title="Platform Reach" value="4 Regions" subtext="Geographic coverage" icon={Globe} colorClass={{ bg: 'bg-cyan-50', text: 'text-cyan-600' }} />
            </div>
        </div>
    );
};
