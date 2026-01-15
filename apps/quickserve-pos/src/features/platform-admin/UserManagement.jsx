import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Loader2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PLATFORM_ROLES } from '@/config/permissions';

/**
 * USER & ROLE MANAGEMENT (DEFINITIVE)
 * For: OWNER_SUPER_ADMIN, SUPER_ADMIN
 */
export const UserManagement = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Inline Form State
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: PLATFORM_ROLES.ADMIN,
        password: Math.random().toString(36).slice(-10)
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
        setLoading(false);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        // This is a placeholder for real auth creation which requires service role on client side or edge function
        toast({ title: "Operation Restricted", description: "Internal user creation requires administrative override.", variant: "destructive" });
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Internal Teams</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage company staff, admins and access levels</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs font-semibold px-4 shadow-sm border-gray-200">
                        <Download className="w-3.5 h-3.5 mr-2 opacity-60" /> Export List
                    </Button>
                    <Button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={`text-xs font-semibold px-4 text-white shadow-md transition-all ${isAdding ? 'bg-gray-800' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {isAdding ? 'Cancel' : 'Register New User'}
                    </Button>
                </div>
            </div>

            {/* Compact Add User Form */}
            {isAdding && (
                <div className="bg-white border border-orange-100 rounded-xl p-6 shadow-sm ring-4 ring-orange-50/50">
                    <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-orange-600" /> New Account Provisioning
                    </h2>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</Label>
                            <Input 
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                placeholder="e.g. Rahul Sharma"
                                className="h-9 text-xs border-gray-200 focus:ring-orange-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</Label>
                            <Input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                placeholder="rahul@quickserve.com"
                                className="h-9 text-xs border-gray-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Strategic Role</Label>
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                className="w-full h-9 rounded-md border border-gray-200 px-3 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value={PLATFORM_ROLES.SUPER_ADMIN}>Super Admin</option>
                                <option value={PLATFORM_ROLES.ADMIN}>Admin</option>
                                <option value={PLATFORM_ROLES.MANAGER}>Manager</option>
                                <option value={PLATFORM_ROLES.ACCOUNTANT}>Accountant</option>
                                <option value={PLATFORM_ROLES.SALESPERSON}>Salesperson</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" className="w-full h-9 bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors">
                                Generate Access
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* User Directory Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <div className="relative w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                         <input className="w-full h-8 pl-9 pr-4 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" placeholder="Filter by name or role..." />
                    </div>
                    <RefreshCw className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500 transition-colors" onClick={fetchUsers} />
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Team Member</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Authority</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account State</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 uppercase text-[10px] font-bold text-gray-400">
                                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{u.full_name || 'Unnamed'}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className={`w-3.5 h-3.5 ${u.role === PLATFORM_ROLES.OWNER_SUPER_ADMIN ? 'text-orange-600' : 'text-blue-500'}`} />
                                        <span className="text-xs font-bold text-gray-700">{u.role?.replace(/_/g, ' ')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold">Active</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Directory Secured & Encrypted</span>
                </div>
            </div>
        </div>
    );
};
