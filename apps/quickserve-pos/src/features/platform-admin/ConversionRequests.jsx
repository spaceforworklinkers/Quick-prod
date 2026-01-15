import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';


/**
 * CONVERSION REQUESTS PIPELINE
 * 
 * Purpose: 
 * - Admin/Super Admin: View Only
 * - Manager: APPROVE / REJECT Authority
 */
export const ConversionRequests = () => {
    const { role, user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const isManager = role === 'MANAGER';

    useEffect(() => {
        fetchRequests();
        
        // Realtime subscription for updates
        const channel = supabase
            .channel('conversion_requests_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversion_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversion_requests')
                .select(`
                    *,
                    salesperson:salesperson_id (full_name, email),
                    manager:manager_id (full_name)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching conversion requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, action) => {
        if (!confirm(`Are you sure you want to ${action} this request? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase
                .from('conversion_requests')
                .update({ 
                    status: action,
                    manager_id: user.id, // Log the manager
                    approved_at: action === 'APPROVED' ? new Date().toISOString() : null
                })
                .eq('id', requestId);

            if (error) throw error;

            toast({
                title: `Request ${action}`,
                description: `The outlet request has been ${action.toLowerCase()}.`,
                className: action === 'APPROVED' ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            });
            
            fetchRequests(); // Refresh

        } catch (error) {
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            PENDING: 'bg-blue-50 text-blue-700 border-blue-100',
            APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            REJECTED: 'bg-red-50 text-red-700 border-red-100'
        };
        const icons = {
            PENDING: Clock,
            APPROVED: CheckCircle,
            REJECTED: XCircle
        };
        const Icon = icons[status] || Clock;
        
        return (
            <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${styles[status]} uppercase tracking-wide w-fit`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    const filteredRequests = filterStatus === 'ALL' 
        ? requests 
        : requests.filter(r => r.status === filterStatus);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Conversion Pipeline</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Review and approve outlet creation requests</p>
                </div>
                <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${
                                filterStatus === status 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outlet Details</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terms</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status / Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 relative">
                                                <FileText className="w-4 h-4 text-orange-600" />
                                                {/* Salesperson Indicator */}
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center" title={`Sales: ${req.salesperson?.full_name}`}>
                                                    <User className="w-2.5 h-2.5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{req.outlet_name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{req.owner_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-gray-900">{req.trial_type} Plan</span>
                                            <p className="text-[10px] text-gray-500">{req.trial_days} Days Trial</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {req.status === 'PENDING' && isManager ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'APPROVED')}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-colors flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                                        className="px-3 py-1 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 text-[10px] font-bold rounded transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <StatusBadge status={req.status} />
                                                    {req.status !== 'PENDING' && req.manager && (
                                                        <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-wider">
                                                            By {req.manager.full_name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="py-12 text-center text-sm text-gray-400 font-medium bg-gray-50/30">
                                    No requests found in this view.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
