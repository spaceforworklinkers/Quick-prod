
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useTables, useOrders } from '@/hooks/useOutletData'; // Import hooks
import { OrderService } from '@/services/OrderService';

const TableHeatMap = ({ onTableSelect, isSelectionMode = false, onClose }) => {
  const { toast } = useToast();
  // Local-First Data Strings
  const { tables, loading: tablesLoading, refresh: refreshTables } = useTables();
  const { orders: activeOrders, loading: ordersLoading, refresh: refreshOrders } = useOrders(['NEW', 'IN KITCHEN', 'READY']);
  
  const [floors, setFloors] = useState([]);
  const [activeFloor, setActiveFloor] = useState('');
  
  // Management State
  const [selectedTable, setSelectedTable] = useState(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  // Computed Tables with Status
  const displayTables = useMemo(() => {
      if (!tables || !activeOrders) return [];
      return tables.map(table => {
          // Find orders for this table
          // activeOrders form useOrders contains full order objects
          const tableOrders = activeOrders.filter(o => o.table_id === table.id);
          
          const calculatedOccupancy = tableOrders.reduce((sum, o) => sum + (o.people_count || 0), 0);
          
          let calculatedStatus = 'Available';

          if (calculatedOccupancy > 0) {
              if (calculatedOccupancy >= table.capacity) {
                  calculatedStatus = 'Full';
              } else {
                  calculatedStatus = 'Occupied';
              }
          } else {
              if (table.status === 'Booked') {
                  calculatedStatus = 'Booked';
              } else {
                  calculatedStatus = 'Available';
              }
          }

          return {
              ...table,
              status: calculatedStatus,
              current_occupancy: calculatedOccupancy
          };
      });
  }, [tables, activeOrders]);

  useEffect(() => {
     if (tables.length > 0) {
        const uniqueFloors = [...new Set(tables.map(t => t.floor_name))].sort();
        setFloors(uniqueFloors);
        if (uniqueFloors.length > 0 && !activeFloor) setActiveFloor(uniqueFloors[0]);
     }
  }, [tables]);

  const loading = tablesLoading || ordersLoading;
  
  const handleRefresh = () => {
      refreshTables();
      refreshOrders();
  };

  const getStatusColor = (table) => {
    // Priority: Booked (Yellow) -> Full (Red) -> Occupied/Partial (Orange) -> Available (Green)
    if (table.status === 'Booked') return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    if (table.status === 'Full') return 'bg-red-100 border-red-300 text-red-800';
    if (table.status === 'Occupied') return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-green-100 border-green-300 text-green-800'; // Available
  };

  const getStatusIcon = (table) => {
    if (table.status === 'Booked') return <AlertTriangle className="h-4 w-4" />;
    if (table.status === 'Full') return <Users className="h-4 w-4" />;
    if (table.status === 'Occupied') return <Users className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = (table) => {
    if (table.status === 'Occupied') return 'Partial'; // UI says "Partial" for occupied
    return table.status;
  };

  const handleTableClick = (table) => {
    if (isSelectionMode) {
      // In selection mode (Create Order)
      
      // 1. Check Capacity
      if (table.status === 'Full') {
        toast({ variant: "destructive", title: "Table Full", description: `Table ${table.name} is at full capacity.` });
        return;
      }

      // 2. Warn if Booked
      if (table.status === 'Booked') {
         if (!window.confirm(`Table ${table.name} is marked as BOOKED. Do you want to override and assign an order?`)) {
             return;
         }
      }
      
      onTableSelect(table);
    } else {
      // In dashboard mode, open management dialog
      setSelectedTable(table);
      setManageDialogOpen(true);
    }
  };

  const updateTableStatus = async (newStatus) => {
    try {
      if (!selectedTable) return;
      
      const payload = { status: newStatus };
      if (newStatus === 'Available') payload.current_occupancy = 0;
      
      await OrderService.updateTable(selectedTable.id, payload, selectedTable.restaurant_id);
      
      toast({ title: "Status Updated", description: `Table ${selectedTable.name} updated to ${newStatus}` });
      setManageDialogOpen(false);
      refreshTables();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const filteredTables = displayTables.filter(t => t.floor_name === activeFloor);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      {/* Header / Floor Selector */}
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            {floors.length === 0 && !loading && <span className="text-sm text-gray-400 italic">No floors configured. Go to Settings.</span>}
            {floors.map(floor => (
                <Button
                    key={floor}
                    variant={activeFloor === floor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFloor(floor)}
                    className={`${activeFloor === floor ? 'bg-orange-600 hover:bg-orange-700' : ''} whitespace-nowrap`}
                >
                    {floor}
                </Button>
            ))}
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium">
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Avail</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Partial</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Full</div>
             <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Booked</div>
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} title="Refresh Status"><RefreshCw className="h-3 w-3"/></Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
         {loading ? (
             <div className="flex justify-center items-center h-40">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
             </div>
         ) : filteredTables.length === 0 ? (
             <div className="text-center py-10 text-gray-400">
                 <p>No tables found on this floor.</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {filteredTables.map(table => (
                     <motion.div
                        key={table.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTableClick(table)}
                        className={`
                            relative p-4 rounded-xl border-2 cursor-pointer shadow-sm flex flex-col items-center justify-center text-center gap-2 min-h-[130px] transition-all
                            ${getStatusColor(table)}
                            ${isSelectionMode ? 'hover:ring-2 hover:ring-orange-400' : ''}
                        `}
                     >
                         <div className="font-bold text-lg">{table.name}</div>
                         
                         <div className="flex items-center gap-1 text-xs opacity-80 font-medium">
                             <Users className="h-3 w-3" />
                             <span>{table.current_occupancy || 0} / {table.capacity || '4'}</span>
                         </div>
                         
                         {/* Visual Capacity Bar */}
                         <div className="w-full h-1.5 bg-black/10 rounded-full mt-1 overflow-hidden">
                             <div 
                                className="h-full bg-current transition-all duration-500" 
                                style={{ width: `${Math.min(((table.current_occupancy || 0) / (table.capacity || 4)) * 100, 100)}%` }}
                             />
                         </div>

                         <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-white/50 px-2 py-0.5 rounded-full">
                             {getStatusIcon(table)}
                             {getStatusText(table)}
                         </div>
                     </motion.div>
                 ))}
             </div>
         )}
      </div>

      {/* Management Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-xs">
            <DialogHeader>
                <DialogTitle>Manage Table {selectedTable?.name}</DialogTitle>
                <DialogDescription>
                    Current Occupancy: {selectedTable?.current_occupancy}/{selectedTable?.capacity}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
                <Button 
                    variant="outline" 
                    className="justify-start border-green-200 hover:bg-green-50 text-green-700"
                    onClick={() => updateTableStatus('Available')}
                >
                    <CheckCircle className="mr-2 h-4 w-4" /> Force Mark Available
                </Button>
                <Button 
                    variant="outline" 
                    className="justify-start border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                    onClick={() => updateTableStatus('Booked')}
                >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Mark as Booked
                </Button>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setManageDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableHeatMap;
