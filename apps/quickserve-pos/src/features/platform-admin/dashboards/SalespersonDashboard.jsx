import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * SALESPERSON DASHBOARD & WORKSPACE
 * 
 * Purpose: Submit and track OWN conversion requests.
 * Restrictions: NO Lead Data, NO Other Sales Data, NO Charts.
 */
export const SalespersonDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [myRequests, setMyRequests] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'create'
    
    // Form State
    const [formData, setFormData] = useState({
        outlet_name: '',
        owner_email: '',
        trial_type: 'STANDARD',
        trial_days: 14,
        business_type: 'restaurant' // Added simple metadata field (optional schema, stored in generic way or just kept for form logic for now, actually better to keep minimal per DB schema)
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            // RLS ensures they ONLY see their own records
            const { data, error } = await supabase
                .from('conversion_requests')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setMyRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('conversion_requests')
                .insert({
                    salesperson_id: user.id, // Explicitly linking, though RLS/Trigger could handle
                    outlet_name: formData.outlet_name,
                    owner_email: formData.owner_email,
                    trial_type: formData.trial_type,
                    trial_days: formData.trial_days,
                    status: 'PENDING'
                });

            if (error) throw error;

            toast({
                title: 'Request Submitted',
                description: 'Manager has been notified for approval.',
                className: "bg-emerald-50 text-emerald-800 border-emerald-200"
            });
            
            setFormData({ outlet_name: '', owner_email: '', trial_type: 'STANDARD', trial_days: 14, business_type: 'restaurant' });
            setView('list');
            fetchMyRequests();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setSubmitting(false);
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

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Sales Pipeline</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Track conversions and submit new outlet requests</p>
                </div>
                {view === 'list' ? (
                     <Button onClick={() => setView('create')} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold gap-2">
                        <PlusCircle className="w-4 h-4" /> New Outlet Request
                     </Button>
                ) : (
                    <Button variant="outline" onClick={() => setView('list')} className="text-xs font-bold">
                        Cancel & Return
                    </Button>
                )}
            </div>

            {/* CREATE VIEW */}
            {view === 'create' && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
                    <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                        <FileText className="w-4 h-4 text-orange-600" />
                        New Conversion Request
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Outlet Name</Label>
                                <Input 
                                    required
                                    placeholder="e.g. Urban Brew Cafe"
                                    value={formData.outlet_name}
                                    onChange={e => setFormData({...formData, outlet_name: e.target.value})}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Owner Email</Label>
                                <Input 
                                    required
                                    type="email"
                                    placeholder="client@email.com"
                                    value={formData.owner_email}
                                    onChange={e => setFormData({...formData, owner_email: e.target.value})}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Plan Type</Label>
                                <select 
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.trial_type}
                                    onChange={e => setFormData({...formData, trial_type: e.target.value})}
                                >
                                    <option value="STANDARD">Standard</option>
                                    <option value="PREMIUM">Premium</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Trial Duration</Label>
                                <select 
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.trial_days}
                                    onChange={e => setFormData({...formData, trial_days: parseInt(e.target.value)})}
                                >
                                    <option value={14}>14 Days (Standard)</option>
                                    <option value={30}>30 Days (Extended)</option>
                                    <option value={7}>7 Days (Short)</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-700 text-xs leading-relaxed">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>
                                Submitting this request will notify the Manager. 
                                Once approved, an account will be automatically created for the client. 
                                <br/><span className="font-bold">You cannot edit this after submission.</span>
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                             <Button type="submit" disabled={submitting} className="bg-gray-900 hover:bg-black text-white w-full sm:w-auto">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Submit Request
                             </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {myRequests.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outlet Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {myRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{req.outlet_name}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{req.owner_email}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            {req.trial_type} <span className="text-gray-400">•</span> {req.trial_days}d Trial
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center">
                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">No requests submitted</h3>
                            <p className="text-xs text-gray-400 mt-1">Create your first converted outlet request.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
