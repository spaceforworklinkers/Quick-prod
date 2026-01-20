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
  Download,
  Ban,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PLATFORM_ROLES, hasPermission, PLATFORM_PERMISSIONS } from '@/config/permissions';
import { useAuth } from '@/context/AuthContext';

/**
 * USER & ROLE MANAGEMENT (DEFINITIVE)
 * For: OWNER_SUPER_ADMIN, SUPER_ADMIN
 */
export const UserManagement = () => {
    const { role } = useAuth();
    const { toast } = useToast();

    // 4th Layer Security: Component-level block
    if (!hasPermission(role, PLATFORM_PERMISSIONS.MANAGE_USERS)) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <h2 className="text-lg font-bold text-red-800">Access Denied</h2>
                <p className="text-sm text-red-600">You do not have permission to manage platform users.</p>
            </div>
        );
    }

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
        // We only want Internal Platform Users, NOT Outlet Owners or Restaurant Staff
        const allowedRoles = [
            'OWNER_SUPER_ADMIN', 
            'SUPER_ADMIN', 
            'ADMIN', 
            'MANAGER', 
            'SALESPERSON', 
            'ACCOUNTANT'
        ];

        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .in('role', allowedRoles)
            .order('created_at', { ascending: false });
            
        if (data) setUsers(data);
        setLoading(false);
    };

    const [createdCredentials, setCreatedCredentials] = useState(null);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Call the secure backend function
            const { data, error } = await supabase.rpc('create_platform_user', {
                param_email: formData.email,
                param_password: formData.password,
                param_full_name: formData.fullName,
                param_role: formData.role
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || data.error || 'Operation failed');

            toast({ 
                title: "User Created Successfully", 
                description: `Account for ${formData.fullName} is ready.`,
                className: "bg-emerald-50 border-emerald-200 text-emerald-800"
            });
            
            // Show Success State with Password
            setCreatedCredentials({
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            // Refresh list but keep the success card open
            setTimeout(() => {
                fetchUsers();
            }, 500); // 500ms delay to ensure DB propagation

            // Don't close isAdding, allow user to close success card

        } catch (error) {
            console.error("Creation failed:", error);
            toast({ 
                title: "Creation Failed", 
                description: error.message || "Could not create user. Ensure you have Super Admin privileges.", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    // ACTIONS
    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure? This action is irreversible.')) return;
        
        // Optimistic Update: Remove from UI immediately
        const previousUsers = [...users];
        setUsers(users.filter(u => u.id !== userId));

        try {
            const { data, error } = await supabase.rpc('delete_platform_user', { target_user_id: userId });
            
            if (error) {
                setUsers(previousUsers); // Revert optimistic update
                throw error;
            }
            if (data && !data.success) {
                setUsers(previousUsers); // Revert optimistic update
                throw new Error(data.message || data.error || 'Operation failed');
            }

            toast({ title: 'User Deleted', className: "bg-red-50 text-red-800 border-red-200" });
            fetchUsers();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.is_active;
        try {
            const { data, error } = await supabase.rpc('toggle_user_status', { 
                target_user_id: user.id, 
                new_status: newStatus 
            });
            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || data.error || 'Operation failed');
            toast({ title: newStatus ? 'User Unbanned' : 'User Banned', className: "bg-blue-50 text-blue-800 border-blue-200" });
            fetchUsers();
        } catch (err) {
            toast({ variant: 'destructive', title: 'Update Failed', description: err.message });
        }
    };
    // State for Reset Password Modal
    const [resetDialog, setResetDialog] = useState({ open: false, userId: null, userName: '', newPassword: '' });

    const openResetDialog = (user) => {
        setResetDialog({
            open: true,
            userId: user.id,
            userName: user.full_name || user.email,
            newPassword: Math.random().toString(36).slice(-10) // Suggest a strong random password
        });
    };

    const executeResetPassword = async () => {
        if (!resetDialog.newPassword) return;
        
        try {
            const { data, error } = await supabase.rpc('admin_reset_password', { 
                target_user_id: resetDialog.userId, 
                new_password: resetDialog.newPassword 
            });
            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || data.error || 'Operation failed');
            
            toast({ 
                title: 'Password Updated', 
                description: `Password for ${resetDialog.userName} has been reset.`, 
                className: "bg-emerald-50 text-emerald-800 border-emerald-200" 
            });
            
            // Close Dialog
            setResetDialog({ open: false, userId: null, userName: '', newPassword: '' });
            
        } catch (err) {
            toast({ variant: 'destructive', title: 'Reset Failed', description: err.message });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {/* RESET PASSWORD MODAL */}
            {resetDialog.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4 m-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <KeyRound className="w-5 h-5" />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                                 <p className="text-xs text-gray-500">Update credentials for {resetDialog.userName}</p>
                             </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase">New Password</Label>
                            <div className="relative">
                                <Input 
                                    value={resetDialog.newPassword}
                                    onChange={e => setResetDialog({...resetDialog, newPassword: e.target.value})}
                                    className="font-mono text-sm pr-9"
                                />
                                <button 
                                    className="absolute right-2 top-2 text-gray-400 hover:text-orange-600"
                                    onClick={() => {
                                        navigator.clipboard.writeText(resetDialog.newPassword);
                                        toast({ title: "Copied to clipboard" });
                                    }}
                                    title="Copy Password"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400">Standard Requirement: Min 8 chars, 1 uppercase, 1 symbol.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                             <Button 
                                variant="outline" 
                                onClick={() => setResetDialog({ open: false, userId: null, userName: '', newPassword: '' })}
                             >
                                Cancel
                             </Button>
                             <Button 
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={executeResetPassword}
                             >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Save New Password
                             </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header ... */}
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

            {/* Form Logic (Keep Existing) */}
            {isAdding && (
                <div className="bg-white border border-orange-100 rounded-xl p-6 shadow-sm ring-4 ring-orange-50/50">
                    <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-orange-600" /> New Account Provisioning
                    </h2>
                    
                    {createdCredentials ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle2 className="w-6 h-6" />
                             </div>
                             <h3 className="text-lg font-bold text-gray-900">User Account Created!</h3>
                             <p className="text-sm text-gray-600 max-w-sm mx-auto">
                                Please copy these credentials securely. You will not be able to see the password again.
                             </p>
                             
                             <div className="bg-white border border-emerald-200 rounded-lg p-4 text-left max-w-sm mx-auto shadow-sm">
                                 <div className="mb-3">
                                     <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Email / Login ID</span>
                                     <div className="font-mono text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
                                        {createdCredentials.email}
                                     </div>
                                 </div>
                                 <div>
                                     <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Password</span>
                                     <div className="font-mono text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100 flex justify-between">
                                        {createdCredentials.password}
                                     </div>
                                 </div>
                             </div>

                             <div className="flex justify-center gap-3 pt-2">
                                 <Button 
                                     variant="default"
                                     className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                     onClick={() => {
                                        setIsAdding(false);
                                        setCreatedCredentials(null);
                                        setFormData({
                                            email: '',
                                            fullName: '',
                                            role: PLATFORM_ROLES.ADMIN,
                                            password: Math.random().toString(36).slice(-10)
                                        });
                                     }}
                                 >
                                    Done & Close
                                 </Button>
                             </div>
                        </div>
                    ) : (
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
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</Label>
                                <Input 
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="Password"
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
                                        <option value={PLATFORM_ROLES.ADMIN}>Admin</option>
                                        <option value={PLATFORM_ROLES.MANAGER}>Manager</option>
                                        <option value={PLATFORM_ROLES.ACCOUNTANT}>Accountant</option>
                                        <option value={PLATFORM_ROLES.SALESPERSON}>Salesperson</option>
                                    </select>
                            </div>
                            <div className="flex items-end col-span-1 md:col-span-4 justify-end mt-2">
                                <Button type="submit" className="bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors px-6">
                                    Generate Access
                                </Button>
                            </div>
                        </form>
                    )}
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
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border uppercase text-[10px] font-bold ${!u.is_active ? 'bg-red-50 border-red-100 text-red-400' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            {u.full_name?.charAt(0) || u.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${!u.is_active ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{u.full_name || 'Unnamed'}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className={`w-3.5 h-3.5 ${u.role === PLATFORM_ROLES.SUPER_ADMIN ? 'text-orange-600' : 'text-blue-500'}`} />
                                        <span className="text-xs font-bold text-gray-700">{u.role?.replace(/_/g, ' ')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-1.5 ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {u.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        <span className="text-[11px] font-bold">{u.is_active ? 'Active' : 'Banned'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600"
                                            onClick={() => openResetDialog(u)}
                                            title="Reset Password"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                            onClick={() => handleToggleStatus(u)}
                                            title={u.is_active ? "Ban User" : "Unban User"}
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                            onClick={() => handleDeleteUser(u.id)}
                                            title="Delete User"
                                        >
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
