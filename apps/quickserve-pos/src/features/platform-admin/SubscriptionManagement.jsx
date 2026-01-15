
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
    Search, Filter, Calendar, CreditCard, AlertCircle, 
    CheckCircle, XCircle, Clock, FileText, Download,
    Phone, Mail, User, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * =========================================================================
 * SUB SCRIPTIONS MANAGEMENT (PHASE 1)
 * =========================================================================
 * 
 * Objective: Read-only visibility of all outlet subscriptions.
 * Features:
 * - List all outlets with their plan status.
 * - Calculate "Expiring Soon" (<= 7 days).
 * - Allow Admins to add internal notes (e.g., "Customer promised payment").
 * - PDF Export for reporting.
 */

// -------------------------------------------------------------------------
// HELPER: STATUS CALCULATION LOGIC
// -------------------------------------------------------------------------
// This function determines the visual status of a subscription based on dates.
// It handles both TRIAL periods and FULL subscriptions.
const getStatusDetails = (outlet) => {
    // Determine which date to track: Trial Expiry or Paid Subscription Expiry
    const isTrial = outlet.subscription_status === 'trial';
    const expiryDate = isTrial ? outlet.trial_expiry : outlet.subscription_expiry;
    
    // Safety check for missing dates
    if (!expiryDate) return { status: 'UNKNOWN', color: 'text-gray-500 bg-gray-100', label: 'Unknown' };

    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    
    // 1. EXPIRED
    if (daysLeft < 0) {
        return { 
            status: 'EXPIRED', 
            color: 'text-red-700 bg-red-50 border-red-200', 
            label: 'Expired',
            daysLeft 
        };
    }
    
    // 2. EXPIRING SOON (Warning Zone: 7 Days)
    if (daysLeft <= 7) {
        return { 
            status: 'EXPIRING', 
            color: 'text-amber-700 bg-amber-50 border-amber-200', 
            label: `Expiring in ${daysLeft}d`,
            daysLeft
        };
    }

    // 3. ACTIVE (Healthy)
    return { 
        status: 'ACTIVE', 
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        label: isTrial ? 'Trial Active' : 'Active Paid',
        daysLeft
    };
};

