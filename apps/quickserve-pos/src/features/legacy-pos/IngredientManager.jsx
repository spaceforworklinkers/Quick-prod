
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const IngredientManager = ({ menuItemId, onSaveComplete }) => {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [menuItemId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch available inventory
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('id, name, unit')
        .order('name');
      setStockItems(inventory || []);

      if (menuItemId) {
        // Fetch existing mappings
        const { data: existing } = await supabase
          .from('menu_stock_usage')
          .select('*')
          .eq('menu_item_id', menuItemId);
        setMappings(existing || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setMappings([...mappings, { stock_item_id: '', quantity_used: '', isNew: true }]);
  };

  const handleRemoveRow = async (index, id) => {
    if (id) {
       // Mark for deletion or delete immediately? 
       // For simplicity, we delete immediately from DB if it exists, or just remove from state if new.
       try {
           await supabase.from('menu_stock_usage').delete().eq('id', id);
       } catch (e) {
           console.error("Delete failed", e);
       }
    }
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
  };

  const updateMapping = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const handleSave = async () => {
    try {
      if (!menuItemId) {
          toast({ variant: 'destructive', title: "Error", description: "Save menu item first." });
          return;
      }

      // Filter valid mappings
      const validMappings = mappings.filter(m => m.stock_item_id && m.quantity_used);
      
      for (const m of validMappings) {
        const payload = {
            menu_item_id: menuItemId,
            stock_item_id: m.stock_item_id,
            quantity_used: parseFloat(m.quantity_used)
        };

        if (m.id && !m.isNew) {
            await supabase.from('menu_stock_usage').update(payload).eq('id', m.id);
        } else {
            await supabase.from('menu_stock_usage').insert(payload);
        }
      }

      toast({ title: "Saved", description: "Ingredients updated." });
      if (onSaveComplete) onSaveComplete();
      fetchData(); // Refresh
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: e.message });
    }
  };

  if (loading) return <div className="text-xs text-gray-500">Loading ingredients...</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm flex items-center gap-2">
            Ingredients / Stock Usage 
            <span className="text-[10px] text-gray-500 font-normal">(Deducted per unit sold)</span>
        </h3>
        <Button type="button" size="sm" variant="outline" onClick={handleAddRow} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Ingredient
        </Button>
      </div>

      <div className="space-y-2">
        {mappings.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-400 italic bg-white rounded border border-dashed">
                No ingredients mapped yet.
            </div>
        )}
        {mappings.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center">
             <div className="flex-1">
                 <select 
                    className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors"
                    value={row.stock_item_id}
                    onChange={(e) => updateMapping(idx, 'stock_item_id', e.target.value)}
                 >
                    <option value="" disabled>Select Stock Item</option>
                    {stockItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                 </select>
             </div>
             <div className="w-24">
                 <Input 
                    type="number" 
                    placeholder="Qty" 
                    step="any"
                    className="h-9"
                    value={row.quantity_used}
                    onChange={(e) => updateMapping(idx, 'quantity_used', e.target.value)}
                 />
             </div>
             <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => handleRemoveRow(idx, row.id)}>
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        ))}
      </div>
      
      {mappings.length > 0 && (
          <Button type="button" onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
              <Save className="h-3 w-3 mr-2" /> Save Ingredients
          </Button>
      )}
    </div>
  );
};

export default IngredientManager;
