
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Eye, Trash2, XCircle, Share2, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOutlet } from '@/context/OutletContext';

const ActiveOrders = ({ onViewOrder }) => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [cancelOrderDialog, setCancelOrderDialog] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const columns = [
    { id: 'NEW', title: 'New Orders', color: 'bg-blue-500', lightColor: 'bg-blue-50' },
    { id: 'IN KITCHEN', title: 'In Kitchen', color: 'bg-orange-500', lightColor: 'bg-orange-50' },
    { id: 'READY', title: 'Ready', color: 'bg-green-500', lightColor: 'bg-green-50' },
    { id: 'BILLED', title: 'Billed', color: 'bg-purple-500', lightColor: 'bg-purple-50' },
  ];

  useEffect(() => {
    // 1. Initial Fetch
    if(outletId) {
        fetchOrders(true);
        
        // 2. Realtime Subscription
        const channel = supabase
          .channel(`owner-orders-${outletId}`)
          .on(
            'postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'orders',
                filter: `restaurant_id=eq.${outletId}`
            },
            (payload) => {
              console.log('🔔 Owner Event Received:', payload);
              fetchOrders(false);
            }
          )
          .subscribe();
    
        // 3. Fallback Polling (Every 15 seconds)
        const intervalId = setInterval(() => {
            fetchOrders(false);
        }, 15000);
    
        return () => {
          supabase.removeChannel(channel);
          clearInterval(intervalId);
        };
    }
  }, [outletId]);

  const fetchOrders = async (showLoading = false) => {
    if(!outletId) return;
    try {
      if (showLoading) setLoading(true);
      
      // Limit active orders fetch to last 7 days to prevent payload explosion
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            notes,
            menu_item_id,
            menu_items (name)
          )
        `)
        .eq('restaurant_id', outletId)
        .neq('status', 'ARCHIVED')
        .neq('status', 'CANCELLED')
        .neq('status', 'PENDING') // Exclude pending orders from Kanban
        .gte('created_at', sevenDaysAgo.toISOString()) // Optimization: Only fetch recent orders
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Helper to release table occupancy
  const releaseTableOccupancy = async (tableId, peopleCount) => {
      if (!tableId || !peopleCount || !outletId) return;
      
      try {
          const { data: table } = await supabase.from('restaurant_tables')
            .select('current_occupancy')
            .eq('id', tableId)
            //.eq('restaurant_id', outletId) // Assume ID is unique enough, but strict RLS handles it
            .single();
          
          if (table) {
              const newOccupancy = Math.max(0, (table.current_occupancy || 0) - peopleCount);
              const newStatus = newOccupancy === 0 ? 'Available' : 'Occupied';
              
              await supabase.from('restaurant_tables')
                .update({ 
                    current_occupancy: newOccupancy,
                    status: newStatus 
                })
                .eq('id', tableId)
                //.eq('restaurant_id', outletId);
          }
      } catch (err) {
          console.error("Failed to release table", err);
      }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if(!outletId) return;
    try {
      // Find current order to get table info
      const order = orders.find(o => o.id === orderId);
      
      // Optimistic Update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('restaurant_id', outletId);

      if (error) throw error;
      
      // AUTO-RELEASE TABLE LOGIC
      // If moving to BILLED, free up the occupancy
      if (newStatus === 'BILLED' && order && order.order_type === 'Dine-in' && order.table_id) {
          await releaseTableOccupancy(order.table_id, order.people_count || 0);
          toast({ title: 'Occupancy Updated', description: `Table ${order.table_number} occupancy adjusted.` });
      }

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      fetchOrders(false); // Revert
    }
  };

    const handleShareWhatsApp = (order) => {
        const baseUrl = window.location.origin;
        // Adjust for multi-tenant URL
        const invoiceUrl = `${baseUrl}/${outletId}/invoice/${order.id}`;

        let message = `*Receipt for Order #${order.order_number}*\n`;
        message += `Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
        message += `------------------------\n`;

        order.order_items.forEach(item => {
            message += `${item.quantity}x ${item.menu_items?.name || 'Item'}\n`;
        });

        message += `------------------------\n`;
        message += `*Total: ₹${parseFloat(order.total).toFixed(2)}*\n\n`;
        message += `View Invoice: ${invoiceUrl}\n`;
        message += `Thank you for visiting! 😊❤️`;

        // 🔥 CRITICAL: Normalize unicode before encoding (fixes emoji issues)
        message = message.normalize("NFC");

        const encodedMessage = encodeURIComponent(message);

        const mobile = order.customer_phone // Changed from customer_mobile to match field
            ? `91${order.customer_phone.replace(/\D/g, '').slice(-10)}`
            : '';

        // ✅ USE api.whatsapp.com instead of wa.me
        const whatsappUrl = mobile
            ? `https://api.whatsapp.com/send?phone=${mobile}&text=${encodedMessage}`
            : `https://api.whatsapp.com/send?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

  
  const initiateCancelOrder = (order) => {
      setSelectedOrderToCancel(order);
      setCancelReason('');
      setCancelOrderDialog(true);
  };
  
  const confirmCancelOrder = async () => {
      if (!cancelReason.trim()) {
          toast({ variant: 'destructive', title: 'Required', description: 'Please provide a cancellation reason.' });
          return;
      }
      if(!outletId) return;

      try {
          const orderId = selectedOrderToCancel.id;
          setOrders(prev => prev.filter(o => o.id !== orderId)); // Optimistic remove

          const { error } = await supabase
            .from('orders')
            .update({ status: 'CANCELLED', cancellation_reason: cancelReason, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .eq('restaurant_id', outletId);

          if (error) throw error;

          // Release Table on Cancellation
          if (selectedOrderToCancel.order_type === 'Dine-in' && selectedOrderToCancel.table_id) {
               await releaseTableOccupancy(selectedOrderToCancel.table_id, selectedOrderToCancel.people_count || 0);
          }
          
          toast({ title: 'Order Cancelled', description: 'Order marked as cancelled and table occupancy adjusted.' });
          setCancelOrderDialog(false);
      } catch (error) {
           toast({ variant: 'destructive', title: 'Error', description: error.message });
           fetchOrders(false);
      }
  };

  const handleDeleteOrder = async (order) => {
    if (order.status === 'BILLED') {
        if(!window.confirm('Billed orders cannot be deleted. Archive instead?')) return;
        updateOrderStatus(order.id, 'ARCHIVED');
        return;
    }
    if (!window.confirm('Are you sure you want to delete this order completely?')) return;
    if(!outletId) return;

    try {
        setOrders(prev => prev.filter(o => o.id !== order.id)); // Optimistic

        const { error } = await supabase.from('orders').delete().eq('id', order.id).eq('restaurant_id', outletId);
        if (error) throw error;
        toast({ title: 'Deleted', description: 'Order deleted successfully' });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Error', description: error.message });
         fetchOrders(false);
    }
  };

  const getOrdersByStatus = (status) => orders.filter(order => order.status === status);
  const getNextStatus = (currentStatus) => {
    const flow = { 'NEW': 'IN KITCHEN', 'IN KITCHEN': 'READY', 'READY': 'BILLED', 'BILLED': null };
    return flow[currentStatus];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
        <Button variant="outline" size="sm" onClick={() => fetchOrders(true)}>
             <RefreshCw className="h-4 w-4 mr-2" /> Sync
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.id);
            return (
              <div key={column.id} className={`${column.lightColor} rounded-xl p-3 min-h-[500px] border border-gray-200`}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 bg-inherit pb-2 border-b border-gray-200/50">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="ml-auto bg-white text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                  {columnOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm italic">Empty</div>
                  ) : (
                    columnOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        layoutId={order.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className="font-bold text-gray-900 text-lg leading-tight">{order.order_number}</h4>
                             <span className={`text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1 rounded ${order.order_type !== 'Dine-in' ? 'bg-blue-100 text-blue-700' : ''}`}>
                                {order.order_type}
                             </span>
                             {order.people_count > 0 && <span className="text-[10px] ml-1 text-gray-400">({order.people_count}p)</span>}
                          </div>
                          <div className="text-right">
                             <div className="font-bold text-gray-900">₹{parseFloat(order.total).toFixed(0)}</div>
                             {order.table_number && <div className="text-xs text-orange-600 font-medium">Table {order.table_number}</div>}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mb-3 border-t border-b border-gray-50 py-2 text-xs text-gray-600 space-y-1">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex justify-between items-start">
                                <span className="flex-1 mr-1">
                                    <span className="font-bold text-gray-900">{item.quantity}x</span> {item.menu_items?.name || 'Item'}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Time */}
                        <div className="flex items-center text-xs text-gray-400 mb-3 gap-1">
                             <Clock className="h-3 w-3" />
                             {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>

                        {/* Action Buttons Row (No Overlap) */}
                        <div className="flex gap-2 mb-2 border-t border-gray-100 pt-2">
                             <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs px-0 hover:bg-gray-100 hover:text-blue-600" onClick={() => handleShareWhatsApp(order)}>
                                 <Share2 className="h-3 w-3 mr-1"/> Share
                             </Button>
                             <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs px-0 hover:bg-red-50 hover:text-red-600" onClick={() => initiateCancelOrder(order)}>
                                 <XCircle className="h-3 w-3 mr-1"/> Cancel
                             </Button>
                             <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs px-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteOrder(order)}>
                                 <Trash2 className="h-3 w-3 mr-1"/> Del
                             </Button>
                        </div>

                        {/* Main Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewOrder(order)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {getNextStatus(order.status) && (
                            <Button size="sm" className={`flex-1 h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0`} onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}>
                              Move <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Cancellation Dialog */}
      <Dialog open={cancelOrderDialog} onOpenChange={setCancelOrderDialog}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Cancel Order</DialogTitle>
                  <DialogDescription>Mark order as cancelled.</DialogDescription>
              </DialogHeader>
              <div className="py-2">
                  <Label>Reason</Label>
                  <Input placeholder="e.g. Out of stock" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="mt-2" />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelOrderDialog(false)}>Back</Button>
                  <Button variant="destructive" onClick={confirmCancelOrder}>Confirm Cancel</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveOrders;