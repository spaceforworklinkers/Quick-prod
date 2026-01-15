
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/features/legacy-pos/Header';
import Dashboard from '@/features/legacy-pos/Dashboard';
import CreateOrder from '@/features/legacy-pos/CreateOrder';
import ActiveOrders from '@/features/legacy-pos/ActiveOrders';
import Billing from '@/features/legacy-pos/Billing';
import MenuManagement from '@/features/legacy-pos/MenuManagement';
import StoreSettings from '@/features/legacy-pos/StoreSettings';
import KitchenScreen from '@/features/legacy-pos/KitchenScreen';
import InventoryManagement from '@/features/legacy-pos/InventoryManagement';
import SalesReports from '@/features/legacy-pos/SalesReports';
import CustomerManagement from '@/features/legacy-pos/CustomerManagement';
import LoginScreen from '@/features/legacy-pos/LoginScreen';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useOutlet } from '@/context/OutletContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/hooks/useOutletData';
import { OrderService } from '@/services/OrderService';
import { ViewGuard } from '@/components/auth/PermissionGuard';
import { PERMISSIONS } from '@/config/permissions';

export default function LegacyApp() {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  const { user, role, loading: authLoading, login, kitchenLogin, logout } = useAuth();
  const { settings } = useStoreSettings();

  const [activeView, setActiveView] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draftOrderToEdit, setDraftOrderToEdit] = useState(null);
  
  // Order Mode States
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [showExitPinDialog, setShowExitPinDialog] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Sound Ref
  const audioRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Background Sync Worker
  useEffect(() => {
    const runSync = () => {
        if (navigator.onLine) {
            OrderService.processQueue().catch(e => console.error("Sync Error", e));
        }
    };
    runSync();
    window.addEventListener('online', runSync);
    const interval = setInterval(runSync, 30000); // Sync every 30s
    return () => {
        window.removeEventListener('online', runSync);
        clearInterval(interval);
    };
  }, []);

  // Update State based on Settings (Local First)
  useEffect(() => {
      if (!user) return;
      if (role === 'kitchen') {
          setActiveView('kitchen');
          return;
      }
      
      if (settings?.order_mode_settings?.enabled) {
          setIsOrderMode(true);
          setActiveView('create-order');
          setExitPin(settings.order_mode_settings.exit_pin || '1234');
      } else if (activeView === 'kitchen') {
          // Do nothing if already kitchen
      } else {
           // Default to dashboard if not locked
           // But check if we were already navigating? 
           // Initial load only?
           // If 'activeView' state is 'dashboard' (default), nothing to do.
      }
  }, [user, role, settings]);

  // --- GLOBAL QR ORDER LISTENER ---
  useEffect(() => {
      if (!user) return;
      if (role === 'kitchen') return;
      if (!outletId) return;

      const channel = supabase
          .channel(`global-orders-listener-${outletId}`)
          .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${outletId}` },
              (payload) => {
                  if (payload.new && payload.new.order_source === 'qr') {
                      handleNewQrOrder(payload.new);
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [user, role, outletId]);

  const handleNewQrOrder = (order) => {
      if (role === 'kitchen') return;
      
      if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Audio play failed (interaction needed first):", e));
      }

      toast({
          title: "🔔 New QR Order Received!",
          description: `Table: ${order.table_number || 'N/A'} • Amount: ₹${order.total}`,
          duration: 10000,
          action: (
              <ToastAction altText="Review Order" onClick={() => setActiveView('dashboard')}>
                  Review Order
              </ToastAction>
          ),
      });
  };

  const handleExitOrderModeRequest = () => {
      setShowExitPinDialog(true);
      setEnteredPin('');
      setPinError(false);
  };

  const confirmExitOrderMode = async () => {
      if (enteredPin === exitPin) {
          try {
             // Disable in DB
             const { data: currentSettings } = await supabase.from('store_settings')
                .select('*')
                .eq('restaurant_id', outletId)
                .limit(1)
                .single();
                
             if (currentSettings) {
                 const updatedOrderMode = { ...currentSettings.order_mode_settings, enabled: false };
                 await supabase.from('store_settings').update({
                     order_mode_settings: updatedOrderMode
                 }).eq('id', currentSettings.id);
             }
             
             setIsOrderMode(false);
             setShowExitPinDialog(false);
             setActiveView('dashboard');
             toast({ title: "Order Mode Disabled", description: "You are now in full admin mode." });
          } catch (e) {
              toast({ variant: 'destructive', title: "Error", description: "Could not disable order mode." });
          }
      } else {
          setPinError(true);
          setTimeout(() => setPinError(false), 2000);
      }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setActiveView('billing');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!user) return;
    if (role === 'kitchen') return;
    if (isOrderMode) return; 

    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd': setActiveView('dashboard'); break;
          case 'c': setActiveView('create-order'); break;
          case 'a': setActiveView('active-orders'); break;
          case 'm': setActiveView('menu'); break;
          case 'i': setActiveView('inventory'); break;
          case 'r': setActiveView('reports'); break;
          case 's': setActiveView('settings'); break;
          case 'u': setActiveView('customers'); break;
          default: break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [user, role, isOrderMode]);
  
  if (authLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    // We can clear this or keep it, but it's useful for the ContextGuard redirect
    if (outletId) localStorage.setItem('last_outlet_id', outletId);
    
    return (
      <>
        <Helmet>
            <link rel="icon" href="https://rxuezlqrzfkxujkkilnq.supabase.co/storage/v1/object/public/assets/favicon.ico" />
            <title>QuickServe POS - Spacelinkers</title>
        </Helmet>
        <LoginScreen onLogin={async (type, creds) => {
             // LoginScreen now calls context methods, but for structure consistency we might pass handlers
             // Actually, refactor LoginScreen to use useAuth internally.
             // But LoginScreen expects onLogin callback in previous code.
             // Let's pass a wrapper.
             if(type === 'kitchen') {
                 return kitchenLogin(creds.password);
             } else {
                 return login(creds.username, creds.password);
             }
        }} />
        <Toaster />
      </>
    );
  }

  if (role === 'kitchen' || activeView === 'kitchen') {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Helmet>
                <title>Kitchen Display - QuickServe POS</title>
            </Helmet>
            <div className="p-4 bg-gray-800 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold text-orange-500">QuickServe Kitchen</h1>
                <button 
                    onClick={() => { logout(); setActiveView('dashboard'); }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200"
                >
                    Logout
                </button>
            </div>
            <KitchenScreen />
            <Toaster />
        </div>
      );
  }

  return (
    <>
      <Helmet>
        <title>QuickServe POS - Café Billing & Kitchen Management</title>
        <meta name="description" content="Complete point of sale system for café billing and kitchen order management" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <Header 
          activeView={activeView} 
          setActiveView={setActiveView}
          userRole={role} // Pass context role
          setUserRole={() => {}} // Read-only now
          onLogout={logout}
          isOrderMode={isOrderMode}
          onExitOrderMode={handleExitOrderModeRequest}
        />
        
        <main className="max-w-[1920px] mx-auto pb-20 md:pb-8">
            <>
              {(!isOrderMode && activeView === 'dashboard') && 
                <Dashboard 
                  setActiveView={setActiveView} 
                  onViewOrder={handleViewOrder} 
                  setDraftOrderToEdit={setDraftOrderToEdit}
                />
              }
              {activeView === 'create-order' && 
                <CreateOrder 
                  setActiveView={setActiveView} 
                  draftOrderToEdit={draftOrderToEdit}
                  setDraftOrderToEdit={setDraftOrderToEdit}
                />
              }
              {activeView === 'active-orders' && <ActiveOrders onViewOrder={handleViewOrder} />}
              {activeView === 'billing' && <Billing order={selectedOrder} setActiveView={setActiveView} />}
              
              {/* Restricted Views with Strict Security */}
              {!isOrderMode && (
                  <>
                    {activeView === 'menu' && (
                        <ViewGuard permission={PERMISSIONS.VIEW_MENU}>
                            <MenuManagement />
                        </ViewGuard>
                    )}
                    {activeView === 'settings' && (
                        <ViewGuard permission={PERMISSIONS.VIEW_SETTINGS}>
                            <StoreSettings />
                        </ViewGuard>
                    )}
                    {activeView === 'inventory' && (
                        <ViewGuard permission={PERMISSIONS.VIEW_INVENTORY}>
                            <InventoryManagement />
                        </ViewGuard>
                    )}
                    {activeView === 'reports' && (
                        <ViewGuard permission={PERMISSIONS.VIEW_REPORTS}>
                            <SalesReports onViewOrder={handleViewOrder} />
                        </ViewGuard>
                    )}
                    {activeView === 'customers' && (
                        <ViewGuard permission={PERMISSIONS.VIEW_CUSTOMERS}>
                            <CustomerManagement />
                        </ViewGuard>
                    )}
                  </>
              )}
            </>
        </main>
        
        <Dialog open={showExitPinDialog} onOpenChange={setShowExitPinDialog}>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle>Exit Order Mode</DialogTitle>
                    <DialogDescription>Enter PIN to return to Admin Dashboard</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        type="password" 
                        value={enteredPin} 
                        onChange={(e) => setEnteredPin(e.target.value)}
                        placeholder="Enter PIN"
                        className={`text-center text-lg tracking-widest ${pinError ? 'border-red-500 animate-shake' : ''}`}
                        autoFocus
                    />
                    {pinError && <p className="text-xs text-red-500 text-center mt-2">Incorrect PIN</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowExitPinDialog(false)}>Cancel</Button>
                    <Button onClick={confirmExitOrderMode} className="bg-orange-600 hover:bg-orange-700">Unlock</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    </>
  );
}
