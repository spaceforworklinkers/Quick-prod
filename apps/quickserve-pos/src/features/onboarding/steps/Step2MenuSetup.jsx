import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingService } from '@/services/OnboardingService';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Step2MenuSetup = ({ outletId, onNext, onBack }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    
    // Form States
    const [catName, setCatName] = useState('');
    const [addingCat, setAddingCat] = useState(false);
    
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');
    const [addingItem, setAddingItem] = useState(false);

    useEffect(() => {
        fetchData();
    }, [outletId]);

    const fetchData = async () => {
        try {
            const { data: cats } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', outletId)
                .order('created_at');
            setCategories(cats || []);
            // set default cat if exists
            if (cats?.length > 0 && !selectedCatId) setSelectedCatId(cats[0].id);

            const { data: menuItems } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', outletId)
                .order('created_at');
            setItems(menuItems || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!catName.trim()) return;
        setAddingCat(true);
        try {
            const { data, error } = await supabase
                .from('menu_categories')
                .insert([{ restaurant_id: outletId, name: catName }])
                .select()
                .single();
                
            if (error) throw error;
            
            setCategories([...categories, data]);
            setCatName('');
            if (!selectedCatId) setSelectedCatId(data.id);
            toast({ title: "Category added" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error adding category", description: error.message });
        } finally {
            setAddingCat(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!itemName || !itemPrice || !selectedCatId) return;
        setAddingItem(true);
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .insert([{ 
                    restaurant_id: outletId, 
                    category_id: selectedCatId,
                    name: itemName,
                    price: parseFloat(itemPrice),
                    is_active: true
                }])
                .select()
                .single();

            if (error) throw error;

            setItems([...items, data]);
            setItemName('');
            setItemPrice('');
            toast({ title: "Item added" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error adding item", description: error.message });
        } finally {
            setAddingItem(false);
        }
    };

    const handleContinue = async () => {
        if (items.length === 0) {
            toast({ variant: "destructive", title: "Menu Empty", description: "Please add at least one menu item." });
            return;
        }
        setLoading(true);
        try {
            await OnboardingService.completeMenuStep(outletId);
            onNext();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full shadow-lg border-t-4 border-t-orange-600">
            <CardHeader>
                <CardTitle>Create Your Menu</CardTitle>
                <CardDescription>
                    Add at least one category and one item to get started. You can add more later.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* 1. Category Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">1. Add Categories</h3>
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <Input 
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            placeholder="Category Name (e.g. Starters)"
                            className="bg-white"
                        />
                        <Button type="submit" disabled={addingCat || !catName.trim()} variant="secondary">
                            {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
                        </Button>
                    </form>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {categories.map(cat => (
                            <span key={cat.id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                                {cat.name}
                            </span>
                        ))}
                         {categories.length === 0 && <span className="text-xs text-gray-400 italic">No categories yet.</span>}
                    </div>
                </div>

                {/* 2. Item Section */}
                <div className={`transition-opacity duration-300 ${categories.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">2. Add Menu Items</h3>
                        <form onSubmit={handleAddItem} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input 
                                    value={itemName} 
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="Item Name (e.g. Paneer Tikka)"
                                    className="bg-white"
                                />
                                <div className="flex gap-2">
                                     <Input 
                                        type="number"
                                        value={itemPrice} 
                                        onChange={(e) => setItemPrice(e.target.value)}
                                        placeholder="Price (₹)"
                                        className="bg-white"
                                    />
                                    <Button type="submit" disabled={addingItem || !itemName || !itemPrice} size="icon" className="shrink-0 bg-orange-600 hover:bg-orange-700">
                                         {addingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Preview */}
                 <div className="border rounded-md max-h-48 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No items added yet.</div>
                    ) : (
                        <div className="divide-y">
                            {items.map(item => (
                                <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-gray-600">₹{item.price}</span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onBack} disabled={loading}>Back</Button>
                    <Button 
                        onClick={handleContinue} 
                        disabled={loading || items.length === 0}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                        Save & Continue
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default Step2MenuSetup;
