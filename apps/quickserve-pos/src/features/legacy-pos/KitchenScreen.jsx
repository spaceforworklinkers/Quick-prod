
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useOutlet } from '@/context/OutletContext';

// Notification Sound URL
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const KitchenScreen = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  useEffect(() => {
    // 1. Initial Fetch
    if(outletId) {
        fetchKitchenOrders(true);

        // 2. Setup Realtime Subscription
        const channel = supabase
          .channel(`kitchen-orders-${outletId}`)
          .on(
            'postgres_changes',
            { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `restaurant_id=eq.${outletId}`
            },
            (payload) => {
              console.log('🔔 Kitchen Event Received:', payload);
              
              let shouldPlaySound = false;
    
              // Case 1: Brand new order inserted directly as NEW
              if (payload.eventType === 'INSERT' && payload.new.status === 'NEW') {
                  shouldPlaySound = true;
              }
    
              // Case 2: Order status UPDATED to 'NEW' (e.g. from PENDING -> ACCEPTED -> NEW)
              // This covers the requirement for "Kitchen Sound on PENDING -> ACCEPTED"
              if (payload.eventType === 'UPDATE' && payload.new.status === 'NEW' && payload.old.status !== 'NEW') {
                  shouldPlaySound = true;
              }
    
              if (shouldPlaySound) {
                 playAlertSound();
                 toast({
                     title: "🔔 New Kitchen Order!",
                     description: `Order #${payload.new.order_number} is ready for prep!`,
                     className: "bg-orange-600 text-white border-none"
                 });
              }
              
              // Refresh data
              fetchKitchenOrders(false);
            }
          )
          .subscribe();
    
        // 3. Fallback Polling
        const intervalId = setInterval(() => {
            fetchKitchenOrders(false);
        }, 15000);
    
        return () => {
          supabase.removeChannel(channel);
          clearInterval(intervalId);
        };
    }
  }, [outletId]);

  const playAlertSound = () => {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
  };

  const fetchKitchenOrders = async (showLoading = false) => {
    if(!outletId) return;
    try {
      if (showLoading) setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            notes,
            menu_items (name)
          )
        `)
        .eq('restaurant_id', outletId)
        .in('status', ['NEW', 'IN KITCHEN'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    if(!outletId) return;
    try {
      // Optimistic Update
      if (newStatus === 'READY') {
          setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('restaurant_id', outletId);

      if (error) throw error;

      if (newStatus === 'READY') {
          toast({
            title: 'Order Ready',
            description: `Order marked as Ready!`,
            className: "bg-green-600 text-white border-none"
          });
      }
    } catch (error) {
      console.error("Update error:", error);
      fetchKitchenOrders(false); 
    }
  };

  const newOrders = orders.filter(o => o.status === 'NEW');
  const inKitchenOrders = orders.filter(o => o.status === 'IN KITCHEN');

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-600 p-2 rounded-lg">
                    <Coffee className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Kitchen Display</h2>
           </div>
           <p className="text-gray-400 text-sm">Live Order Feed • Auto-sync active</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchKitchenOrders(true)} className="text-black bg-white hover:bg-gray-200 border-none">
                Force Refresh
            </Button>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NEW ORDERS */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h3 className="font-bold text-xl text-white">New Orders</h3>
                </div>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-red-900/50">
                    {newOrders.length}
                </span>
              </div>
              
              <div className="space-y-4">
                {newOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                        <p>No new orders</p>
                    </div>
                ) : (
                    <AnimatePresence>
                    {newOrders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-700 rounded-lg p-5 border-l-4 border-red-500 shadow-lg"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-2xl font-bold tracking-tight">{order.order_number}</h4>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1 block">{order.order_type}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-orange-400 font-bold text-lg">{order.table_number ? `Table ${order.table_number}` : ''}</div>
                                    <div className="flex items-center text-sm text-gray-400 gap-1 mt-1 justify-end">
                                        <Clock className="w-4 h-4" />
                                        {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5 bg-gray-800/50 p-4 rounded-md">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start text-base border-b border-gray-700/50 last:border-0 pb-2 last:pb-0">
                                        <div className="flex-1">
                                            <span className="font-bold text-orange-400 mr-3 text-lg">{item.quantity}x</span>
                                            <span className="text-gray-100 font-medium">{item.menu_items?.name || 'Item'}</span>
                                            {item.notes && (
                                                <div className="text-red-300 text-sm mt-1 bg-red-900/20 p-1.5 rounded border border-red-900/30">
                                                    ⚠️ {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                className="w-full bg-orange-600 hover:bg-orange-700 font-bold py-6 text-lg shadow-md"
                                onClick={() => updateStatus(order.id, 'IN KITCHEN')}
                            >
                                Start Preparing
                            </Button>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                )}
              </div>
            </div>

            {/* IN KITCHEN */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <h3 className="font-bold text-xl text-white">Preparing</h3>
                </div>
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg shadow-orange-900/50">
                    {inKitchenOrders.length}
                </span>
              </div>

              <div className="space-y-4">
                 {inKitchenOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                        <p>Kitchen is clear</p>
                    </div>
                ) : (
                    <AnimatePresence>
                    {inKitchenOrders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gray-700 rounded-lg p-5 border-l-4 border-orange-500 shadow-lg"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-2xl font-bold tracking-tight">{order.order_number}</h4>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1 block">{order.order_type}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-orange-400 font-bold text-lg">{order.table_number ? `Table ${order.table_number}` : ''}</div>
                                    <div className="flex items-center text-sm text-gray-400 gap-1 mt-1 justify-end">
                                        <Clock className="w-4 h-4" />
                                        {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-5 bg-gray-800/50 p-4 rounded-md">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start text-base border-b border-gray-700/50 last:border-0 pb-2 last:pb-0">
                                        <div className="flex-1">
                                            <span className="font-bold text-orange-400 mr-3 text-lg">{item.quantity}x</span>
                                            <span className="text-gray-100 font-medium">{item.menu_items?.name || 'Item'}</span>
                                            {item.notes && (
                                                <div className="text-red-300 text-sm mt-1 bg-red-900/20 p-1.5 rounded border border-red-900/30">
                                                    ⚠️ {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 font-bold py-6 text-lg shadow-md"
                                onClick={() => updateStatus(order.id, 'READY')}
                            >
                                <CheckCircle className="h-5 w-5 mr-2"/>
                                Mark Ready
                            </Button>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                )}
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default KitchenScreen;
