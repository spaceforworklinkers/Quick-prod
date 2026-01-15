
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, DollarSign, Clock, TrendingUp, Users, Calendar, BarChart3, AlertTriangle, XOctagon, Eye, Download, Share2, Trash2, Tag, Info, LayoutGrid, Bell, Archive, UserMinus, FileEdit, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BillReceipt from '@/features/legacy-pos/BillReceipt';
import TableHeatMap from '@/features/legacy-pos/TableHeatMap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useOutlet } from '@/context/OutletContext';

const Dashboard = ({
  setActiveView,
  onViewOrder,
  setDraftOrderToEdit
}) => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    monthlySales: 0,
    netCollected: 0,
    avgOrderValue: 0,
    yesterdayAOV: 0,
    totalCustomersToday: 0,
    peakHour: 'N/A',
    totalOrdersToday: 0,
    cancelledOrdersCount: 0,
    cancelledOrdersValue: 0,
    totalDiscountsToday: 0,
    discountedOrdersCountToday: 0,
    inactiveCustomersCount: 0
  });
  const [allFetchedOrders, setAllFetchedOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentOrdersFilter, setRecentOrdersFilter] = useState('today');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  
  // Pending Orders State
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [newPendingOrderAlert, setNewPendingOrderAlert] = useState(null);

  // Draft Orders State
  const [draftOrders, setDraftOrders] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [deleteDraftDialog, setDeleteDraftDialog] = useState({ open: false, order: null });

  const [viewOrder, setViewOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Table View State
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);

  // Refs for debouncing and mounting
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    if(outletId) {
        fetchDashboardData();
        fetchStoreSettings();
        fetchPendingOrders();
        fetchInactiveCustomers();
        fetchDraftOrders();
    }

    const debouncedFetch = () => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
            if (isMounted.current && outletId) {
                fetchDashboardData();
                fetchPendingOrders();
                fetchDraftOrders();
            }
        }, 1000);
    };

    let ordersChannel;
    let inventoryChannel;

    if(outletId) {
        ordersChannel = supabase.channel(`dashboard-orders-${outletId}`).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${outletId}`
        }, payload => {
        console.log("Dashboard Order Update:", payload);
        debouncedFetch();
        
        if (payload.eventType === 'INSERT' && payload.new.status === 'PENDING') {
            setNewPendingOrderAlert(payload.new);
        }
        }).subscribe();

        inventoryChannel = supabase.channel(`dashboard-inventory-${outletId}`).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_items',
        filter: `restaurant_id=eq.${outletId}`
        }, () => fetchLowStock()).subscribe();
    }

    const intervalId = setInterval(() => {
      if (isMounted.current && outletId) {
          fetchDashboardData();
          fetchPendingOrders();
          fetchDraftOrders();
      }
    }, 30000);

    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if(ordersChannel) supabase.removeChannel(ordersChannel);
      if(inventoryChannel) supabase.removeChannel(inventoryChannel);
      clearInterval(intervalId);
    };
  }, [outletId]);

  useEffect(() => {
    if (allFetchedOrders.length > 0) {
      updateRecentOrdersList(allFetchedOrders, recentOrdersFilter);
    }
  }, [recentOrdersFilter, allFetchedOrders]);

  const fetchStoreSettings = async () => {
    if(!outletId) return;
    const { data } = await supabase.from('store_settings').select('*').eq('restaurant_id', outletId).limit(1).maybeSingle();
    if (data && isMounted.current) setStoreSettings(data);
  };

  const fetchLowStock = async () => {
    if(!outletId) return;
    const { data } = await supabase.from('inventory_items').select('*').eq('restaurant_id', outletId);
    if (data && isMounted.current) {
      setLowStockItems(data.filter(item => item.current_stock <= item.min_stock_level));
    }
  };

  const fetchPendingOrders = async () => {
    if(!outletId) return;
    try {
        const { data } = await supabase.from('orders').select('*, order_items(*)').eq('restaurant_id', outletId).eq('status', 'PENDING');
        if (data && isMounted.current) setPendingOrders(data);
    } catch (e) {
        console.error("Pending orders fetch failed", e);
    }
  };

  const fetchDraftOrders = async () => {
    if(!outletId) return;
    setLoadingDrafts(true);
    try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('restaurant_id', outletId)
          .eq('status', 'DRAFT')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (isMounted.current) setDraftOrders(data || []);
    } catch (e) {
        console.error("Draft orders fetch failed", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load draft orders' });
    } finally {
        setLoadingDrafts(false);
    }
  };

  const fetchInactiveCustomers = async () => {
      if(!outletId) return;
      try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

          const { count, error } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', outletId)
            .lt('last_visit', thirtyDaysAgoIso);

          if (error) throw error;
          if (isMounted.current) {
              setStats(prev => ({ ...prev, inactiveCustomersCount: count || 0 }));
          }
      } catch (e) {
          console.error("Failed to fetch inactive customers", e);
      }
  };

  const fetchDashboardData = async () => {
    if(!outletId) return;
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0,0,0,0);
      
      const fetchStartDate = startOfMonth < yesterday ? startOfMonth : yesterday;
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const {
        data: allOrders,
        error
      } = await supabase
        .from('orders')
        .select(`*, order_items (quantity, cost_price, menu_item_id, price, menu_items(name))`)
        .eq('restaurant_id', outletId)
        .gte('created_at', fetchStartDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!isMounted.current) return;

      await fetchLowStock();
      setAllFetchedOrders(allOrders);
      
      const validOrders = allOrders.filter(o => o.status !== 'CANCELLED' && o.status !== 'ARCHIVED' && o.status !== 'PENDING' && o.status !== 'DRAFT');
      const todayOrders = validOrders.filter(o => o.created_at.startsWith(todayStr));
      const yesterdayOrders = validOrders.filter(o => o.created_at.startsWith(yesterdayStr));
      const monthOrders = validOrders.filter(o => o.created_at >= startOfMonthStr);
      const cancelledToday = allOrders.filter(o => o.created_at.startsWith(todayStr) && o.status === 'CANCELLED');
      
      const todaySales = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0) + parseFloat(o.discount_amount || 0), 0);
      const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0) + parseFloat(o.discount_amount || 0), 0);
      const monthlySales = monthOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const netCollected = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const avgOrderValue = todayOrders.length ? netCollected / todayOrders.length : 0;
      const yesterdayNetCollected = yesterdayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const yesterdayAOV = yesterdayOrders.length ? yesterdayNetCollected / yesterdayOrders.length : 0;
      const totalDiscountsToday = todayOrders.reduce((sum, o) => sum + parseFloat(o.discount_amount || 0), 0);
      const discountedOrdersCountToday = todayOrders.filter(o => parseFloat(o.discount_amount) > 0).length;
      
      const uniqueCustomers = new Set(todayOrders.map(o => o.customer_phone).filter(Boolean));
      // Fallback to customer_name if phone missing? Or just count unique phones.
      const totalCustomersToday = uniqueCustomers.size;
      
      const hoursMap = {};
      todayOrders.forEach(o => {
        const h = new Date(o.created_at).getHours();
        hoursMap[h] = (hoursMap[h] || 0) + 1;
      });
      let maxH = -1;
      let maxC = 0;
      Object.entries(hoursMap).forEach(([h, c]) => {
        if (c > maxC) {
          maxC = c;
          maxH = h;
        }
      });
      
      setStats(prev => ({
        ...prev,
        todaySales,
        yesterdaySales,
        monthlySales,
        netCollected,
        avgOrderValue,
        yesterdayAOV,
        totalCustomersToday,
        peakHour: maxH > -1 ? `${maxH}:00 - ${parseInt(maxH) + 1}:00` : 'N/A',
        totalOrdersToday: todayOrders.length,
        cancelledOrdersCount: cancelledToday.length,
        cancelledOrdersValue: cancelledToday.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        totalDiscountsToday,
        discountedOrdersCountToday
      }));
      setLoading(false);
    } catch (error) {
      console.error('Dashboard Sync Error:', error);
    }
  };

  const updateRecentOrdersList = (orders, filter) => {
    const activeOrders = orders.filter(o => o.status !== 'PENDING' && o.status !== 'ARCHIVED' && o.status !== 'DRAFT');
    
    if (filter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setRecentOrders(activeOrders.filter(o => o.created_at.startsWith(todayStr)));
    } else {
      setRecentOrders(activeOrders.slice(0, 7));
    }
  };

  const handleShareWhatsApp = order => {
    const text = `Receipt for Order #${order.order_number}. Total: ${order.total}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text.normalize("NFC"))}`, '_blank');
  };

  const confirmArchive = order => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!orderToDelete) return;
    try {
      const { error } = await supabase.from('orders').update({
          status: 'ARCHIVED',
          // original_status: orderToDelete.status, // Check if schema permits extra columns
          // archived_at: new Date().toISOString()
      }).eq('id', orderToDelete.id).eq('restaurant_id', outletId);

      if (error) throw error;
      toast({ title: 'Archived', description: 'Order moved to archives.' });
      fetchDashboardData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleAcceptPending = async (orderId) => {
      await supabase.from('orders').update({ status: 'NEW' }).eq('id', orderId).eq('restaurant_id', outletId);
      toast({ title: "Order Accepted", description: "Order moved to active list." });
      setNewPendingOrderAlert(null);
      fetchPendingOrders();
      fetchDashboardData();
  };

  const handleRejectPending = async (orderId) => {
      await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId).eq('restaurant_id', outletId);
      toast({ title: "Order Rejected", description: "Order cancelled." });
      setNewPendingOrderAlert(null);
      fetchPendingOrders();
      fetchDashboardData();
  };

  const handlePlaceDraftOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'NEW', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('restaurant_id', outletId);

      if (error) throw error;
      
      toast({ 
        title: 'Order Placed', 
        description: 'Draft order has been sent to kitchen',
        className: 'bg-green-50 border-green-200'
      });
      
      fetchDraftOrders();
      fetchDashboardData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEditDraft = (draft) => {
      setDraftOrderToEdit(draft);
      setActiveView('create-order');
      toast({ title: "Editing Draft", description: `Loaded Order #${draft.order_number}` });
  };

  const handleDeleteDraft = async () => {
    if (!deleteDraftDialog.order) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', deleteDraftDialog.order.id)
        .eq('restaurant_id', outletId);

      if (error) throw error;
      
      toast({ title: 'Draft Deleted', description: 'Draft order has been removed' });
      fetchDraftOrders();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setDeleteDraftDialog({ open: false, order: null });
    }
  };

  const renderTrend = (current, previous, prefix = '₹', zeroMsg = 'No data yesterday') => {
    if (previous === 0) {
      return <span className="text-xs font-medium ml-1 text-gray-500">{zeroMsg}</span>;
    }
    const diff = current - previous;
    const isPositive = diff >= 0;
    return <span className={`text-xs font-medium ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '▲' : '▼'}{prefix}{Math.abs(diff).toFixed(0)} vs yesterday</span>;
  };

  return <TooltipProvider>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex gap-2">
            {pendingOrders.length > 0 && (
                <Button onClick={() => setShowPendingDialog(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse">
                    <Bell className="h-4 w-4 mr-2" /> Pending ({pendingOrders.length})
                </Button>
            )}
            <Button onClick={() => setIsTableViewOpen(true)} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300">
                <LayoutGrid className="h-4 w-4 mr-2" /> Table View
            </Button>
            <Button onClick={() => setActiveView('create-order')} className="bg-orange-600 hover:bg-orange-700 text-white">
                <ShoppingCart className="h-4 w-4 mr-2" /> New Order
            </Button>
        </div>
      </div>

      {draftOrders.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileEdit className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Draft Orders ({draftOrders.length})</h3>
                <p className="text-sm text-blue-600">Incomplete orders saved for later</p>
              </div>
            </div>
          </div>

          {loadingDrafts ? (
            <div className="text-center py-8 text-blue-600">Loading drafts...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftOrders.map(draft => (
                <motion.div 
                  key={draft.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{draft.order_number}</h4>
                      <p className="text-sm text-gray-600">{draft.customer_name || 'Walk-in Customer'}</p>
                      {draft.table_number && (
                        <p className="text-xs text-gray-500">Table: {draft.table_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">₹{parseFloat(draft.total).toFixed(0)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(draft.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-2 mb-3 max-h-20 overflow-y-auto text-xs">
                     {/* order_items logic needs careful handling if strict schema doesn't join menu_item_name */}
                     {draft.order_items?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{item.quantity}x {item.menu_items?.name || 'Item'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleEditDraft(draft)}
                    >
                      <FileEdit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => handlePlaceDraftOrder(draft.id)}
                    >
                      <Send className="h-3 w-3 mr-1" /> Place
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 px-2"
                      onClick={() => setDeleteDraftDialog({ open: true, order: draft })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => setActiveView('reports')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-green-50/50 hover:bg-green-50 transition-colors">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-1"><span className="text-gray-600 font-medium text-sm">Today's Sales</span><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" /></TooltipTrigger><TooltipContent><p className="text-xs">Gross Sales (Before Discounts)</p></TooltipContent></Tooltip></div><div className="p-2 rounded-lg bg-green-100 text-green-700"><DollarSign className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-gray-900">₹{stats.todaySales.toFixed(0)}</p><div className="mt-1">{renderTrend(stats.todaySales, stats.yesterdaySales, '₹', 'First orders today')}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onClick={() => setActiveView('reports')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2"><span className="text-gray-600 font-medium text-sm">Monthly Sales</span><div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Calendar className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-gray-900">₹{stats.monthlySales.toFixed(0)}</p><p className="text-xs text-gray-400 mt-1">Total revenue this month</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={() => setActiveView('reports')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-1"><span className="text-gray-600 font-medium text-sm">Net Collected</span><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" /></TooltipTrigger><TooltipContent><p className="text-xs">Today, Total amount collected after discounts are deducted.</p></TooltipContent></Tooltip></div><div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><TrendingUp className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-emerald-700">₹{stats.netCollected.toFixed(0)}</p><p className="text-xs text-gray-400 mt-1">(After Discounts)</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onClick={() => setActiveView('customers')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-100 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100"></div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium text-sm">Inactive Customers</span>
                <div className="p-2 rounded-lg bg-red-50 text-red-600"><UserMinus className="h-5 w-5" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.inactiveCustomersCount}</p>
            <p className="text-xs text-red-500 mt-1 font-medium">Haven't visited in 30+ days</p>
            <div className="mt-3 text-[10px] text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                View & Message <Share2 className="w-3 h-3" />
            </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl p-6 shadow-sm border border-gray-200 bg-orange-50/50">
            <div className="flex items-center justify-between mb-2"><span className="text-gray-600 font-medium text-sm">Discounts Given Today</span><div className="p-2 rounded-lg bg-orange-100 text-orange-700"><Tag className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-gray-900">₹{stats.totalDiscountsToday.toFixed(0)}</p><p className="text-xs text-gray-500 mt-1">discounts on <span className="font-semibold">{stats.discountedOrdersCountToday} orders</span> today</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} onClick={() => setActiveView('reports')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2"><span className="text-gray-600 font-medium text-sm">Peak Hour</span><div className="p-2 rounded-lg bg-red-100 text-red-700"><Clock className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-gray-900">{stats.peakHour}</p><p className="text-xs text-gray-500 mt-1">Good time to push offers or combos.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} onClick={() => setActiveView('customers')} className="rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer bg-white hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2"><span className="text-gray-600 font-medium text-sm">Customers Today</span><div className="p-2 rounded-lg bg-yellow-100 text-yellow-700"><Users className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-gray-900">{stats.totalCustomersToday}</p><p className="text-xs text-gray-400 mt-1">Unique visitors</p>
        </motion.div>
        
        {stats.cancelledOrdersCount > 0 && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="rounded-xl p-6 shadow-sm border border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-2"><span className="text-red-800 font-medium text-sm">Cancelled Orders</span><div className="p-2 rounded-lg bg-white text-red-600"><XOctagon className="h-5 w-5" /></div></div><p className="text-2xl font-bold text-red-700">{stats.cancelledOrdersCount}</p><p className="text-xs text-red-600 mt-1">Value: ₹{stats.cancelledOrdersValue.toFixed(0)}</p>
        </motion.div>}
      </div>
      
      {lowStockItems.length > 0 && <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 cursor-pointer" onClick={() => setActiveView('inventory')}><div className="flex items-center gap-2 mb-4 text-red-800 font-bold text-lg"><AlertTriangle className="h-6 w-6" /><h3>Low Stock Alerts ({lowStockItems.length})</h3></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{lowStockItems.map(item => <div key={item.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex justify-between items-center"><div><p className="font-semibold text-gray-900">{item.name}</p><p className="text-xs text-gray-500">Min: {item.min_stock_level} {item.unit}</p></div><div className="text-right"><span className="text-red-600 font-bold">{item.current_stock}</span><span className="text-xs text-gray-500 block">{item.unit}</span></div></div>)}</div></div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <div className="flex bg-gray-100 p-1 rounded-md">
                <button onClick={() => setRecentOrdersFilter('today')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${recentOrdersFilter === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Today</button>
                <button onClick={() => setRecentOrdersFilter('last7')} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-all ${recentOrdersFilter === 'last7' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Last 7 Orders</button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-medium"><tr><th className="px-6 py-3">Order #</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Time</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                    {recentOrders.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-400">No orders found.</td></tr> : recentOrders.map(order => {
                const hasDiscount = (parseFloat(order.discount_amount) || 0) > 0;
                return <tr key={order.id} className={`hover:bg-gray-50 ${hasDiscount ? 'bg-orange-50/30' : ''}`}>
                                    <td className="px-6 py-4 font-medium">{order.order_number}{hasDiscount && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800"><Tag className="w-3 h-3 mr-1" /> Disc</span>}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'READY' ? 'bg-green-100 text-green-700' : order.status === 'NEW' ? 'bg-blue-100 text-blue-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 font-bold">₹{parseFloat(order.total).toFixed(0)}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString() === new Date().toLocaleDateString() ? new Date(order.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => handleShareWhatsApp(order)}><Share2 className="h-4 w-4 text-blue-600" /></Button><Button variant="ghost" size="sm" onClick={() => {
                      setViewOrder(order);
                      setIsViewModalOpen(true);
                    }}><Eye className="h-4 w-4 text-gray-600" /></Button><Button variant="ghost" size="sm" onClick={() => confirmArchive(order)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="Archive"><Archive className="h-4 w-4" /></Button></td>
                                </tr>;
              })}
                </tbody>
            </table>
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden max-h-[80vh]">
             <div className="overflow-y-auto"><BillReceipt order={viewOrder} settings={storeSettings} /><div className="p-4 border-t flex justify-center"><Button onClick={() => setIsViewModalOpen(false)}>Close</Button></div></div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Archive Order</DialogTitle>
                <DialogDescription>
                    Are you sure you want to move Order #{orderToDelete?.order_number} to archives? 
                    It will be removed from this list but can be restored later.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleArchive} className="bg-orange-600 hover:bg-orange-700 text-white">Archive Order</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTableViewOpen} onOpenChange={setIsTableViewOpen}>
          <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
             <DialogHeader className="p-6 pb-2">
                 <DialogTitle>Restaurant Floor Map</DialogTitle>
                 <DialogDescription>View live table status and manage availability.</DialogDescription>
             </DialogHeader>
             <div className="flex-1 overflow-hidden p-6 pt-0">
                 <TableHeatMap />
             </div>
             <DialogFooter className="p-4 border-t">
                 <Button onClick={() => setIsTableViewOpen(false)}>Close Map</Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Dialog open={!!newPendingOrderAlert} onOpenChange={() => setNewPendingOrderAlert(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-orange-600 flex items-center gap-2"><Bell className="h-5 w-5" /> New Order Request!</DialogTitle>
                <DialogDescription>
                    A new order has been placed from Table {newPendingOrderAlert?.table_number}. Please review.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                 <Button variant="outline" onClick={() => setNewPendingOrderAlert(null)}>Dismiss</Button>
                 <Button onClick={() => { setShowPendingDialog(true); setNewPendingOrderAlert(null); }}>Review Orders</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                  <DialogTitle>Pending Orders ({pendingOrders.length})</DialogTitle>
                  <DialogDescription>Review and accept orders placed via QR code.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No pending orders.</div>
                  ) : (
                      pendingOrders.map(order => (
                          <div key={order.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h4 className="font-bold text-lg">{order.order_number}</h4>
                                      <p className="text-sm text-gray-600">Table {order.table_number}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold">₹{order.total}</p>
                                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                                  </div>
                              </div>
                              <div className="bg-white p-3 rounded border border-gray-100 mb-3 text-sm">
                                   {/* Order Item Names might NOT be joined, carefully check schema */}
                                  {order.order_items?.map(item => (
                                      <div key={item.id} className="flex justify-between">
                                          <span>{item.quantity}x {item.menu_items?.name || 'Item'}</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex gap-2 justify-end">
                                  <Button variant="destructive" size="sm" onClick={() => handleRejectPending(order.id)}>Reject</Button>
                                  <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleAcceptPending(order.id)}>Accept Order</Button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPendingDialog(false)}>Close</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Delete Draft Confirmation Dialog */}
      <Dialog open={deleteDraftDialog.open} onOpenChange={(open) => setDeleteDraftDialog({ ...deleteDraftDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Delete Draft Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete draft order <strong>{deleteDraftDialog.order?.order_number}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDraftDialog({ open: false, order: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDraft}>
              Delete Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>;
};
export default Dashboard;
