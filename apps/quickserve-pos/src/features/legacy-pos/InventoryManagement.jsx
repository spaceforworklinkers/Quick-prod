
import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Save, Trash2, Edit2, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import StockAnalysis from '@/features/legacy-pos/StockAnalysis';
import { useOutlet } from '@/context/OutletContext';

const InventoryManagement = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'pcs',
    current_stock: '',
    min_stock_level: '',
    cost_per_unit: '',
    consumption_rate: ''
  });

  useEffect(() => {
    fetchInventory();
  }, [outletId]);

  const fetchInventory = async () => {
    if(!outletId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', outletId)
        .order('name');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!outletId) return;

    try {
      const payload = {
        restaurant_id: outletId, // ensure tenant association
        name: formData.name,
        unit: formData.unit,
        current_stock: parseFloat(formData.current_stock),
        min_stock_level: parseFloat(formData.min_stock_level),
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        consumption_rate: parseFloat(formData.consumption_rate) || 0
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', editingItem.id)
          .eq('restaurant_id', outletId); // Safety
        if (error) throw error;
        toast({ title: 'Success', description: 'Item updated successfully' });
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Item added successfully' });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', unit: 'pcs', current_stock: '', min_stock_level: '', cost_per_unit: '', consumption_rate: '' });
      fetchInventory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    if(!outletId) return;

    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id).eq('restaurant_id', outletId);
      if (error) throw error;
      fetchInventory();
      toast({ title: 'Deleted', description: 'Item removed from inventory' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      cost_per_unit: item.cost_per_unit,
      consumption_rate: item.consumption_rate || 0
    });
    setIsDialogOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Stock & Inventory</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
                setEditingItem(null);
                setFormData({ name: '', unit: 'pcs', current_stock: '', min_stock_level: '', cost_per_unit: '', consumption_rate: '' });
            }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 text-white hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" /> Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Item Name</Label>
                <Input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Burger Buns"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <Label>Unit</Label>
                   <select 
                      className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                   >
                     <option value="pcs">Pieces (pcs)</option>
                     <option value="kg">Kilograms (kg)</option>
                     <option value="g">Grams (g)</option>
                     <option value="l">Liters (l)</option>
                     <option value="ml">Milliliters (ml)</option>
                     <option value="pkts">Packets (pkts)</option>
                   </select>
                </div>
                <div>
                  <Label>Cost Per Unit (₹)</Label>
                  <Input 
                    type="number" step="0.01"
                    value={formData.cost_per_unit}
                    onChange={e => setFormData({...formData, cost_per_unit: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Stock</Label>
                  <Input 
                    required type="number" step="any"
                    value={formData.current_stock}
                    onChange={e => setFormData({...formData, current_stock: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Min. Alert Level</Label>
                  <Input 
                    required type="number" step="any"
                    value={formData.min_stock_level}
                    onChange={e => setFormData({...formData, min_stock_level: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>
              <div>
                 <Label>Avg. Daily Consumption (Optional)</Label>
                 <Input 
                    type="number" step="any"
                    value={formData.consumption_rate}
                    onChange={e => setFormData({...formData, consumption_rate: e.target.value})}
                    placeholder="Used for days remaining estimation"
                 />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                {editingItem ? 'Update Stock' : 'Add to Inventory'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="inventory">
          <TabsList className="mb-4">
              <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
              <TabsTrigger value="consumption">Stock Consumption Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    />
                </div>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 text-left">Item Name</th>
                        <th className="px-6 py-3 text-left">Current Stock</th>
                        <th className="px-6 py-3 text-left">Unit Cost</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No items found</td></tr>
                    ) : (
                        filteredItems.map((item) => {
                        const isLowStock = item.current_stock <= item.min_stock_level;
                        return (
                            <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{item.current_stock}</span>
                                    <span className="text-gray-500 text-sm">{item.unit}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">₹{item.cost_per_unit}</td>
                            <td className="px-6 py-4">
                                {isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertTriangle className="h-3 w-3" /> Running Low
                                </span>
                                ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    In Stock
                                </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                <Edit2 className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </td>
                            </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
                </div>
            </div>
          </TabsContent>

          <TabsContent value="consumption">
              <StockAnalysis />
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;
