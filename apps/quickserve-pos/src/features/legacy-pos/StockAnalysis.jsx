
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingDown, History, AlertOctagon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StockAnalysis = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
      todayConsumed: 0,
      last7Days: 0,
      last30Days: 0,
      topItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
        setLoading(true);
        // Fetch logs with related item names
        const { data, error } = await supabase
            .from('stock_logs')
            .select('*, stock_item:inventory_items(name, unit)')
            .order('created_at', { ascending: false })
            .limit(500); // Limit to last 500 records for performance

        if (error) throw error;
        setLogs(data || []);
        processStats(data || []);
    } catch (e) {
        console.error("Fetch stats error", e);
    } finally {
        setLoading(false);
    }
  };

  const processStats = (logData) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const last7 = new Date(today); last7.setDate(today.getDate() - 7);
      const last30 = new Date(today); last30.setDate(today.getDate() - 30);

      let consumedToday = 0; // Just count of events for now as units differ
      let consumed7 = 0;
      let consumed30 = 0;
      
      const itemConsumptionMap = {}; // item_id -> { name, totalQty, unit }

      logData.forEach(log => {
          const logDate = new Date(log.created_at);
          const qty = Math.abs(parseFloat(log.quantity_change));
          
          // Only count negative (consumption)
          if (parseFloat(log.quantity_change) >= 0) return;

          if (logDate >= today) consumedToday += 1;
          if (logDate >= last7) consumed7 += 1;
          if (logDate >= last30) consumed30 += 1;

          // Item aggregations (only if stock_item exists)
          if (log.stock_item) {
              const key = log.stock_item_id;
              if (!itemConsumptionMap[key]) {
                  itemConsumptionMap[key] = { 
                      name: log.stock_item.name, 
                      unit: log.stock_item.unit, 
                      count: 0, 
                      totalQty: 0 
                  };
              }
              itemConsumptionMap[key].count += 1;
              itemConsumptionMap[key].totalQty += qty;
          }
      });

      // Sort by frequency of consumption events
      const topItems = Object.values(itemConsumptionMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

      setStats({
          todayConsumed: consumedToday,
          last7Days: consumed7,
          last30Days: consumed30,
          topItems
      });
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card>
               <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-gray-500">Consumption Events (Today)</CardTitle>
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">{stats.todayConsumed}</div>
                   <p className="text-xs text-gray-500">Stock deductions today</p>
               </CardContent>
           </Card>
           <Card>
               <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-gray-500">Last 7 Days</CardTitle>
               </CardHeader>
               <CardContent>
                   <div className="text-2xl font-bold">{stats.last7Days}</div>
                   <p className="text-xs text-gray-500">Total deductions</p>
               </CardContent>
           </Card>
           <Card>
               <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-gray-500">Top Consumed Item</CardTitle>
               </CardHeader>
               <CardContent>
                   <div className="text-xl font-bold truncate">{stats.topItems[0]?.name || 'N/A'}</div>
                   <p className="text-xs text-gray-500">Most frequently used</p>
               </CardContent>
           </Card>
       </div>

       <Tabs defaultValue="logs">
           <TabsList>
               <TabsTrigger value="logs">Recent Logs</TabsTrigger>
               <TabsTrigger value="top">Top Consuming Items</TabsTrigger>
           </TabsList>

           <TabsContent value="logs" className="bg-white rounded-md border border-gray-200 overflow-hidden">
               <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-500">
                       <tr>
                           <th className="p-3">Time</th>
                           <th className="p-3">Item</th>
                           <th className="p-3">Change</th>
                           <th className="p-3">Reason</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                       {logs.map(log => (
                           <tr key={log.id}>
                               <td className="p-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                               <td className="p-3 font-medium">{log.stock_item?.name || 'Unknown'}</td>
                               <td className={`p-3 font-bold ${log.quantity_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                   {log.quantity_change} {log.stock_item?.unit}
                               </td>
                               <td className="p-3">
                                   {log.reason?.includes('Override') ? (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                           <AlertOctagon className="w-3 h-3 mr-1" /> Override
                                       </span>
                                   ) : (
                                       <span className="text-gray-500 text-xs">{log.reason}</span>
                                   )}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </TabsContent>

           <TabsContent value="top" className="bg-white rounded-md border border-gray-200">
                <div className="p-4">
                    <h3 className="font-semibold mb-4 text-gray-700">Highest Consumption Frequency</h3>
                    <div className="space-y-4">
                        {stats.topItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.count} usage events</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">{item.totalQty.toFixed(2)} {item.unit}</div>
                                    <div className="text-xs text-gray-500">Total Qty</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
           </TabsContent>
       </Tabs>
    </div>
  );
};

export default StockAnalysis;
