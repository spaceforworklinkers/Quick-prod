
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { ShoppingBag, Plus, Minus, CheckCircle, ArrowRight, X, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useParams } from 'react-router-dom';
import { useOutlet } from '@/context/OutletContext';
import { checkStockAvailability } from '@/lib/stockHelpers';

const GuestOrder = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  const { tableId: paramTableId, token: paramToken } = useParams();
  
  // Support both props (if legacy) and params
  const tableId = paramTableId; 
  const token = paramToken;

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderState, setOrderState] = useState('browsing');
  
  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Guest Details
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // Variants
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);

  // Session
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (!outletId) return;

      try {
          // 1. Fetch Store Settings
          const { data: settings } = await supabase
            .from('store_settings')
            .select('*')
            .eq('restaurant_id', outletId)
            .limit(1)
            .maybeSingle();
          setStoreSettings(settings);

          // 2. Fetch Table
          let tableData = null;
          if (tableId) {
              const { data } = await supabase.from('restaurant_tables')
                .select('*')
                .eq('id', tableId)
                .eq('restaurant_id', outletId)
                .maybeSingle();
              tableData = data;
          } else if (token) {
              const { data } = await supabase.from('restaurant_tables')
                .select('*')
                .eq('qr_token', token)
                .eq('restaurant_id', outletId)
                .maybeSingle();
              tableData = data;
          }

          if (!tableData) {
              console.error("Invalid Table or Token");
              setLoading(false);
              return;
          }
          setTable(tableData);

          // 3. Handle Session
          await handleSession(tableData, settings);

          // 4. Fetch Menu
          const { data: menu } = await supabase.from('menu_items')
            .select('*')
            .eq('restaurant_id', outletId)
            .eq('status', 'active');
            
          if (menu) {
              setMenuItems(menu);
              setCategories(['All', ...new Set(menu.map(i => i.category))]);
          }
      } catch (err) {
          console.error("Init failed", err);
      } finally {
          setLoading(false);
      }
    };
    init();
  }, [token, tableId, outletId]);

  const handleSession = async (tableData, settings) => {
      let currentSession = localStorage.getItem(`qr_session_${tableData.id}`);
      
      if (currentSession) {
          const { data: validSession } = await supabase
            .from('qr_sessions')
            .select('*')
            .eq('token', currentSession)
            .eq('table_id', tableData.id)
            .gt('expires_at', new Date().toISOString())
            .single();
            
          if (!validSession) currentSession = null;
      }

      if (!currentSession) {
          const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const timeoutMins = settings?.qr_ordering_settings?.session_timeout_minutes || 15;
          const expiresAt = new Date(Date.now() + timeoutMins * 60000).toISOString();
          
          const { error } = await supabase.from('qr_sessions').insert({
              table_id: tableData.id,
              token: newToken,
              expires_at: expiresAt
          });
          
          if (!error) {
              localStorage.setItem(`qr_session_${tableData.id}`, newToken);
              currentSession = newToken;
          }
      }
      setSessionToken(currentSession);
  };

  const checkRateLimit = async () => {
     const settings = storeSettings || {};
     const windowMins = settings.qr_ordering_settings?.rate_limit_window_minutes || 10;
     const maxOrders = settings.qr_ordering_settings?.max_orders_per_window || 5;
     
     const startTime = new Date(Date.now() - windowMins * 60000).toISOString();
     
     const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', outletId)
        .eq('table_id', table.id)
        .gte('created_at', startTime);
        
     if (error) {
         console.error("Rate limit check failed", error);
         return true;
     }
        
     const allowed = (count || 0) < maxOrders;
     if (!allowed) {
          toast({ 
              variant: 'destructive', 
              title: "Order Limit Reached", 
              description: `You have reached the limit of ${maxOrders} orders per ${windowMins} minutes. Please wait before ordering again.` 
          });
     }
     return allowed;
  };

  const addToCart = (item, variant = null) => {
    const cartItemId = variant ? `${item.id}-${variant.name}` : item.id;
    const existingItem = cart.find(cartItem => cartItem.cartId === cartItemId);
    const priceToUse = variant ? variant.price : item.price;
    const nameToUse = variant ? `${item.name} (${variant.name})` : item.name;

    // Check stock locally first if available, though robust check is on checkout
    // Ideally we would check 'current_stock' property of item if we fetched inventory, but menu_items usually don't have stock directly.
    
    if (existingItem) {
      setCart(cart.map(cartItem => cartItem.cartId === cartItemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    } else {
      setCart([...cart, { 
          ...item, 
          cartId: cartItemId, 
          name: nameToUse, 
          price: priceToUse, 
          variant_name: variant ? variant.name : null, 
          quantity: 1,
          menu_item_id: item.id // Ensure ID is preserved for stock check
      }]);
    }
    if (variant) { setVariantModalOpen(false); setSelectedItemForVariant(null); }
    
    toast({ title: "Added to Cart", description: `${nameToUse} added.`, duration: 2000 });
    
    if (isSearchOpen) {
        setSearchQuery('');
        setIsSearchOpen(false);
    }
  };
  
  const handleItemClick = (item) => {
      if (item.variants?.length > 0) { setSelectedItemForVariant(item); setVariantModalOpen(true); } 
      else { addToCart(item); }
  };

  const updateQuantity = (cartItemId, change) => {
    setCart(cart.map(item => {
      if (item.cartId === cartItemId) return { ...item, quantity: Math.max(0, item.quantity + change) };
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const placeOrder = async () => {
      if (!outletId) return;
      if (!mobile || mobile.length < 10) {
          toast({ variant: 'destructive', title: "Mobile Required", description: "Please enter a valid 10-digit mobile number." });
          return;
      }
      if (cart.length === 0) return;
      if (!sessionToken) {
           toast({ variant: 'destructive', title: "Session Expired", description: "Please refresh the page to start a new session." });
           return;
      }

      setLoading(true);
      try {
          // Check Stock
          const stockCheck = await checkStockAvailability(cart);
          if (!stockCheck.passed) {
              const missingNames = stockCheck.missingItems.map(i => i.name).join(', ');
              toast({ 
                  variant: 'destructive', 
                  title: "Out of Stock", 
                  description: `Sorry, we are out of stock for: ${missingNames}` 
              });
              setLoading(false);
              return;
          }

          const { data: latestSettings } = await supabase.from('store_settings')
            .select('qr_ordering_settings, gst_mode, gst_percentage')
            .eq('restaurant_id', outletId)
            .limit(1)
            .maybeSingle();

          if (latestSettings) {
             setStoreSettings(prev => ({ 
                 ...prev, 
                 qr_ordering_settings: latestSettings.qr_ordering_settings,
                 gst_mode: latestSettings.gst_mode,
                 gst_percentage: latestSettings.gst_percentage
             }));
          }

          const allowed = await checkRateLimit();
          if (!allowed) {
               setLoading(false);
               return;
          }

          // Customer Upsert
          const { data: existingCust } = await supabase.from('customers')
            .select('id')
            .eq('mobile', mobile)
            .eq('restaurant_id', outletId)
            .maybeSingle();

          if (existingCust) {
              await supabase.from('customers').update({ last_visit: new Date().toISOString(), email: email || undefined }).eq('id', existingCust.id);
          } else {
              await supabase.from('customers').insert({ 
                  restaurant_id: outletId,
                  mobile, 
                  email, 
                  name: name || 'Guest', 
                  total_visits: 1, 
                  total_spent: 0, 
                  last_visit: new Date().toISOString() 
              });
          }

          const subtotalRaw = calculateTotal();
          let tax = 0;
          let finalTotal = subtotalRaw;
          const gstPercent = storeSettings?.gst_percentage || 5;
          const taxRate = gstPercent / 100;
          
          if (storeSettings?.gst_mode === 'exclusive') {
             tax = subtotalRaw * taxRate; 
             finalTotal = subtotalRaw + tax;
          } else {
             // Inclusive
             const baseAmount = subtotalRaw / (1 + taxRate); 
             tax = subtotalRaw - baseAmount;
          }
          
          const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
          
          const requireConfirmation = storeSettings?.qr_ordering_settings?.require_confirmation;
          const initialStatus = requireConfirmation ? 'PENDING' : 'NEW';

          const { data: order, error: orderError } = await supabase.from('orders').insert({
              restaurant_id: outletId,
              order_number: orderNumber,
              order_type: 'Dine-in',
              order_source: 'qr', // Explicitly needed for Kitchen Screen to detect
              table_number: table.name,
              table_id: table.id,
              status: initialStatus,
              payment_method: 'Pending',
              customer_mobile: mobile,
              customer_email: email,
              customer_name: name || 'Guest',
              subtotal: storeSettings?.gst_mode === 'exclusive' ? subtotalRaw : (subtotalRaw - tax),
              tax: tax,
              total: finalTotal,
              people_count: 1,
          }).select().single();

          if (orderError) throw orderError;

          const orderItems = cart.map(item => ({
              order_id: order.id,
              menu_item_id: item.menu_item_id, // Ensure this maps to actual ID
              quantity: item.quantity,
              price: item.price, // Use correct column name 'price'
              notes: '',
              variant_name: item.variant_name
          }));
          
          await supabase.from('order_items').insert(orderItems);
          
          await supabase.from('restaurant_tables')
            .update({ status: 'Occupied', current_occupancy: (table.current_occupancy || 0) + 1 })
            .eq('id', table.id)
            .eq('restaurant_id', outletId);

          setOrderState(requireConfirmation ? 'pending' : 'success');
          setCart([]);
          
      } catch (err) {
          console.error("Order failed", err);
          toast({ variant: 'destructive', title: "Order Failed", description: "Please try again or call a waiter." });
      } finally {
          setLoading(false);
      }
  };

  if (loading && !table) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  if (!table) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center"><h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Table</h1><p className="text-gray-500">Please scan a valid table QR code.</p></div>;

  if (orderState === 'success') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="h-10 w-10 text-green-600" /></div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">Order Sent to Kitchen!</h1>
              <p className="text-green-700 mb-8">Your food is being prepared. Please pay at the counter when you're done.</p>
              <Button onClick={() => setOrderState('browsing')} variant="outline" className="mt-8 border-green-200 text-green-700 hover:bg-green-100">Place Another Order</Button>
          </div>
      );
  }
  
  if (orderState === 'pending') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6"><AlertCircle className="h-10 w-10 text-yellow-600" /></div>
              <h1 className="text-2xl font-bold text-yellow-800 mb-2">Order Awaiting Confirmation</h1>
              <p className="text-yellow-700 mb-8">A staff member will confirm your order shortly. Thank you!</p>
              <Button onClick={() => setOrderState('browsing')} variant="outline" className="mt-8 border-yellow-200 text-yellow-700 hover:bg-yellow-100">Back to Menu</Button>
          </div>
      );
  }

  const filteredItems = menuItems.filter(item => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Helmet><title>{storeSettings?.store_name || 'Menu'} - Guest Ordering</title></Helmet>
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
              {isSearchOpen ? (
                  <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                      <Input 
                        autoFocus
                        placeholder="Search items..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10"
                      />
                      <Button variant="ghost" size="icon" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
                          <X className="h-5 w-5" />
                      </Button>
                  </div>
              ) : (
                <>
                    <div className="flex items-center gap-3">
                        {storeSettings?.logo_url ? <img src={storeSettings.logo_url} alt="Logo" className="h-10 w-10 rounded-full object-cover" /> : null}
                        <div>
                            <h1 className="font-bold text-lg text-gray-900 leading-tight">{storeSettings?.store_name || 'Cafe Menu'}</h1>
                            <p className="text-xs text-gray-500">Table: <span className="font-semibold text-orange-600">{table.name}</span></p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-600" onClick={() => setIsSearchOpen(true)}>
                        <Search className="h-5 w-5" />
                    </Button>
                </>
              )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-orange-600 text-white font-medium' : 'bg-gray-100 text-gray-600'}`}>{cat}</button>
              ))}
          </div>
      </header>

      <div className="p-4 grid grid-cols-1 gap-4">
          {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                  <p>No items found</p>
              </div>
          ) : (
              filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
                    {item.image_url && (
                        <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                             <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                        <div className="flex justify-between items-center mt-3">
                            <span className="font-bold text-gray-900">₹{item.price}</span>
                            <Button size="sm" className="bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 h-8 w-8 rounded-full p-0 flex-shrink-0" onClick={() => handleItemClick(item)}><Plus className="h-5 w-5" /></Button>
                        </div>
                    </div>
                </div>
              ))
          )}
      </div>

      {cart.length > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-20">
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg h-14 rounded-xl flex justify-between items-center px-6" onClick={() => setIsCartOpen(true)}>
                  <div className="flex items-center gap-2"><span className="bg-white text-orange-600 rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">{cart.reduce((a,b) => a + b.quantity, 0)}</span><span>View Order</span></div>
                  <span className="font-bold text-lg">₹{calculateTotal().toFixed(0)}</span>
              </Button>
          </div>
      )}

      <AnimatePresence>
          {isCartOpen && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-30 bg-white flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-orange-600" /> Your Order</h2>
                      <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}><X className="h-6 w-6 text-gray-500" /></Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {cart.map(item => (
                          <div key={item.cartId} className="flex justify-between items-center py-2 border-b border-gray-100">
                              <div><h4 className="font-medium text-gray-900">{item.name}</h4><p className="text-sm text-gray-500">₹{item.price}</p></div>
                              <div className="flex items-center gap-3">
                                  <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 bg-gray-100 rounded text-gray-600"><Minus className="h-4 w-4"/></button>
                                  <span className="font-medium w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 bg-gray-100 rounded text-gray-600"><Plus className="h-4 w-4"/></button>
                              </div>
                          </div>
                      ))}
                      <div className="pt-4 space-y-4">
                          <h3 className="font-semibold text-gray-700 border-t pt-4">Your Details</h3>
                          <div><label className="text-xs text-gray-500 block mb-1">Mobile Number (Required)</label><Input type="tel" placeholder="10-digit mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className="bg-gray-50"/></div>
                          <div><label className="text-xs text-gray-500 block mb-1">Name (Optional)</label><Input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-50"/></div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center mb-4"><span className="text-gray-600">Total Amount</span><span className="text-xl font-bold text-gray-900">₹{calculateTotal().toFixed(0)}</span></div>
                      <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-bold" onClick={placeOrder} disabled={loading}>{loading ? 'Placing Order...' : 'Place Order'} <ArrowRight className="ml-2 h-5 w-5" /></Button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
      
       <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
        <DialogContent className="w-[90%] rounded-xl">
            <DialogHeader><DialogTitle>Select Option</DialogTitle></DialogHeader>
            <div className="grid gap-3 mt-2">
                {selectedItemForVariant?.variants?.map((variant, idx) => (
                    <Button key={idx} variant="outline" className="h-auto py-3 justify-between" onClick={() => addToCart(selectedItemForVariant, variant)}><span className="font-medium">{variant.name}</span><span className="text-orange-600 font-bold">₹{variant.price}</span></Button>
                ))}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestOrder;
