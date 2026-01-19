import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Search, 
  Download, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Ban, 
  RefreshCw,
  Power,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

/**
 * OUTLET MANAGEMENT (DEFINITIVE)
 * 
 * - View all outlets
 * - Suspend/Activate tenants
 * - Manage trial periods
 * - Strict non-interference policy (No menu/order editing)
 */
export const OutletManagement = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [outlets, setOutlets] = useState([]);
    const [filteredOutlets, setFilteredOutlets] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Create State
    const [isCreating, setIsCreating] = useState(false);
    const [newOutlet, setNewOutlet] = useState({
        outletName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: Math.random().toString(36).slice(-10),
        city: '',
        state: ''
    });

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('create_outlet_direct_v2', {
                p_outlet_name: newOutlet.outletName,
                p_owner_name: newOutlet.ownerName,
                p_owner_email: newOutlet.ownerEmail,
                p_owner_phone: newOutlet.ownerPhone,
                p_owner_password: newOutlet.password,
                p_city: newOutlet.city,
                p_state: newOutlet.state,
                p_trial_days: 15
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error);

            toast({
                title: "Outlet Provisioned Successfully",
                description: `Created ${newOutlet.outletName} and owner account.`,
                className: "bg-emerald-50 text-emerald-800 border-emerald-200"
            });

            setIsCreating(false);
            setNewOutlet({
                outletName: '', ownerName: '', ownerEmail: '', ownerPhone: '', 
                password: Math.random().toString(36).slice(-10), city: '', state: ''
            });
            fetchOutlets();
        } catch (err) {
            console.error(err);
            toast({
                title: "Provisioning Failed",
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Action State
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [confirmAction, setConfirmAction] = useState({ 
        open: false, 
        type: null, // 'suspend', 'activate', 'extend_trial'
        title: '',
        description: ''
    });

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        filterOutlets();
    }, [outlets, searchQuery, statusFilter]);

    const fetchOutlets = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) {
            setOutlets(data);
            setFilteredOutlets(data);
        }
        setLoading(false);
    };

    const filterOutlets = () => {
        let result = outlets;

        // Text Search
        if (searchQuery) {
            const lowQuery = searchQuery.toLowerCase();
            result = result.filter(o => 
                o.name.toLowerCase().includes(lowQuery) || 
                o.id.toLowerCase().includes(lowQuery) ||
                (o.city || '').toLowerCase().includes(lowQuery)
            );
        }

        // Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(o => o.subscription_status === statusFilter);
        }

        setFilteredOutlets(result);
    };

    // --- ACTIONS ---

    const handleActionClick = (outlet, type) => {
        setSelectedOutlet(outlet);
        
        const content = {
            suspend: {
                title: 'Suspend Outlet Access',
                description: `Are you sure you want to suspend ${outlet.name}? This will immediately block all POS access for this tenant.`
            },
            activate: {
                title: 'Reactivate Outlet',
                description: `This will restore full access for ${outlet.name}.`
            },
            extend_trial: {
                title: 'Extend Trial Period',
                description: `Extend trial for ${outlet.name} by 14 days?`
            }
        };

        setConfirmAction({
            open: true,
            type,
            title: content[type]?.title,
            description: content[type]?.description
        });
    };

    const executeAction = async () => {
        if (!selectedOutlet || !confirmAction.type) return;
        
        setLoading(true);
        try {
            let updates = {};
            
            if (confirmAction.type === 'suspend') {
                updates = { subscription_status: 'suspended' };
            } else if (confirmAction.type === 'activate') {
                updates = { subscription_status: 'active' };
            } else if (confirmAction.type === 'extend_trial') {
                // Add 14 days to current time or current expiry
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 14);
                updates = { 
                    subscription_status: 'trial',
                    trial_expiry: futureDate.toISOString()
                };
            }

            const { error } = await supabase
                .from('restaurants')
                .update(updates)
                .eq('id', selectedOutlet.id);

            if (error) throw error;

            toast({
                title: "Action Successful",
                description: `Outlet ${selectedOutlet.name} has been updated.`,
                className: "bg-emerald-50 text-emerald-800 border-emerald-200"
            });

            fetchOutlets(); // Refresh list

        } catch (error) {
            console.error(error);
            toast({
                title: "Action Failed",
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
            setConfirmAction({ open: false, type: null, title: '', description: '' });
            setSelectedOutlet(null);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            trial: 'bg-blue-50 text-blue-700 border-blue-100',
            expired: 'bg-orange-50 text-orange-700 border-orange-100',
            suspended: 'bg-red-50 text-red-700 border-red-100'
        };
        return (
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${styles[status] || styles.expired} uppercase tracking-wide`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            
            {/* CONFIRMATION MODAL */}
            {confirmAction.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 space-y-4 m-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmAction.type === 'suspend' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {confirmAction.type === 'suspend' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
                             </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            {confirmAction.description}
                        </p>

                        <div className="flex justify-end gap-2 pt-4">
                             <Button 
                                variant="outline" 
                                onClick={() => setConfirmAction({ ...confirmAction, open: false })}
                                className="text-xs"
                             >
                                Cancel
                             </Button>
                             <Button 
                                variant={confirmAction.type === 'suspend' ? 'destructive' : 'default'}
                                className={`text-xs text-white ${confirmAction.type === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                onClick={executeAction}
                             >
                                Confirm Action
                             </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Outlet Management</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Monitor, audit, and manage tenant subscriptions</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setIsCreating(true)}
                        className="text-xs font-semibold px-4 shadow-md bg-gray-900 text-white hover:bg-black"
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" /> Create Tenant
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs font-semibold px-4 shadow-sm border-gray-200">
                        <Download className="w-3.5 h-3.5 mr-2 opacity-60" /> Export Summary
                    </Button>
                </div>
            </div>

            {/* CREATE TENANT MODAL */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 space-y-4 m-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2">
                             <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-orange-600" /> New Tenant Provisioning
                             </h3>
                             <button onClick={() => setIsCreating(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <form onSubmit={handleCreateTenant} className="space-y-4">
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Business Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label className="text-xs font-semibold">Outlet Name</Label>
                                        <Input bsSize="sm" required placeholder="e.g. Burger King - CP" value={newOutlet.outletName} onChange={e => setNewOutlet({...newOutlet, outletName: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">City</Label>
                                        <Input required placeholder="e.g. New Delhi" value={newOutlet.city} onChange={e => setNewOutlet({...newOutlet, city: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">State</Label>
                                        <Input required placeholder="e.g. Delhi" value={newOutlet.state} onChange={e => setNewOutlet({...newOutlet, state: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest">Owner Credentials</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label className="text-xs font-semibold">Full Name</Label>
                                        <Input required placeholder="Owner Name" value={newOutlet.ownerName} onChange={e => setNewOutlet({...newOutlet, ownerName: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs font-semibold">Email (Login ID)</Label>
                                        <Input type="email" required placeholder="owner@example.com" value={newOutlet.ownerEmail} onChange={e => setNewOutlet({...newOutlet, ownerEmail: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Mobile</Label>
                                        <Input required placeholder="+91..." value={newOutlet.ownerPhone} onChange={e => setNewOutlet({...newOutlet, ownerPhone: e.target.value})} className="h-8 text-xs bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">Initial Password</Label>
                                        <Input required value={newOutlet.password} onChange={e => setNewOutlet({...newOutlet, password: e.target.value})} className="h-8 text-xs bg-white font-mono" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="bg-gray-900 text-white hover:bg-black">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Provision Outlet'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONTROLS */}
            <div className="flex items-center justify-between gap-4 p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex gap-1 p-1">
                    {['all', 'active', 'trial', 'suspended'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                                statusFilter === filter 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="relative w-64 mr-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search outlets..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 pl-9 text-xs border-gray-200 focus:ring-0 focus:border-orange-500 bg-gray-50/50" 
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Outlet Details</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Licensing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-nowrap">Location</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOutlets.map(rest => (
                                <tr key={rest.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                                                <Building2 className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{rest.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">ID: {rest.id.split('-')[0]}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={rest.subscription_status || 'trial'} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                {rest.trial_expiry 
                                                    ? new Date(rest.trial_expiry).toLocaleDateString() 
                                                    : 'No Expiry Set'}
                                            </div>
                                            <p className="text-[10px] text-gray-400">
                                                Plan: Standard
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {rest.city || 'Location N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-xl">
                                                <DropdownMenuLabel className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tenant Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                
                                                <DropdownMenuItem 
                                                    className="text-xs font-medium cursor-pointer"
                                                    onClick={() => handleActionClick(rest, 'activate')}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Reactivate Access
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-xs font-medium cursor-pointer"
                                                    onClick={() => handleActionClick(rest, 'extend_trial')}
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-500" /> Extend Trial (+14d)
                                                </DropdownMenuItem>
                                                
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-xs font-bold text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                    onClick={() => handleActionClick(rest, 'suspend')}
                                                >
                                                    <Ban className="w-3.5 h-3.5 mr-2" /> Suspend Outlet
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOutlets.length === 0 && (
                        <div className="py-20 text-center">
                            <h3 className="text-sm font-bold text-gray-400">No outlets found matching filters.</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
