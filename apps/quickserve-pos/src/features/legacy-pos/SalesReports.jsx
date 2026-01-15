
import React, { useState, useEffect } from 'react';
import { Calendar, Download, Trash2, PieChart, TrendingUp, BarChart3, Users, Eye, FileText, Info, AlertOctagon, Tag, Clock, ChevronDown, ChevronUp, Archive, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOutlet } from '@/context/OutletContext';

// Helper component for SVG Line Chart (Today)
const SimpleLineChart = ({ data, height = 160 }) => {
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">No Data</div>;

    const values = data.map(d => d.value);
    const max = Math.max(...values, 10);
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value / max) * 100);
        return { x, y, value: d.value, label: d.label };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        d += ` C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return (
        <div className="w-full h-full relative group" style={{ height: `${height}px` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`${d} L 100 100 L 0 100 Z`} fill="url(#gradient)" stroke="none" />
                <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {points.map((p, i) => (
                    <g key={i} className="group/point">
                         <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3b82f6" strokeWidth="2" className="transition-all duration-200 opacity-0 group-hover/point:opacity-100 hover:scale-150 cursor-pointer" vectorEffect="non-scaling-stroke" />
                    </g>
                ))}
            </svg>
            {points.map((p, i) => (
                 <div key={i} className="absolute w-2 h-full top-0 hover:bg-white/10 group/col" style={{ left: `${p.x}%`, transform: 'translateX(-50%)' }}>
                      <div className="absolute opacity-0 group-hover/col:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                          {p.label}: ₹{p.value.toFixed(0)}
                      </div>
                 </div>
            ))}
        </div>
    );
};

// Helper component for SVG Bar Chart
const SimpleBarChart = ({ data, height = 160 }) => {
    if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">No Data</div>;

    const max = Math.max(...data.map(d => d.value), 10);

    return (
        <div className="w-full h-full flex items-end justify-between gap-1" style={{ height: `${height}px` }}>
            {data.map((d, i) => {
                const barHeight = (d.value / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                         <div 
                             className="w-full bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all min-h-[4px]" 
                             style={{ height: `${barHeight}%` }}
                         />
                         <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10 shadow-sm">
                             <div className="font-bold">{d.label}</div>
                             <div>₹{d.value.toFixed(0)}</div>
                         </div>
                         <span className="text-[9px] text-gray-400 mt-1 w-full text-center truncate">{d.label}</span>
                    </div>
                )
            })}
        </div>
    );
};


const SalesReports = ({ onViewOrder }) => {
  const { toast } = useToast();
  const { outletId } = useOutlet();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [allItems, setAllItems] = useState([]); 
  
  const [revenueFilter, setRevenueFilter] = useState('7days');

  const [comparisonMetrics, setComparisonMetrics] = useState({
      trend: 'neutral', 
      percentage: 0,
      insightText: ''
  });

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); 
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [analytics, setAnalytics] = useState({
      revenueChartData: [],
      topItems: [],
      itemsNotSold: [],
      paymentMethods: [],
      netCollected: 0,
      totalDiscounts: 0,
      discountedOrdersCount: 0,
      peakHour: 'N/A',
      lowestHour: 'N/A',
      avgOrderValue: 0,
      avgOrderValueComparison: { diff: 0, trend: 'neutral' }
  });

  const [showUnsoldItems, setShowUnsoldItems] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, outletId]);

  useEffect(() => {
      if (orders.length > 0) {
          processRevenueChart(orders, revenueFilter);
      }
  }, [revenueFilter, orders]);

  const fetchReportData = async () => {
    if(!outletId) return;

    try {
      setLoading(true);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      
      const fetchStart = new Date(startDate);
      fetchStart.setDate(fetchStart.getDate() - 30); 

      // Filter by outletId
      const { data: menuData } = await supabase.from('menu_items')
        .select('id, name')
        .eq('status', 'active')
        .eq('restaurant_id', outletId);
      setAllItems(menuData || []);

      const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                menu_item_id,
                quantity,
                price,
                menu_items (name)
            )
        `)
        .eq('restaurant_id', outletId)
        .gte('created_at', fetchStart.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allFetchedOrders = data || [];
      const activeOrders = allFetchedOrders.filter(o => o.status !== 'ARCHIVED');
      const archived = allFetchedOrders.filter(o => o.status === 'ARCHIVED');
      
      setArchivedOrders(archived);
      setOrders(activeOrders);

      const userStart = new Date(startDate);
      processAnalytics(activeOrders, userStart, endDateTime, menuData || []);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const processRevenueChart = (data, filter) => {
      const validOrders = data.filter(o => o.status !== 'CANCELLED');
      let chartData = [];
      let currentPeriodTotal = 0;
      let previousPeriodTotal = 0;
      let insightText = "";
      let trend = 'neutral';
      let percentage = 0;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (filter === 'today') {
          const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const todayMap = new Array(24).fill(0);
          validOrders.forEach(o => {
              if (o.created_at.startsWith(todayStr)) {
                  const h = new Date(o.created_at).getHours();
                  todayMap[h] += parseFloat(o.total);
                  currentPeriodTotal += parseFloat(o.total);
              } else if (o.created_at.startsWith(yesterdayStr)) {
                  previousPeriodTotal += parseFloat(o.total);
              }
          });

          chartData = todayMap.map((val, hour) => ({
              label: `${hour}:00`,
              value: val,
              isCurrent: true
          })).filter((_, i) => i >= 8 && i <= 23);

          const diff = currentPeriodTotal - previousPeriodTotal;
          percentage = previousPeriodTotal > 0 ? (diff / previousPeriodTotal) * 100 : 0;
          trend = diff >= 0 ? 'up' : 'down';
          insightText = `Sales today are ${trend === 'up' ? '▲' : '▼'}${Math.abs(percentage).toFixed(1)}% ${trend === 'up' ? 'higher' : 'lower'} than yesterday.`;

      } else if (filter === '7days') {
          const last7End = new Date(now);
          const last7Start = new Date(now); last7Start.setDate(now.getDate() - 6);
          const prev7End = new Date(last7Start); prev7End.setDate(prev7End.getDate() - 1);
          const prev7Start = new Date(prev7End); prev7Start.setDate(prev7End.getDate() - 6);

          const daysMap = {};
          for(let d = new Date(last7Start); d <= last7End; d.setDate(d.getDate() + 1)) {
              daysMap[d.toISOString().split('T')[0]] = 0;
          }

          validOrders.forEach(o => {
              const d = new Date(o.created_at);
              const dStr = d.toISOString().split('T')[0];
              if (d >= last7Start && d <= last7End) {
                  daysMap[dStr] = (daysMap[dStr] || 0) + parseFloat(o.total);
                  currentPeriodTotal += parseFloat(o.total);
              }
              if (d >= prev7Start && d <= prev7End) {
                  previousPeriodTotal += parseFloat(o.total);
              }
          });

          chartData = Object.entries(daysMap).map(([date, total]) => ({
              label: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
              value: total,
              isCurrent: true
          }));

          const diff = currentPeriodTotal - previousPeriodTotal;
          percentage = previousPeriodTotal > 0 ? (diff / previousPeriodTotal) * 100 : 0;
          trend = diff >= 0 ? 'up' : 'down';
          insightText = `Revenue this week is ${trend === 'up' ? '▲' : '▼'}${Math.abs(percentage).toFixed(1)}% vs previous week.`;

      } else if (filter === 'month') {
          // BUG FIX: Show Monthly Labels (Jan, Feb, Mar...) instead of Days (1, 2, 3...)
          // Aggregate by month for all available data in the selection
          
          const monthMap = {};
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

          validOrders.forEach(o => {
             const d = new Date(o.created_at);
             const key = `${d.getFullYear()}-${d.getMonth()}`;
             if (!monthMap[key]) {
                 monthMap[key] = { value: 0, date: d };
             }
             monthMap[key].value += parseFloat(o.total);
             currentPeriodTotal += parseFloat(o.total);
          });
          
          // If no data, show current month
          if (Object.keys(monthMap).length === 0) {
              const d = new Date();
              chartData = [{ label: monthNames[d.getMonth()], value: 0 }];
          } else {
              chartData = Object.values(monthMap)
                .sort((a, b) => a.date - b.date)
                .map(item => ({
                    label: monthNames[item.date.getMonth()],
                    value: item.value,
                    isCurrent: true
                }));
          }
          
          insightText = `Total revenue for selected range: ₹${currentPeriodTotal.toFixed(0)}`;
          trend = 'neutral';
      }

      setAnalytics(prev => ({ ...prev, revenueChartData: chartData }));
      setComparisonMetrics({ trend, percentage, insightText });
  };

  const processAnalytics = (allOrders, userStart, userEnd, allMenuItems) => {
      const validOrdersInRange = allOrders.filter(o => 
          o.status !== 'CANCELLED' && 
          new Date(o.created_at) >= userStart &&
          new Date(o.created_at) <= userEnd
      );

      const duration = userEnd - userStart;
      const prevStart = new Date(userStart.getTime() - duration);
      const prevEnd = new Date(userEnd.getTime() - duration);
      
      const prevOrdersInRange = allOrders.filter(o => 
          o.status !== 'CANCELLED' && 
          new Date(o.created_at) >= prevStart &&
          new Date(o.created_at) <= prevEnd
      );

      const netCollected = validOrdersInRange.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const totalDiscounts = validOrdersInRange.reduce((sum, o) => sum + parseFloat(o.discount_amount || 0), 0);
      const discountedOrdersCount = validOrdersInRange.filter(o => parseFloat(o.discount_amount) > 0).length;

      const currentAOV = validOrdersInRange.length > 0 ? netCollected / validOrdersInRange.length : 0;
      const prevNetCollected = prevOrdersInRange.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      const prevAOV = prevOrdersInRange.length > 0 ? prevNetCollected / prevOrdersInRange.length : 0;
      const aovDiff = currentAOV - prevAOV;
      const aovTrend = aovDiff >= 0 ? 'up' : 'down';

      const hoursMap = {};
      for (let i = 0; i < 24; i++) hoursMap[i] = 0;
      
      validOrdersInRange.forEach(o => {
          const h = new Date(o.created_at).getHours();
          hoursMap[h] = (hoursMap[h] || 0) + 1;
      });

      let maxCount = -1; let maxHour = -1;
      let minCount = Infinity; let minHour = -1;
      const activeHours = Object.entries(hoursMap).filter(([_, count]) => count > 0);
      
      if (activeHours.length > 0) {
          Object.entries(hoursMap).forEach(([h, count]) => {
              if (count > maxCount) { maxCount = count; maxHour = h; }
          });
          activeHours.forEach(([h, count]) => {
             const val = parseInt(count);
             if (val < minCount) { minCount = val; minHour = h; }
          });
      }

      const formatHour = (h) => h !== -1 ? `${h}:00 – ${parseInt(h)+1}:00` : 'N/A';

      const itemSalesMap = {};
      const soldItemIds = new Set();
      
      validOrdersInRange.forEach(order => {
          order.order_items?.forEach(item => {
              // Extract name from joined menu_items or fallback
              const itemName = item.menu_items?.name || 'Unknown Item';
              const price = item.price || 0; // Use price from order_items
              
              if (!itemSalesMap[itemName]) {
                  itemSalesMap[itemName] = { qty: 0, revenue: 0 };
              }
              itemSalesMap[itemName].qty += item.quantity;
              itemSalesMap[itemName].revenue += (parseFloat(price) * item.quantity);
              
              if(item.menu_item_id) soldItemIds.add(item.menu_item_id);
          });
      });

      const topItemsArr = Object.entries(itemSalesMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
        
      const unsoldItemsArr = allMenuItems.filter(item => !soldItemIds.has(item.id)).map(i => i.name);

      const payMap = {};
      validOrdersInRange.forEach(order => {
           const method = order.payment_method || 'Unpaid';
           if (!payMap[method]) {
               payMap[method] = { count: 0, amount: 0 };
           }
           payMap[method].count += 1;
           payMap[method].amount += parseFloat(order.total || 0);
      });
      const payArr = Object.entries(payMap)
        .map(([method, data]) => ({ method, ...data }))
        .sort((a, b) => b.amount - a.amount);

      setAnalytics(prev => ({
          ...prev,
          topItems: topItemsArr,
          itemsNotSold: unsoldItemsArr,
          paymentMethods: payArr,
          netCollected,
          totalDiscounts,
          discountedOrdersCount,
          peakHour: formatHour(maxHour),
          lowestHour: minCount !== Infinity ? formatHour(minHour) : 'N/A',
          avgOrderValue: currentAOV,
          avgOrderValueComparison: { diff: Math.abs(aovDiff), trend: aovTrend }
      }));
      
      processRevenueChart(allOrders, revenueFilter);
  };

  const initiateAction = (order, type) => {
      setSelectedOrderForAction(order);
      setActionType(type);
      setActionDialogOpen(true);
  };

  const handleAction = async () => {
      if (!selectedOrderForAction || !outletId) return;
      try {
          if (actionType === 'restore') {
              const originalStatus = selectedOrderForAction.original_status || 'BILLED'; 
              const { error } = await supabase
                .from('orders')
                .update({ 
                    status: originalStatus,
                    archived_at: null 
                })
                .eq('id', selectedOrderForAction.id)
                .eq('restaurant_id', outletId);
                
              if (error) throw error;
              toast({ title: 'Restored', description: `Order restored to ${originalStatus}.` });

          } else if (actionType === 'permanent_delete') {
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', selectedOrderForAction.id)
                .eq('restaurant_id', outletId);

              if (error) throw error;
              toast({ title: 'Deleted', description: 'Order record deleted permanently.' });
          }
          
          fetchReportData(); 
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setActionDialogOpen(false);
          setSelectedOrderForAction(null);
      }
  };

  const downloadCSV = () => {
      const userStart = new Date(startDate);
      const userEnd = new Date(endDate); userEnd.setHours(23,59,59);
      
      const csvOrders = orders.filter(o => 
          new Date(o.created_at) >= userStart && 
          new Date(o.created_at) <= userEnd
      );

      if (csvOrders.length === 0) return;
      
      const headers = ["Order No", "Date", "Customer", "Type", "Status", "Payment", "Total"];
      const rows = csvOrders.map(o => [
          o.order_number,
          new Date(o.created_at).toLocaleDateString(),
          o.customer_name || 'Walk-in',
          o.order_type,
          o.status,
          o.payment_method || 'N/A',
          o.total
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sales_Report_${startDate}_to_${endDate}.csv`;
      link.click();
  };

  const ordersForTable = orders.filter(o => {
      const d = new Date(o.created_at);
      const s = new Date(startDate);
      const e = new Date(endDate); e.setHours(23,59,59);
      return d >= s && d <= e;
  });

  const cancelledOrders = ordersForTable.filter(o => o.status === 'CANCELLED').length;

  return (
    <TooltipProvider>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div className="flex gap-2 bg-white p-1 rounded-md border border-gray-200">
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-none text-sm outline-none px-2"
            />
            <span className="self-center text-gray-400">→</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-none text-sm outline-none px-2"
            />
            <Button onClick={downloadCSV} variant="ghost" size="sm" className="h-6" title="Download CSV">
                <Download className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
         <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invoices">All Invoices</TabsTrigger>
            <TabsTrigger value="archived" className="text-gray-600 gap-2"><Archive className="h-4 w-4" /> Archived Orders</TabsTrigger>
         </TabsList>

         <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Revenue Trend
                        </h3>
                        <div className="flex bg-gray-100 rounded-md p-0.5">
                            {['today', '7days', 'month'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setRevenueFilter(period)}
                                    className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-all ${
                                        revenueFilter === period 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {period === 'today' ? 'Today' : period === '7days' ? '7 Days' : 'Monthly'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className={`text-xs mb-4 font-medium px-3 py-2 rounded-lg flex items-center gap-2 ${
                        comparisonMetrics.trend === 'up' ? 'bg-green-50 text-green-700' : 
                        comparisonMetrics.trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                    }`}>
                        {comparisonMetrics.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : comparisonMetrics.trend === 'down' ? <TrendingUp className="h-3 w-3 transform rotate-180" /> : <Info className="h-3 w-3" />}
                        {comparisonMetrics.insightText}
                    </div>

                    <div className="h-40 px-2">
                        {revenueFilter === 'today' ? (
                            <SimpleLineChart data={analytics.revenueChartData} height={160} />
                        ) : (
                            <SimpleBarChart data={analytics.revenueChartData} height={160} />
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Top Items (by Revenue)
                    </h3>
                    <div className="space-y-3">
                        {analytics.topItems.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-700 truncate flex-1 pr-2">{item.name}</span>
                                    <div className="text-right">
                                        <span className="text-gray-900 font-bold block">₹{item.revenue.toFixed(0)}</span>
                                        <span className="text-[10px] text-gray-500">{item.qty} sold</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div 
                                        className="bg-orange-500 h-1.5 rounded-full" 
                                        style={{ width: `${(item.revenue / analytics.topItems[0].revenue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {analytics.topItems.length === 0 && <p className="text-xs text-gray-400">No sales data</p>}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-orange-500" /> Items Not Sold
                    </h3>
                    <div className="flex-1 flex flex-col justify-between">
                         <div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{analytics.itemsNotSold.length}</p>
                            <p className="text-xs text-gray-500 mb-4">Items had no sales during the selected period.</p>
                         </div>
                         
                         <div className="mt-auto">
                            {analytics.itemsNotSold.length > 0 && (
                                <div className="border-t pt-3">
                                    <button 
                                        onClick={() => setShowUnsoldItems(!showUnsoldItems)} 
                                        className="flex items-center justify-between w-full text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <span>{showUnsoldItems ? 'Hide List' : 'View Item Names'}</span>
                                        {showUnsoldItems ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </button>
                                    
                                    {showUnsoldItems && (
                                        <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100">
                                            <ul className="list-disc pl-3 space-y-1">
                                                {analytics.itemsNotSold.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Tag className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Discount Impact</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">₹{analytics.totalDiscounts.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">
                        given on <span className="font-semibold text-gray-700">{analytics.discountedOrdersCount} orders</span> in selected period.
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Busy Hours</h3>
                    </div>
                    <div className="space-y-3">
                         <div>
                             <span className="text-[10px] uppercase text-gray-400 font-bold">Peak Hour</span>
                             <p className="text-sm font-bold text-gray-900">{analytics.peakHour}</p>
                         </div>
                         <div>
                             <span className="text-[10px] uppercase text-gray-400 font-bold">Lowest Order Hour</span>
                             <p className="text-sm font-bold text-gray-600">{analytics.lowestHour}</p>
                         </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <BarChart3 className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Avg Order Value</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">₹{analytics.avgOrderValue.toFixed(0)}</p>
                    <div className={`text-xs flex items-center gap-1 ${
                        analytics.avgOrderValueComparison.trend === 'up' ? 'text-green-600' : 
                        analytics.avgOrderValueComparison.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                        <span>{analytics.avgOrderValueComparison.trend === 'up' ? '▲' : '▼'}</span>
                        <span>₹{analytics.avgOrderValueComparison.diff.toFixed(0)} vs previous</span>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                        <PieChart className="h-4 w-4" /> Payment Breakdown
                    </h3>
                    <div className="space-y-3 pt-1">
                        {analytics.paymentMethods.map((pm, i) => {
                            const totalAmount = analytics.paymentMethods.reduce((a, b) => a + b.amount, 0);
                            const percentage = totalAmount > 0 ? ((pm.amount / totalAmount) * 100).toFixed(1) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${pm.method === 'Cash' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                            <span className="text-xs font-medium text-gray-700">{pm.method}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">₹{pm.amount.toFixed(0)}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1">
                                        <div 
                                            className={`${pm.method === 'Cash' ? 'bg-green-500' : 'bg-blue-500'} h-1 rounded-full`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {analytics.paymentMethods.length === 0 && <p className="text-xs text-gray-400">No payment data</p>}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-gray-500">Net Collected (After Discounts)</p>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">This represents total amount collected after discounts.<br/>Cost-based profit is not included.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-green-600">₹{analytics.netCollected.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{ordersForTable.filter(o => o.status !== 'CANCELLED').length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500">Cancelled Orders</p>
                    <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
                </div>
            </div>
         </TabsContent>

         <TabsContent value="invoices">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Date & Time</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading data...</td></tr>
                            ) : ordersForTable.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No invoices found in this range.</td></tr>
                            ) : (
                                ordersForTable.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium">{order.order_number}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{order.customer_name || 'Walk-in'}</span>
                                                {order.customer_mobile && <span className="text-xs text-gray-400">{order.customer_mobile}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                                ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                                                    order.status === 'BILLED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-medium">₹{parseFloat(order.total).toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => onViewOrder(order)}
                                                className="h-8 text-xs"
                                            >
                                                <Eye className="h-3 w-3 mr-2" /> View
                                            </Button>
                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => onViewOrder(order)}
                                                className="h-8 text-xs"
                                                title="View to Download PDF"
                                            >
                                                <FileText className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-50"
                                                onClick={() => {
                                                    setSelectedOrderForAction(order);
                                                }}
                                                disabled={true}
                                                title="Archive via Dashboard"
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </TabsContent>
         
         <TabsContent value="archived">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 text-gray-500 text-sm">
                    Archived orders are hidden from dashboard and calculations but preserved here for records.
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Order Date</th>
                                <th className="px-6 py-3">Archived Date</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {archivedOrders.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No archived orders.</td></tr>
                            ) : (
                                archivedOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium">{order.order_number}</td>
                                        <td className="px-6 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-gray-500">{order.archived_at ? new Date(order.archived_at).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-3">{order.customer_name || 'Walk-in'}</td>
                                        <td className="px-6 py-3 text-right font-medium">₹{parseFloat(order.total).toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => initiateAction(order, 'restore')}
                                                className="h-8 text-xs text-blue-600 hover:text-blue-700"
                                            >
                                                <RefreshCcw className="h-3 w-3 mr-2" /> Restore
                                            </Button>
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => initiateAction(order, 'permanent_delete')}
                                                title="Delete Permanently"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </TabsContent>
      </Tabs>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {actionType === 'restore' ? 'Restore Order' : 'Permanent Delete'}
                </DialogTitle>
                <DialogDescription>
                    {actionType === 'restore' 
                        ? `Restore Order #${selectedOrderForAction?.order_number} to active list? It will reappear in dashboard.` 
                        : `Are you sure you want to permanently delete Order #${selectedOrderForAction?.order_number}? This action is irreversible.`}
                </DialogDescription>
            </DialogHeader>
            {actionType === 'permanent_delete' && (
                <div className="bg-red-50 p-3 rounded flex items-center gap-2 text-red-800 text-sm">
                    <AlertTriangle className="h-4 w-4" /> 
                    <span>This cannot be undone.</span>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
                <Button 
                    variant={actionType === 'restore' ? 'default' : 'destructive'} 
                    onClick={handleAction}
                >
                    {actionType === 'restore' ? 'Confirm Restore' : 'Delete Permanently'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default SalesReports;