export const SubscriptionManagement = () => {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [outlets, setOutlets] = useState([]);
    const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, TRIAL, EXPIRING, EXPIRED
    const [search, setSearch] = useState('');
    
    // View/Edit State for Internal Notes (Modal)
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // SECURITY: Only Super Admin, Admin, and Accountant can EDIT notes.
    // Managers can VIEW but not edit (handled in UI rendering).
    const canEdit = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(role);

    useEffect(() => {
        fetchData();
    }, []);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const fetchData = async () => {
        setLoading(true);
        try {
            // We fetch 'restaurants' and JOIN 'subscriptions'.
            // This gives us the outlet details AND their billing history/plans.
            const { data, error } = await supabase
                .from('restaurants')
                .select(`
                    *,
                    subscriptions (
                        id, plan_name, start_date, end_date, amount, 
                        billing_cycle, status, notes, last_payment_date
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOutlets(data || []);
        } catch (err) {
            console.error("Error fetching subscriptions:", err);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // METRICS CALCULATION (Client Side)
    // -------------------------------------------------------------------------
    const metrics = outlets.reduce((acc, curr) => {
        const { status, daysLeft } = getStatusDetails(curr);
        acc.total++;
        if (curr.subscription_status === 'trial') acc.trial++;
        if (curr.subscription_status === 'active') acc.active++;
        if (daysLeft >= 0 && daysLeft <= 7) acc.expiring++; // Critical metric
        if (daysLeft < 0) acc.expired++;
        return acc;
    }, { total: 0, trial: 0, active: 0, expiring: 0, expired: 0 });

    // -------------------------------------------------------------------------
    // ACTION: SAVE NOTES
    // -------------------------------------------------------------------------
    const handleSaveNote = async () => {
        if (!selectedOutlet) return;
        setIsSaving(true);
        try {
            // Check if there is a valid subscription record to attach the note to.
            let subId = selectedOutlet.subscriptions?.[0]?.id;
            
            if (!subId) {
                // Constraint: We currently store notes on the 'subscriptions' table.
                // If a trial user has no subscription record, we can't save notes yet.
                alert("Notes can only be added to outlets with a subscription record.");
                setIsSaving(false);
                setIsNoteDialogOpen(false);
                return;
            }

            const { error } = await supabase
                .from('subscriptions')
                .update({ notes: noteContent })
                .eq('id', subId);

            if (error) throw error;
            
            // Optimistic Update (Refresh UI immediately)
            const updatedOutlets = outlets.map(o => {
                if (o.id === selectedOutlet.id) {
                    const subs = [...(o.subscriptions || [])];
                    if(subs[0]) subs[0] = { ...subs[0], notes: noteContent };
                    return { ...o, subscriptions: subs };
                }
                return o;
            });
            setOutlets(updatedOutlets);
            setIsNoteDialogOpen(false);

        } catch (err) {
            console.error("Save note error:", err);
            alert("Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // ACTION: EXPORT PDF
    // -------------------------------------------------------------------------
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Subscription Status Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 22);

        const tableData = outlets.map(o => {
            const { label } = getStatusDetails(o);
            return [
                o.name,
                o.city || '-',
                o.phone || '-',
                o.subscription_status.toUpperCase(),
                label,
                o.subscription_expiry ? format(new Date(o.subscription_expiry), 'dd MMM yyyy') : 'N/A'
            ];
        });

        doc.autoTable({
            head: [['Outlet', 'City', 'Phone', 'Type', 'Status', 'Expiry']],
            body: tableData,
            startY: 30,
        });

        doc.save('subscriptions.pdf');
    };

    // Filter Logic
    const filterOutlet = (outlet) => {
        const { status } = getStatusDetails(outlet);
        const matchesSearch = outlet.name.toLowerCase().includes(search.toLowerCase()) || 
                            outlet.phone?.includes(search) || 
                            outlet.city?.toLowerCase().includes(search.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filter === 'ALL') return true;
        if (filter === 'TRIAL') return outlet.subscription_status === 'trial';
        if (filter === 'ACTIVE') return status === 'ACTIVE';
        if (filter === 'EXPIRING') return status === 'EXPIRING';
        if (filter === 'EXPIRED') return status === 'EXPIRED';
        return true;
    };

    const filteredOutlets = outlets.filter(filterOutlet);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subscriptions & Status</h2>
                    <p className="text-sm text-gray-500">Monitor outlet plans, expiry dates, and payments.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadPDF} className="gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard label="Total Outlets" value={metrics.total} color="bg-gray-50 text-gray-900" icon={CheckCircle} />
                <MetricCard label="On Trial" value={metrics.trial} color="bg-blue-50 text-blue-700" icon={Clock} />
                <MetricCard label="Active Paid" value={metrics.active} color="bg-emerald-50 text-emerald-700" icon={CreditCard} />
                <MetricCard label="Expiring Soon" value={metrics.expiring} color="bg-amber-50 text-amber-700" icon={AlertCircle} />
                <MetricCard label="Expired" value={metrics.expired} color="bg-red-50 text-red-700" icon={XCircle} />
            </div>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search outlet, city, or phone..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {['ALL', 'ACTIVE', 'TRIAL', 'EXPIRING', 'EXPIRED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-colors ${
                                filter === f 
                                ? 'bg-orange-600 text-white border-orange-600' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Outlet Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Expiry</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOutlets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        No outlets found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredOutlets.map((outlet) => {
                                    const { status, color, label, daysLeft } = getStatusDetails(outlet);
                                    const sub = outlet.subscriptions?.[0]; // Latest sub
                                    
                                    return (
                                        <tr key={outlet.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{outlet.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <span>{outlet.city || 'No City'}</span>
                                                    <span>•</span>
                                                    <span>{outlet.phone || 'No Phone'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium uppercase tracking-wider text-gray-600">
                                                    {outlet.subscription_status}
                                                </div>
                                                {sub ? (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        {sub.plan_name} ({sub.billing_cycle})
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-gray-400 mt-1">Default Trial</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${color}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {outlet.subscription_status === 'trial' ? (
                                                    <div>
                                                        {outlet.trial_expiry ? format(new Date(outlet.trial_expiry), 'dd MMM yyyy') : '-'}
                                                        <div className="text-[10px] text-gray-400 mt-0.5">Trial End</div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {outlet.subscription_expiry ? format(new Date(outlet.subscription_expiry), 'dd MMM yyyy') : '-'}
                                                        <div className="text-[10px] text-gray-400 mt-0.5">Plan End</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {outlet.phone && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Call Outlet">
                                                            <a href={`tel:${outlet.phone}`}><Phone className="w-4 h-4" /></a>
                                                        </Button>
                                                    )}
                                                    {canEdit && sub && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                                            onClick={() => {
                                                                setSelectedOutlet(outlet);
                                                                setNoteContent(sub.notes || '');
                                                                setIsNoteDialogOpen(true);
                                                            }}
                                                            title="Edit Notes"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NOTES DIALOG */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Internal Notes</DialogTitle>
                        <DialogDescription>
                            Add remarks for {selectedOutlet?.name}. These are only visible to platform staff.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="e.g. Spoke to owner, promised renewal by Friday..."
                            className="h-32"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNote} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Note'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const MetricCard = ({ label, value, color, icon: Icon }) => (
    <div className={`p-4 rounded-lg border ${color?.includes('border') ? '' : 'border-transparent'} ${color} flex flex-col justify-between h-24 shadow-sm`}>
        <div className="flex items-center justify-between opacity-80">
            <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
            {Icon && <Icon className="w-4 h-4" />}
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
);
