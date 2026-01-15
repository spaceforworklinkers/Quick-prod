import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Coffee, Lock, User, KeyRound, AlertCircle, ArrowRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useOutlet } from '@/context/OutletContext';

const LoginScreen = ({ onLogin }) => {
  const { outletId } = useOutlet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Customization State
  const [outletName, setOutletName] = useState('QuickServe POS');
  const [outletLogo, setOutletLogo] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [kitchenPass, setKitchenPass] = useState('');

  useEffect(() => {
    const fetchOutletDetails = async () => {
      if (!outletId) return;

      try {
          // 1. Fetch Outlet Public Info
          const { data: outletData } = await supabase
            .from('restaurants')
            .select('name, logo_url')
            .eq('id', outletId)
            .maybeSingle();

          if (outletData) {
              setOutletName(outletData.name);
              setOutletLogo(outletData.logo_url);
          }

         // 2. Fetch Branding / Settings
         const { data: settings } = await supabase
            .from('store_settings')
            .select('login_background_url')
            .eq('restaurant_id', outletId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
         
         if (settings?.login_background_url) {
             setBgImage(settings.login_background_url);
         } else {
            // Default premium background
             setBgImage("https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80");
         }
      } catch (e) {
        console.error("Failed to load outlet config", e);
        setBgImage("https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80");
      } finally { 
          setLoadingConfig(false); 
      }
    };
    fetchOutletDetails();
  }, [outletId]);

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const result = await onLogin('owner', { username, password });
        if (!result.success) {
            setError(result.error);
            setIsLoading(false);
        }
    } catch (e) {
        setError("Login failed");
        setIsLoading(false);
    }
  };

  const handleKitchenLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      
      try {
          const result = await onLogin('kitchen', { password: kitchenPass });
          if (!result.success) {
              setError(result.error);
              setIsLoading(false);
          }
      } catch (err) {
          setError('Connection error');
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-slate-900"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-8 pb-6 text-center border-b border-gray-100/50">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100 transform rotate-3 hover:rotate-0 transition-all duration-300">
             {outletLogo ? (
                 <img src={outletLogo} alt="Logo" className="w-14 h-14 object-contain" />
             ) : (
                <ChefHat className="h-10 w-10 text-orange-600" />
             )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {loadingConfig ? 'Loading...' : `Welcome to ${outletName || 'QuickServe POS'}`}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Please sign in to your terminal</p>
        </div>

        <div className="p-8 pt-6">
            <Tabs defaultValue="owner" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/80 p-1">
                    <TabsTrigger value="owner" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Manager / Staff</TabsTrigger>
                    <TabsTrigger value="kitchen" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Kitchen Display</TabsTrigger>
                </TabsList>
                
                <TabsContent value="owner" className="mt-0">
                  <form onSubmit={handleOwnerLogin} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="username">Email or Username</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input 
                          id="username"
                          type="text" 
                          placeholder="Enter your ID"
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input 
                          id="password"
                          type="password" 
                          placeholder="••••••••"
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-white font-semibold shadow-xl shadow-slate-900/10 transition-all hover:translate-y-[-1px]"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Authenticating...' : 'Sign In to POS'}
                      {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="kitchen" className="mt-0">
                    <form onSubmit={handleKitchenLogin} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <Label>Kitchen Access Code</Label>
                            <div className="relative group">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input 
                                    type="password"
                                    placeholder="Enter access code"
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all font-mono tracking-widest"
                                    value={kitchenPass}
                                    onChange={(e) => setKitchenPass(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500">Contact the manager for the kitchen code.</p>
                        </div>
                        
                         {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100"
                            >
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}
                        
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-white font-semibold shadow-xl shadow-blue-600/20 transition-all hover:translate-y-[-1px]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Submit Code'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
        
        <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100 flex items-center justify-center gap-1.5">
          <Store className="h-3 w-3" />
          Powered by Spacelinkers
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
