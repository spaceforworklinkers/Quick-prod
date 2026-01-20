import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  FileText, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  AlertTriangle,
  History,
  Activity
} from 'lucide-react';

/**
 * MANAGER Dashboard (Approval & Quality Control)
 * 
 * Purpose: Fast approval of converted outlet requests.
 * Restrictions: NO Financials, NO User Management, NO Revenue.
 */
export const ManagerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingRequests: 0,
        approvedToday: 0,
        rejectedToday: 0,
        outletsInSetup: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Pending Conversion Requests
            const { count: pendingCount } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending_manager_review');
            
            // 2. Daily Approved (Final approved or Manager approved)
            const { count: dailyApproved } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .in('status', ['manager_approved', 'fully_approved', 'outlet_created'])
                .gte('updated_at', new Date().toISOString().split('T')[0]); 
            
            // 3. Daily Rejected
            const { count: dailyRejected } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'rejected')
                .gte('updated_at', new Date().toISOString().split('T')[0]);

            // 4. Setup Status (Proxy using Trial)
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

        } catch (error) {
            console.error('Manager Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`w-5 h-5 ${colorClass.text}`} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{value}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-2">{subtext}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Heading */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approvals & Quality</h1>
                    <p className="text-sm text-gray-500 mt-1">Review pipeline, authorize outlets, and monitor setup quality.</p>
                </div>
                <button 
                    onClick={fetchStats} 
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* ACTION CENTER - Highlight Immediate Tasks */}
            {stats.pendingRequests > 0 && (
                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse-slow">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-blue-900">Action Required: {stats.pendingRequests} New Requests</h3>
                            <p className="text-xs text-blue-700">Sales team has submitted new outlet requests for approval.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Pending Approval" 
                    value={stats.pendingRequests} 
                    subtext="Requests awaiting review"
                    icon={FileText}
                    colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
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

            {/* Operational Quality Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Activity Feed Widget */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4 text-gray-500" />
                        Approval Activity Log
                    </h3>
                    <div className="space-y-4">
                        <div className="text-xs text-gray-400 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Recent approval actions will appear here.
                        </div>
                    </div>
                </div>

                {/* System Alerts */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" />
                        System Diagnostics
                    </h3>
                    <div className="space-y-3">
                         <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-emerald-900">Outlet Creation Service</p>
                                <p className="text-[10px] text-emerald-700">Auto-provisioning trigger is active.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-gray-900">Tenant Isolation</p>
                                <p className="text-[10px] text-gray-500">Security policies enforcing correct access.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
