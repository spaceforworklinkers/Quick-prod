import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Loader2, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';

/**
 * ADMIN Dashboard (Operations Focused)
 * 
 * Purpose: Day-to-day operational visibility
 * Restrictions: NO Revenue, NO Financial Data, NO Charts
 */
export const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingRequests: 0,
        outletsInSetup: 0,
        activeOutlets: 0,
        trialsEnding: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // 1. Requests Pending Approval
            const { count: requestCount } = await supabase
                .from('conversion_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');
            
            // 2. Outlets Logic
            const { data: outlets } = await supabase
                .from('restaurants')
                .select('subscription_status, trial_expiry');
            
            // Calculate Trials Ending Soon (within 3 days)
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            
            const expiring = outlets?.filter(o => 
                o.subscription_status === 'trial' && 
                new Date(o.trial_expiry) < threeDaysFromNow && 
                new Date(o.trial_expiry) > new Date()
            ).length || 0;

            if (outlets) {
                setStats({
                    pendingRequests: requestCount || 0,
                    outletsInSetup: outlets.filter(o => o.subscription_status === 'trial').length, // Using trial as proxy for setup/new
                    activeOutlets: outlets.filter(o => o.subscription_status === 'active').length,
                    trialsEnding: expiring
                });
            }

        } catch (error) {
            console.error('Admin Dashboard Error:', error);
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operational Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage onboarding, approvals, and system health.</p>
                </div>
                <button 
                    onClick={fetchStats} 
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
                </button>
            </div>

            {/* KPI Cards (Task Focused) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Pending Approvals" 
                    value={stats.pendingRequests} 
                    subtext="Requests awaiting review"
                    icon={FileCheck}
                    colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                />
                <StatCard 
                    title="Setup / Trial" 
                    value={stats.outletsInSetup} 
                    subtext="Outlets in onboarding phase"
                    icon={Building2}
                    colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                />
                <StatCard 
                    title="Active Tenants" 
                    value={stats.activeOutlets} 
                    subtext="Fully operational outlets"
                    icon={CheckCircle}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard 
                    title="Trials Expiring" 
                    value={stats.trialsEnding} 
                    subtext="Action required within 72h"
                    icon={Clock}
                    colorClass={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                />
            </div>

            {/* Operational Tasks Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* System Alerts Tile */}
                <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-indigo-500" />
                        System Alerts
                    </h3>
                    <div className="space-y-3">
                        {stats.trialsEnding > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">{stats.trialsEnding} Trials Expiring Soon</p>
                                    <p className="text-[10px] text-gray-500">Contact owners to convert to paid active status.</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-gray-900">Platform Operational</p>
                                <p className="text-[10px] text-gray-500">All systems running normally.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Admin Specific) */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        Team & Support Scope
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="block text-xs font-medium text-gray-500 uppercase">My Role</span>
                            <span className="block text-sm font-bold text-gray-900 mt-1">Platform Admin</span>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="block text-xs font-medium text-gray-500 uppercase">Access Level</span>
                            <span className="block text-sm font-bold text-gray-900 mt-1">Operations Only</span>
                         </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                        Authorized to manage conversion requests, outlets, and support staff. Financial data and platform ownership settings are restricted.
                    </p>
                </div>

            </div>
        </div>
    );
};
