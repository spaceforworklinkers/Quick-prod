
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingBag, Search, X, LayoutGrid, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import TableHeatMap from '@/features/legacy-pos/TableHeatMap';
import { useMenu } from '@/hooks/useOutletData';
import { useOutlet } from '@/context/OutletContext';
import { OrderService } from '@/services/OrderService';

const CreateOrder = ({ setActiveView, draftOrderToEdit, setDraftOrderToEdit }) => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  const searchInputRef = useRef(null);
  const itemsGridRef = useRef(null);
  const cartEndRef = useRef(null);
  
  // Use real data hook
  const { items: menuItems, categories, loading } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Order Details
  const [orderType, setOrderType] = useState('Dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [gstMode, setGstMode] = useState('inclusive');
  const [gstPercentage, setGstPercentage] = useState(5.0);

  // Table Selector State
  const [tableSelectorOpen, setTableSelectorOpen] = useState(false);

  // Quick Search & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  // Variant Selection State
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);

  useEffect(() => {
    fetchStoreSettings();

    // Clean up draft mode on unmount
    return () => {
        if(setDraftOrderToEdit) setDraftOrderToEdit(null);
    };
  }, []);

  useEffect(() => {
    if (draftOrderToEdit) {
        setCart(draftOrderToEdit.order_items.map(item => ({
            id: item.menu_item_id,
            name: item.menu_item_name,
            price: item.menu_item_price,
            quantity: item.quantity,
            notes: item.notes || '',
            variant_name: item.variant_name,
            cartId: item.variant_name ? `${item.menu_item_id}-${item.variant_name}` : item.menu_item_id,
            showNotes: !!item.notes,
            cost_price: item.cost_price || 0
        })));
        setCustomerName(draftOrderToEdit.customer_name || '');
        setCustomerPhone(draftOrderToEdit.customer_mobile || '');
        setCustomerEmail(draftOrderToEdit.customer_email || '');
        setOrderType(draftOrderToEdit.order_type || 'Dine-in');
        setTableNumber(draftOrderToEdit.table_number || '');
        setSelectedTableId(draftOrderToEdit.table_id || null);
        setPeopleCount(draftOrderToEdit.people_count || 1);
    }
  }, [draftOrderToEdit]);

  useEffect(() => {
    if (cart.length > 0 && cartEndRef.current) {
        cartEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cart.length]);

  const fetchStoreSettings = async () => {
    if(!outletId) return;
    const { data } = await supabase
        .from('store_settings')
        .select('billing_settings') // Assuming JSONB structure
        .eq('restaurant_id', outletId)
        .maybeSingle();

    if (data && data.billing_settings) {
       const settings = data.billing_settings;
       if (settings.gst_mode) setGstMode(settings.gst_mode);
       if (settings.gst_percentage !== undefined) setGstPercentage(parseFloat(settings.gst_percentage));
    }
  };

  const filteredItems = menuItems.filter(item => {
    // Note: useMenu returns normalized categories from DB, but for now we might still have string categories in menu_items table logic
    // We assume 'category' field in menu_items is populated (denormalized or join)
    // If not, we might need to adjust. For now assuming 'category' field exists on item object.
    const itemCategory = item.category || 'General';
    const matchesCategory = selectedCategory === 'All' || itemCategory === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || itemCategory.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery) return matchesSearch;
    return matchesCategory;
  });

  // Unique Categories calculation (if useMenu doesn't provide string array)
  // useMenu returns category objects. We need a list of strings if we are filtering by string.
  // We'll augment the categories list from items if needed, or use the category objects.
  // For compatibility with UI: 'All' + string names.
  // Actually useMenu returns `categories` as array of objects {id, name}.
  // We need to map them. However, legacy items might have ad-hoc category strings.
  // Let's deduce categories from items as before to be safe.
  const displayCategories = ['All', ...new Set(menuItems.map(item => item.category || 'General'))];

  useEffect(() => {
    const handleKeyDown = e => {
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && document.activeElement !== searchInputRef.current;
      if (isInputFocused) {
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let itemsPerRow = 2;
        if (window.innerWidth >= 1280) itemsPerRow = 4;else if (window.innerWidth >= 768) itemsPerRow = 3;
        setFocusedItemIndex(prev => {
          let next = prev;
          if (prev === -1 && filteredItems.length > 0) return 0;
          switch (e.key) {
            case 'ArrowRight': next = Math.min(prev + 1, filteredItems.length - 1); break;
            case 'ArrowLeft': next = Math.max(prev - 1, 0); break;
            case 'ArrowDown': next = Math.min(prev + itemsPerRow, filteredItems.length - 1); break;
            case 'ArrowUp': next = Math.max(prev - itemsPerRow, 0); break;
          }
          const el = document.getElementById(`menu-item-${next}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return next;
        });
        return;
      }
      if (e.key === 'Enter') {
        if (focusedItemIndex !== -1 && filteredItems[focusedItemIndex]) {
          e.preventDefault();
          handleItemClick(filteredItems[focusedItemIndex]);
          if (searchQuery) { setSearchQuery(''); if (searchInputRef.current) searchInputRef.current.focus(); }
        } else if (searchQuery && filteredItems.length > 0) {
          e.preventDefault();
          handleItemClick(filteredItems[0]);
          setSearchQuery('');
          if (searchInputRef.current) searchInputRef.current.focus();
        }
        return;
      }
      if (e.key === 'Escape') {
        setFocusedItemIndex(-1); setSearchQuery(''); setIsSearchActive(false);
        if (searchInputRef.current) searchInputRef.current.blur();
        return;
      }
      if (/^[a-zA-Z0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== searchInputRef.current) {
        setIsSearchActive(true);
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, filteredItems, focusedItemIndex]);

  useEffect(() => { setFocusedItemIndex(-1); }, [selectedCategory, searchQuery]);

  const handleItemClick = item => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItemForVariant(item);
      setVariantModalOpen(true);
    } else {
      addToCart(item);
      if (searchQuery) {
          setSearchQuery('');
          if (searchInputRef.current) searchInputRef.current.focus();
      }
    }
  };

  const addToCart = (item, variant = null) => {
    const cartItemId = variant ? `${item.id}-${variant.name}` : item.id;
    const existingItem = cart.find(cartItem => cartItem.cartId === cartItemId);
    const priceToUse = variant ? variant.price : item.price;
    const nameToUse = variant ? `${item.name} (${variant.name})` : item.name;
    if (existingItem) {
      setCart(cart.map(cartItem => cartItem.cartId === cartItemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    } else {
      setCart([...cart, { ...item, cartId: cartItemId, name: nameToUse, price: priceToUse, variant_name: variant ? variant.name : null, quantity: 1, notes: '', showNotes: false }]);
    }
    if (variant) { 
        setVariantModalOpen(false); 
        setSelectedItemForVariant(null);
        if (searchQuery) {
            setSearchQuery('');
            if (searchInputRef.current) searchInputRef.current.focus();
        }
    }
  };

  const updateQuantity = (cartItemId, change) => {
    setCart(cart.map(item => {
      if (item.cartId === cartItemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const toggleNotes = cartItemId => { setCart(cart.map(item => item.cartId === cartItemId ? { ...item, showNotes: !item.showNotes } : item)); };
  const updateNotes = (cartItemId, notes) => { setCart(cart.map(item => item.cartId === cartItemId ? { ...item, notes } : item)); };
  const removeFromCart = cartItemId => { setCart(cart.filter(item => item.cartId !== cartItemId)); };

  const calculateTotals = () => {
    const grossTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = gstPercentage / 100;
    
    let subtotal, tax, total;
    
    if (gstMode === 'exclusive') {
        subtotal = grossTotal;
        tax = subtotal * taxRate;
        total = subtotal + tax; 
    } else {
        subtotal = grossTotal;
        total = grossTotal;
        tax = total - (total / (1 + taxRate));
    }
    
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();
  const generateOrderNumber = () => `ORD${Date.now().toString().slice(-6)}`;
  const validatePhone = phone => /^\d{10}$/.test(phone);
  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const createOrder = async status => {
    if (!outletId) return; 
    if (cart.length === 0) { toast({ variant: 'destructive', title: 'Empty Cart', description: 'Please add items.' }); return; }
    
    if (orderType === 'Dine-in') {
        if (!selectedTableId) { 
            toast({ variant: 'destructive', title: 'Missing Table', description: 'Please select a table for Dine-in orders.' }); 
            return; 
        }
        if (peopleCount < 1) {
            toast({ variant: 'destructive', title: 'Invalid People Count', description: 'People count must be at least 1.' }); 
            return;
        }
        // Table check skipped for offline speed - we trust selection
    }
    
    if (customerPhone && !validatePhone(customerPhone)) { toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Enter 10 digits.' }); return; }
    if (customerEmail && !validateEmail(customerEmail)) { toast({ variant: 'destructive', title: 'Invalid Email', description: 'Enter valid email.' }); return; }

    try {
      // Best-effort Customer Upsert (Fail-safe for offline)
      if (customerPhone) {
          try {
             // If online, try to sync customer immediately. If offline, this throws/fails silently.
             // We don't block order creation for CRM.
             // Ideally we'd queue this too, but for scope we treat it as "Online Enhancement".
             if (navigator.onLine) {
                 const { data: existingCustomer } = await supabase
                    .from('customers')
                    .select('id, total_visits, name')
                    .eq('restaurant_id', outletId)
                    .eq('mobile', customerPhone)
                    .maybeSingle();

                 if (existingCustomer) {
                    await supabase.from('customers').update({ 
                        total_visits: (existingCustomer.total_visits || 0) + 1, 
                        last_visit: new Date().toISOString(), 
                        name: customerName || existingCustomer.name 
                    }).eq('id', existingCustomer.id);
                 } else {
                    await supabase.from('customers').insert({ 
                        restaurant_id: outletId,
                        mobile: customerPhone, 
                        name: customerName, 
                        email: customerEmail, 
                        total_visits: 1, 
                        total_spent: 0, 
                        last_visit: new Date().toISOString() 
                    });
                 }
             }
          } catch (e) { console.warn("Customer sync skipped (Offline/Error)", e); }
      }

      let orderNumber;

      if (draftOrderToEdit) {
          // UPDATE EXISTING DRAFT (Local-First via Service)
          orderNumber = draftOrderToEdit.order_number;
          
          const updates = {
            order_type: orderType, 
            table_number: orderType === 'Dine-in' ? tableNumber : null,
            table_id: orderType === 'Dine-in' ? selectedTableId : null,
            people_count: orderType === 'Dine-in' ? peopleCount : 0,
            customer_name: customerName || null, 
            customer_phone: customerPhone || null,
            status: status, 
            subtotal: subtotal, 
            tax: tax, 
            total: total
            // OrderService automatically sets updated_at
          };
          
          // Map items for Service
          const items = cart.map(item => ({
            menu_item_id: item.id, 
            // We pass name/variant for local display mock even if DB only takes ID
            menu_item_name: item.name, 
            variant_name: item.variant_name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null
          }));
          
          await OrderService.updateOrder(draftOrderToEdit.id, updates, items, outletId);

      } else {
          // CREATE NEW ORDER (Local-First via Service)
          orderNumber = generateOrderNumber();
          
          const orderData = {
            order_number: orderNumber, 
            order_type: orderType, 
            table_number: orderType === 'Dine-in' ? tableNumber : null,
            table_id: orderType === 'Dine-in' ? selectedTableId : null,
            customer_name: customerName || null, 
            customer_phone: customerPhone || null, 
            status: status, 
            subtotal: subtotal, 
            tax: tax, 
            total: total
          };
          
          const items = cart.map(item => ({
            menu_item_id: item.id, 
            menu_item_name: item.name, // Local use
            variant_name: item.variant_name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null
          }));
          
          await OrderService.createOrder(orderData, items, outletId);
      }

      // Update Table Status (Skipped or Online-Only? We skip to keep it simple/safe)
      
      toast({ title: 'Success', description: `Order ${orderNumber} ${draftOrderToEdit ? 'updated' : 'created'}!` });
      setCart([]); setTableNumber(''); setSelectedTableId(null); setPeopleCount(1); setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
      if (setDraftOrderToEdit) setDraftOrderToEdit(null);
      if (status === 'NEW') setActiveView('active-orders');
      if (status === 'DRAFT') setActiveView('dashboard'); 
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handlePhoneChange = e => {
    const value = e.target.value;
    if (value === '' || /^\d{0,10}$/.test(value)) setCustomerPhone(value);
  };

  const handleTableSelect = (table) => {
      setTableNumber(table.table_number || table.name); // Schema: table_number
      setSelectedTableId(table.id);
      setTableSelectorOpen(false);
  };
  
  const handleOrderTypeChange = (type) => {
      setOrderType(type);
      if (type !== 'Dine-in') {
          setTableNumber('');
          setSelectedTableId(null);
          setPeopleCount(0);
      } else {
          setPeopleCount(1);
      }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col relative">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 hidden sm:block">
            {draftOrderToEdit ? `Editing Draft: ${draftOrderToEdit.order_number}` : 'Create Order'}
        </h2>
        <div className={`relative transition-all duration-300 w-full sm:w-auto ${isSearchActive || searchQuery ? 'md:w-72' : 'md:w-56'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            ref={searchInputRef} 
            placeholder="Search items..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            onFocus={() => { setIsSearchActive(true); setFocusedItemIndex(-1); }} 
            onBlur={() => !searchQuery && setIsSearchActive(false)} 
            className="pl-9 pr-8 bg-white border-orange-200 focus:border-orange-500 focus:ring-orange-200 w-full" 
          />
          {searchQuery && (
            <button 
                onClick={() => { setSearchQuery(''); setIsSearchActive(false); if(searchInputRef.current) searchInputRef.current.focus(); }} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Select Variant</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedItemForVariant?.variants?.map((variant, idx) => (
                    <Button 
                        key={idx} 
                        className="h-auto py-4 flex flex-col gap-1 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200" 
                        onClick={() => addToCart(selectedItemForVariant, variant)}
                    >
                        <span className="font-bold text-lg">{variant.name}</span>
                        <span className="text-sm opacity-90 text-orange-600">₹{variant.price}</span>
                    </Button>
                ))}
            </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={tableSelectorOpen} onOpenChange={setTableSelectorOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
             <DialogHeader className="p-6 pb-2">
                 <DialogTitle>Select Table</DialogTitle>
                 <DialogDescription>Select a table for Dine-in orders.</DialogDescription>
             </DialogHeader>
             <div className="flex-1 overflow-hidden p-6 pt-0">
                 <TableHeatMap isSelectionMode={true} onTableSelect={handleTableSelect} />
             </div>
          </DialogContent>
      </Dialog>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden pb-16 lg:pb-0">
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden h-full">
          {!searchQuery && (
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {displayCategories.map(category => (
                    <Button 
                        key={category} 
                        variant={selectedCategory === category ? 'default' : 'outline'} 
                        size="sm" 
                        className={`whitespace-nowrap flex-shrink-0 ${selectedCategory === category ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'text-gray-700'}`} 
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 pb-24 lg:pb-0" ref={itemsGridRef}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {loading ? (
                  <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
              ) : filteredItems.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">No items found</div>
              ) : (
                  filteredItems.map((item, index) => {
                    const isFocused = index === focusedItemIndex;
                    const isSearchResultHighlight = searchQuery && index === 0;

                    return (
                        <motion.div 
                            key={item.id} 
                            id={`menu-item-${index}`} 
                            layout 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ 
                                opacity: 1, 
                                scale: isFocused || isSearchResultHighlight ? 1.02 : 1, 
                                borderColor: isFocused || isSearchResultHighlight ? '#f97316' : '#e5e7eb', 
                                backgroundColor: isFocused || isSearchResultHighlight ? '#fff7ed' : '#ffffff', 
                                borderWidth: isFocused || isSearchResultHighlight ? '2px' : '1px' 
                            }} 
                            className="rounded-xl p-0 shadow-sm border transition-all cursor-pointer flex flex-col justify-between group h-32 hover:shadow-md hover:border-orange-200 relative overflow-hidden bg-white" 
                            onClick={() => handleItemClick(item)}
                        >
                          {item.image_url && (
                             <div className="absolute inset-0 z-0">
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                             </div>
                          )}
                          <div className="p-3 relative z-10 flex flex-col h-full justify-between">
                             <div className="mb-2 overflow-hidden">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{item.name}</h3>
                                {/* <p className="text-[10px] text-gray-500 line-clamp-2">{item.description}</p> */}
                             </div>
                             <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50/50">
                                <span className="text-sm font-bold text-orange-600">{item.variants && item.variants.length > 0 ? 'Select' : `₹${item.price}`}</span>
                                <div className="bg-orange-50 text-orange-600 rounded-full p-1"><Plus className="h-3 w-3" /></div>
                             </div>
                          </div>
                        </motion.div>
                    );
                })
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-[380px] flex-shrink-0 h-full border-l border-gray-200 bg-white flex-col rounded-xl shadow-sm border overflow-hidden">
            <CartContent 
                orderType={orderType}
                handleOrderTypeChange={handleOrderTypeChange}
                tableNumber={tableNumber}
                setTableNumber={setTableNumber}
                peopleCount={peopleCount}
                setPeopleCount={setPeopleCount}
                customerPhone={customerPhone}
                handlePhoneChange={handlePhoneChange}
                setTableSelectorOpen={setTableSelectorOpen}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
                cart={cart}
                updateQuantity={updateQuantity}
                toggleNotes={toggleNotes}
                removeFromCart={removeFromCart}
                updateNotes={updateNotes}
                subtotal={subtotal}
                tax={tax}
                total={total}
                createOrder={createOrder}
                cartEndRef={cartEndRef}
                gstPercentage={gstPercentage}
                isEditMode={!!draftOrderToEdit}
            />
        </div>

        <div className="lg:hidden fixed bottom-4 right-4 left-4 z-50">
           {!isMobileCartOpen ? (
               <Button 
                 onClick={() => setIsMobileCartOpen(true)}
                 className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white shadow-lg rounded-xl flex items-center justify-between px-6"
               >
                  <div className="flex items-center gap-2">
                     <ShoppingBag className="h-5 w-5" />
                     <span className="font-bold">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-lg">₹{total.toFixed(0)}</span>
                     <ChevronUp className="h-5 w-5" />
                  </div>
               </Button>
           ) : (
               <div className="bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col h-[85vh] absolute bottom-[-16px] left-0 right-0 w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
                   <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                       <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-orange-600" /> Current Order</h3>
                       <Button variant="ghost" size="sm" onClick={() => setIsMobileCartOpen(false)}><ChevronDown className="h-6 w-6 text-gray-500" /></Button>
                   </div>
                   <div className="flex-1 overflow-hidden flex flex-col">
                        <CartContent 
                            orderType={orderType}
                            handleOrderTypeChange={handleOrderTypeChange}
                            tableNumber={tableNumber}
                            setTableNumber={setTableNumber}
                            peopleCount={peopleCount}
                            setPeopleCount={setPeopleCount}
                            customerPhone={customerPhone}
                            handlePhoneChange={handlePhoneChange}
                            setTableSelectorOpen={setTableSelectorOpen}
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerEmail={customerEmail}
                            setCustomerEmail={setCustomerEmail}
                            cart={cart}
                            updateQuantity={updateQuantity}
                            toggleNotes={toggleNotes}
                            removeFromCart={removeFromCart}
                            updateNotes={updateNotes}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                            createOrder={createOrder}
                            cartEndRef={cartEndRef}
                            isMobile={true}
                            gstPercentage={gstPercentage}
                            isEditMode={!!draftOrderToEdit}
                        />
                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

const CartContent = ({ 
    orderType, handleOrderTypeChange, tableNumber, setTableNumber, peopleCount, setPeopleCount, 
    customerPhone, handlePhoneChange, setTableSelectorOpen, customerName, setCustomerName, 
    customerEmail, setCustomerEmail, cart, updateQuantity, toggleNotes, removeFromCart, 
    updateNotes, subtotal, tax, total, createOrder, cartEndRef, isMobile, gstPercentage, isEditMode
}) => {
    return (
        <div className="flex flex-col h-full bg-white">
          <div className="p-3 bg-white border-b border-gray-200 space-y-3 flex-shrink-0">
             <div className="grid grid-cols-3 gap-2">
                {['Dine-in', 'Takeaway', 'Delivery'].map(type => (
                    <Button 
                        key={type}
                        variant={orderType === type ? 'default' : 'outline'} 
                        size="sm" 
                        className={`h-9 text-xs px-1 ${orderType === type ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : 'border-gray-300'}`} 
                        onClick={() => handleOrderTypeChange(type)}
                    >
                        {type}
                    </Button>
                ))}
             </div>
             
             <div className="grid grid-cols-2 gap-3 relative">
                 <div className="relative">
                     <Input 
                        placeholder={orderType === 'Dine-in' ? "# Table" : "No Table"} 
                        value={tableNumber} 
                        onChange={e => { if(orderType === 'Dine-in') setTableNumber(e.target.value) }} 
                        className={`h-10 text-sm pr-8 ${orderType !== 'Dine-in' ? 'bg-gray-50 text-gray-400' : 'border-orange-200'}`} 
                        disabled={orderType !== 'Dine-in'}
                        readOnly={orderType === 'Dine-in'}
                     />
                     {orderType === 'Dine-in' && (
                         <button 
                            onClick={() => setTableSelectorOpen(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-orange-100 rounded text-orange-600"
                            title="Select Table"
                         >
                             <LayoutGrid className="h-4 w-4" />
                         </button>
                     )}
                 </div>
                 
                 {orderType === 'Dine-in' ? (
                     <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            type="number" 
                            min="1"
                            placeholder="People" 
                            value={peopleCount} 
                            onChange={e => setPeopleCount(e.target.value)} 
                            className="h-10 text-sm pl-9" 
                        />
                     </div>
                 ) : (
                    <Input placeholder="Mobile No." value={customerPhone} onChange={handlePhoneChange} type="tel" className="h-10 text-sm" />
                 )}
             </div>

             <div className="grid grid-cols-2 gap-3">
                {orderType === 'Dine-in' ? (
                    <Input placeholder="Mobile (Opt)" value={customerPhone} onChange={handlePhoneChange} type="tel" className="h-10 text-sm" />
                ) : (
                    <Input placeholder="Cust Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 text-sm" />
                )}
                {orderType === 'Dine-in' ? (
                     <Input placeholder="Name (Opt)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-10 text-sm" />
                ) : (
                     <Input placeholder="Email (Opt)" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="h-10 text-sm" />
                )}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-0 bg-gray-50/30 scroll-smooth">
             {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                     <ShoppingBag className="h-12 w-12 mb-3 opacity-20" />
                     <p className="text-sm font-medium">Your cart is empty</p>
                     <p className="text-xs text-gray-400 mt-1">Add items to start an order</p>
                 </div>
             ) : (
                 <div className="divide-y divide-gray-100">
                     <AnimatePresence>
                         {cart.map(item => (
                             <motion.div 
                                key={item.cartId} 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }} 
                                className="bg-white p-3 hover:bg-gray-50 transition-colors"
                             >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 pr-3">
                                        <h4 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5 font-mono">₹{item.price ? item.price.toFixed(2) : '0.00'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md shadow-sm h-8">
                                        <Button variant="ghost" size="icon" className="h-full w-8 rounded-l-md hover:bg-gray-100 text-gray-600" onClick={() => updateQuantity(item.cartId, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-full w-8 rounded-r-md hover:bg-gray-100 text-gray-600" onClick={() => updateQuantity(item.cartId, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-2 pl-1">
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-orange-600 hover:text-orange-700 font-medium no-underline flex items-center gap-1" onClick={() => toggleNotes(item.cartId)}>
                                        {item.notes ? 'Edit Note' : '+ Add Note'}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => removeFromCart(item.cartId)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                {item.showNotes && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-2">
                                        <Textarea 
                                            placeholder="Special instructions..." 
                                            value={item.notes} 
                                            onChange={e => updateNotes(item.cartId, e.target.value)} 
                                            className="text-xs min-h-[2.5rem] h-10 resize-none py-2 bg-yellow-50/50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-200 placeholder:text-yellow-700/50 text-yellow-900" 
                                            autoFocus 
                                        />
                                    </motion.div>
                                )}
                             </motion.div>
                         ))}
                     </AnimatePresence>
                     <div ref={cartEndRef} className="h-4" />
                 </div>
             )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200 space-y-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-10">
             <div className="space-y-1">
                 <div className="flex justify-between text-xs text-gray-500">
                     <span>Subtotal</span>
                     <span>₹{subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs text-gray-500">
                     <span>Tax ({gstPercentage}%)</span>
                     <span>₹{tax.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                     <span>Total</span>
                     <span>₹{total.toFixed(0)}</span>
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => createOrder('DRAFT')} 
                    disabled={cart.length === 0} 
                    className="w-full font-medium"
                 >
                     {isEditMode ? 'Update Draft' : 'Draft'}
                 </Button>
                 <Button 
                    size="lg" 
                    onClick={() => createOrder('NEW')} 
                    disabled={cart.length === 0} 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md hover:shadow-lg transition-all"
                 >
                     Send KOT
                 </Button>
             </div>
          </div>
        </div>
    );
};

export default CreateOrder;
