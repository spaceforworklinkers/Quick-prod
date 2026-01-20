import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  PlusCircle, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * SALESPERSON Dashboard (Enhanced 2026 B2B Edition)
 * 
 * Features:
 * - Performance analytics with charts
 * - Request tracking with outlet names
 * - Conversion rate visualization
 * - PDF/CSV/Excel export
 * - Mobile-first responsive design
 * - Live clock with seconds
 */
export const SalespersonDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myRequests, setMyRequests] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        conversionRate: 0
    });
    const [monthlyTrend, setMonthlyTrend] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all my requests
            const { data, error } = await supabase
                .from('conversion_requests')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setMyRequests(data || []);

            // Calculate stats
            const total = data?.length || 0;
            const approved = data?.filter(r => 
                r.status === 'fully_approved' || 
                r.status === 'outlet_created' ||
                r.status === 'manager_approved'
            ).length || 0;
            const pending = data?.filter(r => 
                r.status === 'pending_manager_review' ||
                r.status === 'pending_admin_approval' ||
                r.status === 'query_from_manager'
            ).length || 0;
            const rejected = data?.filter(r => r.status === 'rejected').length || 0;
            const conversionRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;

            setStats({ total, approved, pending, rejected, conversionRate });

            // Monthly trend (last 6 months)
            const monthlyData = {};
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                monthlyData[monthKey] = { month: monthKey, requests: 0, approved: 0 };
            }

            (data || []).forEach(req => {
                const reqDate = new Date(req.created_at);
                const monthKey = reqDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].requests++;
                    if (req.status === 'fully_approved' || req.status === 'outlet_created') {
                        monthlyData[monthKey].approved++;
                    }
                }
            });

            setMonthlyTrend(Object.values(monthlyData));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        exportToPDF('salesperson-dashboard', 'My_Performance');
    };

    const handleExportCSV = () => {
        const exportData = myRequests.map(req => ({
            'Outlet Name': req.outlet_name,
            'Owner Email': req.owner_email,
            'City': req.city || 'N/A',
            'State': req.state || 'N/A',
            'Status': req.status,
            'Trial Days': req.trial_days,
            'Created': new Date(req.created_at).toLocaleDateString('en-IN'),
            'Updated': new Date(req.updated_at).toLocaleDateString('en-IN')
        }));
        exportToCSV(exportData, 'My_Requests');
    };

    const handleExportExcel = () => {
        const exportData = myRequests.map(req => ({
            'Outlet Name': req.outlet_name,
            'Owner Email': req.owner_email,
            'City': req.city || 'N/A',
            'State': req.state || 'N/A',
            'Status': req.status,
            'Trial Days': req.trial_days,
            'Created': new Date(req.created_at).toLocaleDateString('en-IN'),
            'Updated': new Date(req.updated_at).toLocaleDateString('en-IN')
        }));
        exportToExcel(exportData, 'My_Requests');
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-600 w-8 h-8" />
        </div>
    );

    const StatusBadge = ({ status }) => {
        const config = {
            'pending_manager_review': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Pending Review' },
            'query_from_manager': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Query' },
            'manager_approved': { bg: 'bg-green-50', text: 'text-green-700', label: 'Manager Approved' },
            'pending_admin_approval': { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Pending Admin' },
            'fully_approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Approved' },
            'rejected': { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
            'outlet_created': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Created' },
            'cancelled': { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Cancelled' }
        };
        const style = config[status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: status };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                {style.label}
            </span>
        );
    };

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
        <div id="salesperson-dashboard" className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 p-4 sm:p-6 lg:p-0">
            {/* Header with Live Clock */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">My Sales Performance</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your conversion requests and performance metrics</p>
                </div>
                <LiveClock />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button 
                    onClick={() => navigate('/admin')} 
                    size="sm"
                    className="text-xs bg-orange-600 hover:bg-orange-700"
                >
                    <PlusCircle className="w-3 h-3 mr-2" /> New Request
                </Button>
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

            {/* Performance Metrics - Mobile First Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                    title="Total Requests" 
                    value={stats.total} 
                    subtext="All time submissions"
                    icon={FileText}
                    colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                />
                <StatCard 
                    title="Approved" 
                    value={stats.approved} 
                    subtext="Successfully converted"
                    icon={CheckCircle}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard 
                    title="Pending" 
                    value={stats.pending} 
                    subtext="Under review"
                    icon={AlertCircle}
                    colorClass={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                />
                <StatCard 
                    title="Rejected" 
                    value={stats.rejected} 
                    subtext="Needs improvement"
                    icon={XCircle}
                    colorClass={{ bg: 'bg-red-50', text: 'text-red-600' }}
                />
                <StatCard 
                    title="Conversion Rate" 
                    value={`${stats.conversionRate}%`} 
                    subtext="Success percentage"
                    icon={Award}
                    colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                />
            </div>

            {/* Charts Section - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Trend */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        6-Month Performance Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="requests" fill="#f97316" name="Total Requests" />
                            <Bar dataKey="approved" fill="#10b981" name="Approved" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        Conversion Funnel
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">Submitted</span>
                                <span className="font-bold text-gray-900">{stats.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">Under Review</span>
                                <span className="font-bold text-gray-900">{stats.pending}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-amber-600 h-3 rounded-full" style={{ width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">Approved</span>
                                <span className="font-bold text-gray-900">{stats.approved}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-emerald-600 h-3 rounded-full" style={{ width: stats.total > 0 ? `${(stats.approved / stats.total) * 100}%` : '0%' }}></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">Conversion Rate</span>
                                <span className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Requests Table - Mobile Responsive */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">My Conversion Requests</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Outlet Name</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Owner Email</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700 hidden md:table-cell">Location</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-3 py-8 text-center text-gray-400">
                                        No requests yet. Create your first conversion request!
                                    </td>
                                </tr>
                            ) : (
                                myRequests.map((req) => (
                                    <tr key={req.id} className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-3 font-medium text-gray-900">{req.outlet_name}</td>
                                        <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">{req.owner_email}</td>
                                        <td className="px-3 py-3 text-gray-600 hidden md:table-cell">
                                            {req.city && req.state ? `${req.city}, ${req.state}` : 'N/A'}
                                        </td>
                                        <td className="px-3 py-3">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="px-3 py-3">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => navigate(`/admin`)}
                                                className="text-xs"
                                            >
                                                View
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
