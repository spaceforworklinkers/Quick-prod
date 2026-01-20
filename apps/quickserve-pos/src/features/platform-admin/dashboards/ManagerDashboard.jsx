import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Clock as ClockIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { exportToCSV, exportToExcel, exportToPDF, formatINR } from '@/utils/exportUtils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * MANAGER Dashboard (Enhanced 2026 B2B Edition)
 * 
 * Features:
 * - Real-time data with outlet names
 * - Interactive clickable cards
 * - Live charts and graphs
 * - PDF/CSV/Excel export
 * - Mobile-first responsive design
 * - Live clock with seconds
 */
export const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingRequests: 0,
        approvedToday: 0,
        rejectedToday: 0,
        outletsInSetup: 0
    });
    const [pendingRequestsData, setPendingRequestsData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch pending requests with outlet names
            const { data: pendingData } = await supabase
                .from('conversion_requests')
                .select(`
                    *,
                    salesperson:user_profiles!conversion_requests_salesperson_id_fkey(full_name, email)
                `)
                .eq('status', 'pending_manager_review')
                .order('created_at', { ascending: false });

            setPendingRequestsData(pendingData || []);

            // 2. Get counts for stats
            const { count: pendingCount } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending_manager_review');
            
            const { count: dailyApproved } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .in('status', ['manager_approved', 'fully_approved', 'outlet_created'])
                .gte('updated_at', new Date().toISOString().split('T')[0]); 
            
            const { count: dailyRejected } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'rejected')
                .gte('updated_at', new Date().toISOString().split('T')[0]);

            const { count: setupCount } = await supabase
                .from('restaurants')
                .select('*', { count: 'exact', head: true })
                .eq('subscription_status', 'trial');

            setStats({
                pendingRequests: pendingCount || 0,
                approvedToday: dailyApproved || 0,
                rejectedToday: dailyRejected || 0,
                outletsInSetup: setupCount || 0
            });

            // 3. Fetch trend data (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { data: trendRaw } = await supabase
                .from('conversion_requests')
                .select('created_at, status')
                .gte('created_at', sevenDaysAgo.toISOString());

            // Process trend data
            const trendMap = {};
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                trendMap[dateStr] = { date: dateStr, approved: 0, rejected: 0, pending: 0 };
            }

            (trendRaw || []).forEach(item => {
                const dateStr = item.created_at.split('T')[0];
                if (trendMap[dateStr]) {
                    if (item.status.includes('approved') || item.status === 'outlet_created') {
                        trendMap[dateStr].approved++;
                    } else if (item.status === 'rejected') {
                        trendMap[dateStr].rejected++;
                    } else {
                        trendMap[dateStr].pending++;
                    }
                }
            });

            setTrendData(Object.values(trendMap));

            // 4. Status distribution
            const { data: allRequests } = await supabase
                .from('conversion_requests')
                .select('status');

            const distribution = {};
            (allRequests || []).forEach(req => {
                distribution[req.status] = (distribution[req.status] || 0) + 1;
            });

            setStatusDistribution(
                Object.entries(distribution).map(([name, value]) => ({
                    name: name.replace(/_/g, ' ').toUpperCase(),
                    value
                }))
            );

        } catch (error) {
            console.error('Manager Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        exportToPDF('manager-dashboard', 'Manager_Dashboard');
    };

    const handleExportCSV = () => {
        const exportData = pendingRequestsData.map(req => ({
            'Outlet Name': req.outlet_name,
            'Salesperson': req.salesperson?.full_name || 'N/A',
            'City': req.city,
            'State': req.state,
            'Status': req.status,
            'Created': new Date(req.created_at).toLocaleDateString('en-IN')
        }));
        exportToCSV(exportData, 'Pending_Requests');
    };

    const handleExportExcel = () => {
        const exportData = pendingRequestsData.map(req => ({
            'Outlet Name': req.outlet_name,
            'Salesperson': req.salesperson?.full_name || 'N/A',
            'City': req.city,
            'State': req.state,
            'Status': req.status,
            'Created': new Date(req.created_at).toLocaleDateString('en-IN')
        }));
        exportToExcel(exportData, 'Pending_Requests');
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600 w-8 h-8" />
        </div>
    );

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick }) => (
        <div 
            onClick={onClick}
            className={`bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colorClass.text}`} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-2">{subtext}</p>
        </div>
    );

    return (
        <div id="manager-dashboard" className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 p-4 sm:p-6 lg:p-0">
            {/* Header with Live Clock */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Approvals & Quality Control</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Review pipeline, authorize outlets, and monitor setup quality</p>
                </div>
                <LiveClock />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button 
                    onClick={fetchDashboardData} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                >
                    <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                </Button>
                <Button 
                    onClick={handleExportPDF} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                >
                    <Download className="w-3 h-3 mr-2" /> Export PDF
                </Button>
                <Button 
                    onClick={handleExportCSV} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export CSV
                </Button>
                <Button 
                    onClick={handleExportExcel} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                >
                    <FileSpreadsheet className="w-3 h-3 mr-2" /> Export Excel
                </Button>
            </div>

            {/* Action Alert */}
            {stats.pendingRequests > 0 && (
                <div 
                    onClick={() => navigate('/admin')}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-blue-900">Action Required: {stats.pendingRequests} New Requests</h3>
                            <p className="text-xs text-blue-700">Sales team has submitted new outlet requests for approval</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards - Mobile First Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Pending Approval" 
                    value={stats.pendingRequests} 
                    subtext="Requests awaiting review"
                    icon={FileText}
                    colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                    onClick={() => navigate('/admin')}
                />
                <StatCard 
                    title="Approved Today" 
                    value={stats.approvedToday} 
                    subtext="Outlets authorized"
                    icon={CheckCircle}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard 
                    title="Rejected Today" 
                    value={stats.rejectedToday} 
                    subtext="Returned to sales"
                    icon={AlertTriangle}
                    colorClass={{ bg: 'bg-red-50', text: 'text-red-600' }}
                />
                <StatCard 
                    title="In Setup" 
                    value={stats.outletsInSetup} 
                    subtext="Outlets currently onboarding"
                    icon={Building2}
                    colorClass={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                />
            </div>

            {/* Charts Section - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Approval Trend Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        7-Day Approval Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
                            <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
                            <Line type="monotone" dataKey="pending" stroke="#f97316" strokeWidth={2} name="Pending" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pending Requests Table - Mobile Responsive */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Pending Requests with Outlet Details</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Outlet Name</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Salesperson</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700 hidden md:table-cell">Location</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequestsData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-3 py-8 text-center text-gray-400">
                                        No pending requests
                                    </td>
                                </tr>
                            ) : (
                                pendingRequestsData.map((req) => (
                                    <tr key={req.id} className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-3 font-medium text-gray-900">{req.outlet_name}</td>
                                        <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">{req.salesperson?.full_name || 'N/A'}</td>
                                        <td className="px-3 py-3 text-gray-600 hidden md:table-cell">{req.city}, {req.state}</td>
                                        <td className="px-3 py-3 text-gray-600">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="px-3 py-3">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => navigate(`/admin`)}
                                                className="text-xs"
                                            >
                                                Review
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
