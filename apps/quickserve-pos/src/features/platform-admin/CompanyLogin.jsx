
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Loader2, ArrowRight, AlertCircle, Eye, EyeOff, Lock, Mail, 
    Store, BarChart3, ShieldCheck, Zap, Smartphone 
} from 'lucide-react';
import { ALL_PLATFORM_ROLES } from '@/config/permissions';

export default function CompanyLogin() {
    const { login, role } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // List of roles allowed in Platform/Company Portal
    const ALLOWED_ROLES = ALL_PLATFORM_ROLES; 
    
    const features = [
        {
            icon: Store,
            title: "Multi-Outlet Management",
            desc: "Control menus & staff across locations."
        },
        {
            icon: BarChart3,
            title: "Real-Time Analytics",
            desc: "Live sales data & inventory tracking."
        },
        {
            icon: ShieldCheck,
            title: "Enterprise Grade Security",
            desc: "Role-based access & data safety."
        },
        {
            icon: Zap,
            title: "Lightning Fast POS",
            desc: "Handle high-volume billing instantly."
        },
        {
            icon: Smartphone,
            title: "Mobile Command Center",
            desc: "Monitor operations from anywhere."
        }
    ];

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
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-white overflow-hidden font-sans">
             {/* Animation Keyframes for the Marquee */}
             <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
            
            {/* =========================================================
                LEFT PANEL - BRANDING
            ========================================================= */}
            <div className="w-full md:w-1/2 lg:w-[55%] bg-gradient-to-br from-orange-600 to-orange-800 relative flex flex-col justify-between overflow-hidden">
                {/* Decorative Background Patterns */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
                    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-white rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-900 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 p-8 md:p-12 lg:p-16 flex-shrink-0">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-12 md:mb-0 select-none">
                        <img 
                            src="/images/logo/QuickServe-logo-white.png" 
                            alt="QuickServe POS" 
                            className="h-9 w-auto object-contain"
                        />
                        <span className="font-['Outfit'] font-bold text-2xl tracking-tight text-white leading-none translate-y-[2px]">QuickServe POS</span>
                    </div>

                    {/* Headline */}
                    <div className="hidden md:block mt-20 max-w-xl">
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-sm mb-6">
                            Empowering Your Culinary Vision.
                        </h1>
                        <p className="text-orange-100 text-lg leading-relaxed opacity-90">
                           Welcome to the heart of your operations. From single outlets to global chains, QuickServe gives you the clarity and control to scale effortlessly.
                        </p>
                    </div>
                </div>

                {/* ===================================================
                    TRAIN TYPE CAROUSEL (Marquee)
                =================================================== */}
                <div className="relative z-10 hidden md:block w-full pb-12 overflow-hidden">
                     {/* Gradient Masks for smooth fade out at edges */}
                     <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-orange-700 to-transparent z-20 pointer-events-none" />
                     <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-orange-800 to-transparent z-20 pointer-events-none" />
                     
                     {/* Moving Track */}
                     <div className="animate-marquee pl-8">
                        {/* Duplicate the specific list twice for seamless loop */}
                        {[...features, ...features].map((feature, idx) => (
                            <div 
                                key={idx} 
                                className="w-[320px] bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 mr-6 flex-shrink-0 shadow-lg hover:bg-white/20 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-orange-500/20 p-2.5 rounded-lg flex-shrink-0">
                                        <feature.icon className="w-6 h-6 text-orange-100" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-1">{feature.title}</h3>
                                        <p className="text-orange-100/80 text-sm leading-snug">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                     <p className="text-orange-200/60 text-xs mt-8 px-12">© 2026 QuickServe POS. All rights reserved.</p>
                </div>
            </div>

            {/* =========================================================
                RIGHT PANEL - LOGIN FORM
            ========================================================= */}
            <div className="w-full md:w-1/2 lg:w-[45%] flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-white relative">
                
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden w-full mb-8 flex flex-col items-center text-center">
                     {/* Logo copy for mobile context if needed, but the main logo is already in the top block if we kept the top block always visible. 
                         However, in this layout, the top block IS the left panel. On mobile, the left panel is stacked ON TOP. 
                         So the logo is already visible. We just need to ensure the form area looks clean. 
                     */}
                </div>

                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter text-gray-900">Welcome back</h2>
                        <p className="text-gray-500">Sign in to the QuickServe Admin Platform.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                                <Input 
                                    id="email"
                                    placeholder="name@company.com" 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                             {/* Flex Label */}
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 ml-1" htmlFor="password">Password</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                                <Input 
                                    id="password"
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500/20 transition-all rounded-lg"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold h-11 shadow-lg shadow-orange-600/20 transition-all rounded-lg text-base"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (
                                <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
                            )}
                        </Button>
                    </form>

                    {/* Disclaimer Footnote */}
                    <p className="text-center text-xs text-gray-400 mt-6 max-w-xs mx-auto">
                        For internal QuickServe team members only. <br/>
                        Unauthorized access is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}
