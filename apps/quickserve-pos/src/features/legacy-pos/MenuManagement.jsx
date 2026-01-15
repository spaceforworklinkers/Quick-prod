
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useMenu } from '@/hooks/useOutletData';
import { useOutlet } from '@/context/OutletContext';
import IngredientManager from '@/features/legacy-pos/IngredientManager';

const MenuManagement = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  
  // Use the new hook for fetching
  const { items: menuItems, loading, refresh } = useMenu();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add/Edit Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost_price: '',
    description: '',
    image_url: '',
    status: 'active',
    hasVariants: false,
    variants: []
  });

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: '' }]
    });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${outletId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu_items')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('menu_items').getPublicUrl(fileName);
      if (data && data.publicUrl) {
          setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
          toast({ title: 'Image Uploaded', description: 'Image successfully attached.' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outletId) return;

    try {
      const itemData = {
        restaurant_id: outletId, // CRITICAL: Inject Tenant ID
        name: formData.name,
        category: formData.category || 'General', // Default if empty
        description: formData.description,
        image_url: formData.image_url,
        status: formData.status,
        price: formData.hasVariants ? 0 : (parseFloat(formData.price) || 0),
        cost_price: parseFloat(formData.cost_price) || 0,
        // For now storing variants in JSONB or just omitting if schema doesn't support array.
        // Schema `menu_items` doesn't strictly have `variants` column in my previous view?
        // Let's assume we might need to add it or it's handled. checking schema...
        // Schema has NO `variants` column. I must check schema or add it.
        // PROVISIONAL: I will omit variants logic storage for now to prevent crash
        // OR add `variants` JSONB to schema.
        // Assuming strict schema: We need to add `variants` column.
      };
      
      // Temporary: Handle variants if schema allows. If not, this might fail unless I add the column.
      // I'll add the column in a migration step if needed.

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .eq('restaurant_id', outletId); // Safety check

        if (error) throw error;

        toast({ title: 'Success', description: 'Menu item updated successfully' });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;

        toast({ title: 'Success', description: 'Menu item added successfully' });
      }
      
      setIsAddDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', category: '', price: '', cost_price: '', description: '', image_url: '', status: 'active', hasVariants: false, variants: [] });
      refresh(); // Use hook refresh
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Variants not fully supported in base schema yet, assuming empty array or handling if flexible
    const variants = []; 
    setFormData({
      name: item.name,
      category: item.category || '', // Mapping category_id to name might be tricky if normalized
      price: item.price.toString(),
      cost_price: item.cost_price?.toString() || '0',
      description: item.description || '',
      image_url: item.image_url || '',
      status: item.status,
      hasVariants: variants.length > 0,
      variants: variants
    });
    setIsAddDialogOpen(true);
  };

  // Initiate Delete Flow
  const handleRequestDelete = (item) => {
      setItemToDelete(item);
      setDeleteDialogOpen(true);
  };

  // Confirm Delete (Soft Delete)
  const confirmDelete = async () => {
    if (!itemToDelete || !outletId) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ status: 'deleted' })
        .eq('id', itemToDelete.id)
        .eq('restaurant_id', outletId);

      if (error) throw error;
      
      toast({ title: 'Deleted', description: 'Menu item moved to trash.' });
      refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: "Could not delete item. It might be linked to orders." 
      });
    } finally {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }
  };

  const filteredItems = menuItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ name: '', category: '', price: '', cost_price: '', description: '', image_url: '', status: 'active', hasVariants: false, variants: [] });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Cappuccino" className="mt-2" />
              </div>
              
              {/* NOTE: We aren't fully using normalized categories yet, just text for speed */}
              <div>
                <Label>Category *</Label>
                <Input required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Coffee, Snacks" className="mt-2" />
              </div>
              
              <div>
                <Label>Item Image</Label>
                <div className="flex gap-2 mt-2">
                    <Input 
                        value={formData.image_url} 
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} 
                        placeholder="Image URL (or upload below)" 
                    />
                    {formData.image_url && (
                        <div className="w-10 h-10 relative rounded overflow-hidden border">
                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
                <div className="mt-2">
                    <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200 w-full justify-center">
                        <Upload className="h-4 w-4" /> 
                        {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                    </Label>
                    <input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                    />
                </div>
              </div>

              {editingItem && (
                 <IngredientManager menuItemId={editingItem.id} />
              )}
              {!editingItem && (
                 <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                    ℹ️ Save the item first to add ingredients/stock mappings.
                 </div>
              )}

             {/* Variant logic hidden until schema update */}
              <div className="hidden">
                 <input type="checkbox" id="hasVariants" checked={formData.hasVariants} onChange={(e) => setFormData({...formData, hasVariants: e.target.checked})} />
              </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                <Label>Selling Price (₹) *</Label>
                <Input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g., 120" className="mt-2" />
                </div>
             </div>
              <div>
                  <Label>Cost Price (₹)</Label>
                  <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })} placeholder="e.g., 40" className="mt-2" />
               </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the item" className="mt-2" rows={3} />
              </div>
              <div>
                <Label>Status *</Label>
                <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">{editingItem ? 'Update Item' : 'Add Item'}</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input type="text" placeholder="Search menu items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading menu items...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No menu items found</td></tr>
              ) : (
                filteredItems.map((item, index) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-gray-100 shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className="font-medium text-gray-900">{item.name}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">{item.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-gray-900">₹{parseFloat(item.price).toFixed(2)}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRequestDelete(item)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" /> Confirm Deletion
                  </DialogTitle>
                  <DialogDescription>
                      Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                      <br/>
                      This item will be hidden from the menu.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
