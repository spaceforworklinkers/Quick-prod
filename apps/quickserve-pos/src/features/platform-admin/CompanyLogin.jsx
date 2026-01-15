import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, LayoutDashboard, Mail, Lock, Globe } from 'lucide-react';
import { ROLES } from '@/config/permissions';

export default function CompanyLogin() {
    const { login, role } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // List of roles allowed in Platform/Company Portal
    const ALLOWED_ROLES = ['OWNER_SUPER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SALESPERSON', 'ACCOUNTANT']; 

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { success, error: loginError } = await login(email, password);
        
        if (success) {
            // Success logic handled by useEffect on 'role' change
        } else {
            setError(loginError || 'Invalid credentials');
            setLoading(false);
        }
    };

    // Redirect Effect
    React.useEffect(() => {
        const checkAccess = () => {
             // If logged in
             if (role && role !== 'guest') {
                 if (ALLOWED_ROLES.includes(role)) {
                     navigate('/admin');
                 } else {
                     setError("Access Denied: Please log in via your Outlet URL.");
                     setLoading(false);
                 }
             }
        };
        checkAccess();
    }, [role, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] px-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                 <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
                 <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/5 text-slate-100 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
                        <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-white mb-2">QuickServe Platform</CardTitle>
                        <CardDescription className="text-slate-400">Platform Administration</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                             <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input 
                                    placeholder="Corporate Email" 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-9 h-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                />
                             </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input 
                                    type="password" 
                                    placeholder="Password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-9 h-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
                                {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-12 shadow-lg shadow-blue-900/20 transition-all"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Log In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex-col gap-4 text-center text-xs text-slate-500 justify-center pb-8 border-t border-white/5 pt-6">
                    <p>Restricted Access • Authorized Personnel Only</p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-slate-400">
                        <Globe className="w-3 h-3" /> 
                        <span>Looking for your restaurant? Use your provided Outlet URL.</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
