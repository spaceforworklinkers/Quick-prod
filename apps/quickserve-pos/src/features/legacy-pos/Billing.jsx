import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, Banknote, CreditCard, Ticket, User, Phone, Mail, MessageCircle, Download, AlertCircle, Lock, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BillReceipt from '@/features/legacy-pos/BillReceipt';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { checkStockAvailability, deductStockForOrder } from '@/lib/stockHelpers';
import { useOutlet } from '@/context/OutletContext';
import { useStoreSettings } from '@/hooks/useOutletData';
import { OrderService } from '@/services/OrderService';

const WHATSAPP_TEMPLATES = [
  { id: 'tpl1', text: "Hi, thanks for visiting {{cafe_name}}. Your bill is {{final_amount}}. View details: {{invoice_url}}" },
  { id: 'tpl2', text: "Here is your invoice from {{cafe_name}}: {{invoice_url}}. Total Amount: {{final_amount}}. Hope to see you again!" },
  { id: 'tpl3', text: "Your order is complete! Total: {{final_amount}}. You saved {{discount}} today! Invoice: {{invoice_url}}" },
  { id: 'tpl4', text: "Thanks for dining at {{cafe_name}}! 🧾 Bill: {{final_amount}}. View PDF: {{invoice_url}}" },
  { id: 'tpl5', text: "Hello from {{cafe_name}}! 👋 Your total bill is {{final_amount}}. Download invoice: {{invoice_url}}" },
  { id: 'tpl6', text: "Payment received of {{final_amount}} at {{cafe_name}}. We hope you enjoyed the food! Invoice: {{invoice_url}}" },
  { id: 'tpl7', text: "Digital Receipt: {{invoice_url}} | Total: {{final_amount}} | {{cafe_name}}" }
];

const Billing = ({ order, setActiveView }) => {
  const { toast } = useToast();
  const { outletId } = useOutlet();
  const { settings: storeSettings, loading: settingsLoading } = useStoreSettings();
  
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [orderDetails, setOrderDetails] = useState(order || null);
  
  const [discountType, setDiscountType] = useState('none');  
  const [discountInput, setDiscountInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paidBy, setPaidBy] = useState('');
  
  const [stockWarning, setStockWarning] = useState({ open: false, missingItems: [], pendingMethod: null });

  const [isLoading, setIsLoading] = useState(true);

  const [isLocked, setIsLocked] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5.0);
  const [gstMode, setGstMode] = useState('inclusive');
  
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    if (order && outletId) {
      setCustomerName(order.customer_name || '');
      setCustomerMobile(order.customer_mobile || '');
      setCustomerEmail(order.customer_email || '');
      
      const loadData = async () => {
        setIsLoading(true);
        await fetchOrderDetails();
        setIsLoading(false);
      };
      
      loadData();
    }
  }, [order, outletId]);
  
  useEffect(() => {
      if (storeSettings) {
          if (storeSettings.gst_percentage !== undefined) setGstPercentage(parseFloat(storeSettings.gst_percentage));
          if (storeSettings.gst_mode) setGstMode(storeSettings.gst_mode);
      }
  }, [storeSettings]);
  
  useEffect(() => {
     if (customerMobile && outletId) {
         const fetchVisits = async () => {
             const { data } = await supabase.from('customers')
                .select('total_visits')
                .eq('mobile', customerMobile)
                .eq('restaurant_id', outletId)
                .maybeSingle();
             if (data) setVisitCount(data.total_visits);
         };
         fetchVisits();
     }
  }, [customerMobile, outletId]);

  const fetchOrderDetails = async () => {
    if (!outletId || !order?.id) return;
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items ( name, price )
                )
            `)
            .eq('id', order.id)
            .eq('restaurant_id', outletId)
            .single();
            
        if (error) throw error;
        setOrderDetails(data);
        if (data.status === 'BILLED') {
            setIsLocked(true);
            setPaidBy(data.payment_method);
        }
        
        // Load initial discounts if any
        if (data.discount_type) {
            setDiscountType(data.discount_type);
            setDiscountInput(data.discount_value?.toString() || '');
            if(data.discount_type === 'promo') {
                setPromoCode(data.promo_code);
                setAppliedPromo({ code: data.promo_code, value: data.discount_value, type: 'flat' });
            }
        }
        
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load order.' });
    }
  };

  const validateAndApplyPromo = async () => {
    if (!promoCode || !outletId) return;
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('restaurant_id', outletId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        toast({ variant: 'destructive', title: 'Invalid Promo', description: 'Code not found or inactive.' });
        setAppliedPromo(null);
        return;
      }
      if (data.expiry_date && new Date(data.expiry_date) <= new Date()) {
        toast({ variant: 'destructive', title: 'Promo Expired', description: 'Expired.' });
        setAppliedPromo(null);
        return;
      }
      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'Limit reached.' });
        return;
      }

      setAppliedPromo(data);
      setDiscountType('promo');
      toast({ title: 'Applied ✓', description: `Promo ${data.code} applied!` });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to validate promo.' });
    }
  };

  const calculateFinalTotals = () => {
    if (!orderDetails) return { subtotal: 0, discountAmount: 0, tax: 0, total: 0 };
    if (isLocked) {
        return {
            subtotal: orderDetails.subtotal,
            discountAmount: orderDetails.discount_amount || 0,
            tax: orderDetails.tax,
            total: orderDetails.total
        };
    }
    const sumItems = orderDetails.order_items?.reduce((sum, item) => sum + (parseFloat(item.menu_item_price || item.price) * item.quantity), 0) || 0;
    
    let discountVal = 0;
    if (discountType === 'percentage') {
      const pct = parseFloat(discountInput) || 0;
      discountVal = (sumItems * pct) / 100;
    } else if (discountType === 'fixed') {
      discountVal = parseFloat(discountInput) || 0;
    } else if (discountType === 'promo' && appliedPromo) {
      if (appliedPromo.type === 'percentage') {
        discountVal = (sumItems * appliedPromo.value) / 100;
      } else {
        discountVal = appliedPromo.value;
      }
    }
    if (discountVal > sumItems) discountVal = sumItems;

    let finalSubtotal = 0, finalTax = 0, finalTotal = 0;
    const rate = gstPercentage;

    if (gstMode === 'exclusive') {
        const base = sumItems;
        const discountedBase = base - discountVal;
        const gst = (discountedBase * rate) / 100;
        finalSubtotal = base; finalTax = gst; finalTotal = discountedBase + gst;
    } else {
        const totalBeforeDiscount = sumItems;
        const discountedTotal = totalBeforeDiscount - discountVal;
        const gst = (discountedTotal * rate) / (100 + rate);
        finalSubtotal = discountedTotal - gst; finalTax = gst; finalTotal = discountedTotal;
    }
    return { subtotal: finalSubtotal, discountAmount: discountVal, tax: finalTax, total: finalTotal };
  };

  const { subtotal, discountAmount, tax, total } = calculateFinalTotals();
  const totalsForReceipt = { subtotal, discountAmount, tax, total, promoCode: isLocked ? orderDetails?.promo_code : appliedPromo?.code };

  const handlePaymentInitiate = async (method) => {
    if (!orderDetails) return;
    if (orderDetails.order_items && orderDetails.order_items.length > 0) {
        if (navigator.onLine) {
            const stockCheck = await checkStockAvailability(orderDetails.order_items);
            if (!stockCheck.passed) {
                setStockWarning({ open: true, missingItems: stockCheck.missingItems, pendingMethod: method });
                return;
            }
        }
    }
    handlePaymentExecution(method);
  };

  const handlePaymentExecution = async (method, isOverride = false) => {
    if (!orderDetails || !outletId) return;

    try {
      const paymentData = {
          method,
          discountType,
          discountValue: discountType === 'promo' ? appliedPromo?.value : (parseFloat(discountInput) || 0),
          discountAmount,
          promoCode: appliedPromo?.code || null,
          appliedPromoId: appliedPromo?.id || null,
          subtotal,
          total,
          tax
      };
      
      const context = {
          customer: {
              name: customerName,
              mobile: customerMobile,
              email: customerEmail
          },
          tableId: orderDetails.table_id,
          peopleCount: orderDetails.people_count,
          items: orderDetails.order_items
      };

      await OrderService.completeOrder(orderDetails.id, paymentData, context, outletId);

      setPaidBy(method);
      setIsLocked(true);
      setOrderDetails(prev => ({ 
          ...prev, 
          status: 'BILLED', 
          payment_method: method,
          total: total, 
          tax: tax, 
          subtotal: subtotal 
      }));
      setStockWarning({ open: false, missingItems: [], pendingMethod: null });
      setShowSuccessDialog(true);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const getInvoiceLink = () => `${window.location.origin}/${outletId}/invoice/${orderDetails.id}`;

  const handleShareWhatsApp = () => {
    if (!customerMobile) { toast({ variant: 'destructive', title: 'No Mobile', description: 'Please enter customer mobile number.' }); return; }
    const storeName = storeSettings?.store_name || 'Cafe';
    const invoiceUrl = getInvoiceLink();
    let text = `Thank you for dining at ${storeName}!\n\nYour bill total is Rs. ${total.toFixed(2)}.\nInvoice: ${invoiceUrl}`;
    const waSettings = storeSettings?.whatsapp_settings;
    if (waSettings?.enabled) {
        let rawTemplate = "";
        if (waSettings.message_type === 'custom') { rawTemplate = waSettings.custom_text || text; } 
        else {
            const tplId = waSettings.selected_template_id || 'tpl1';
            const found = WHATSAPP_TEMPLATES.find(t => t.id === tplId);
            rawTemplate = found ? found.text : text;
        }
        text = rawTemplate.replace(/{{cafe_name}}/g, storeName).replace(/{{subtotal}}/g, subtotal.toFixed(2)).replace(/{{discount}}/g, discountAmount.toFixed(2)).replace(/{{final_amount}}/g, total.toFixed(2)).replace(/{{invoice_url}}/g, invoiceUrl);
    }
    window.open(`https://wa.me/91${customerMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
     if (!customerEmail) { toast({ variant: 'destructive', title: 'No Email', description: 'Enter email.' }); return; }
     const storeName = storeSettings?.store_name || 'Cafe';
     const invoiceUrl = getInvoiceLink();
     const subject = `Invoice from ${storeName}`;
     const body = `Invoice: ${invoiceUrl}`;
     window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handlePrintWindow = () => {
      const printUrl = `/${outletId}/invoice/${orderDetails.id}/print`;
      window.open(printUrl, '_blank', 'width=800,height=800');
  };

  const closeDialogAndRedirect = () => { setShowSuccessDialog(false); setActiveView('dashboard'); };

  if (isLoading || !orderDetails) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;

  const orderForReceipt = {
      ...orderDetails,
      customer_name: customerName,
      customer_mobile: customerMobile,
      order_items: orderDetails.order_items.map(item => ({ ...item, menu_item_name: item.menu_items?.name || 'Unknown' }))
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
       <div className="mb-6 flex items-center gap-4 no-print">
         <Button variant="ghost" size="icon" onClick={() => setActiveView('active-orders')}><ArrowLeft className="h-5 w-5" /></Button>
         <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Billing & Invoice {isLocked && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1"><Lock className="h-3 w-3"/> Finalized</span>}</h2>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 printable-area overflow-hidden relative group">
                <BillReceipt order={orderForReceipt} settings={storeSettings} calculatedTotals={totalsForReceipt} />
                {isLocked && ( <div className="absolute top-4 right-4 no-print opacity-0 group-hover:opacity-100 transition-opacity"><Button size="sm" variant="outline" onClick={() => window.open(getInvoiceLink(), '_blank')}><ExternalLink className="h-3 w-3 mr-1" /> Open Link</Button></div> )}
            </motion.div>
         </div>
         <div className="lg:col-span-1 no-print space-y-6">
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Customer Details</h3>
                <div className="space-y-4">
                    <div><Label>Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isLocked} /></div>
                    <div><Label>Phone</Label><Input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} disabled={isLocked} /></div>
                    <div><Label>Email</Label><Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={isLocked} /></div>
                </div>
            </div>
             <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Ticket className="h-4 w-4" /> Discounts</h3>
                <Tabs defaultValue="none" onValueChange={(val) => { setDiscountType(val); setAppliedPromo(null); setDiscountInput(''); setPromoCode(''); }}>
                   <TabsList className="grid grid-cols-3 mb-4"><TabsTrigger value="none">None</TabsTrigger><TabsTrigger value="manual">Manual</TabsTrigger><TabsTrigger value="promo">Promo</TabsTrigger></TabsList>
                   <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-2 gap-2"><Button variant={discountType === 'percentage' ? 'default' : 'outline'} onClick={() => setDiscountType('percentage')}>%</Button><Button variant={discountType === 'fixed' ? 'default' : 'outline'} onClick={() => setDiscountType('fixed')}>₹</Button></div>
                      <Input type="number" placeholder="Value" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} />
                   </TabsContent>
                   <TabsContent value="promo" className="space-y-4">
                      <div className="flex gap-2"><Input placeholder="CODE" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} /><Button onClick={validateAndApplyPromo}>Apply</Button></div>
                      {appliedPromo && <p className="text-xs text-green-600">{appliedPromo.code} applied!</p>}
                   </TabsContent>
                </Tabs>
             </div>
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</h3>
                {!isLocked ? ( <div className="space-y-3"><Button className="w-full bg-green-600" onClick={() => handlePaymentInitiate('Cash')}>Cash</Button><Button className="w-full bg-blue-600" onClick={() => handlePaymentInitiate('UPI')}>UPI</Button></div> ) : ( <div className="text-center text-sm text-gray-500">Paid via {orderDetails.payment_method}.</div> )}
                <div className="mt-4 pt-2 border-t"><Button className="w-full" variant="outline" onClick={handlePrintWindow}><Printer className="h-4 w-4 mr-2" /> Print</Button></div>
                {isLocked && <div className="grid grid-cols-2 gap-2 pt-2"><Button variant="outline" size="sm" onClick={handleShareWhatsApp}><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</Button><Button variant="outline" size="sm" onClick={handleShareEmail}><Mail className="h-3 w-3 mr-1" /> Email</Button></div>}
             </div>
         </div>
       </div>
       <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent>
             <DialogHeader><DialogTitle className="text-green-600 flex items-center gap-2"><CheckCircle /> Payment Successful</DialogTitle><DialogDescription>Bill #{orderDetails.order_number} paid.</DialogDescription></DialogHeader>
             <div className="grid grid-cols-2 gap-4 py-4"><Button variant="outline" onClick={handleShareWhatsApp}>WhatsApp</Button><Button variant="outline" onClick={handleShareEmail}>Email</Button></div>
             <DialogFooter><Button onClick={closeDialogAndRedirect} className="w-full bg-orange-600">Close</Button></DialogFooter>
          </DialogContent>
       </Dialog>
       <Dialog open={stockWarning.open} onOpenChange={(open) => !open && setStockWarning({ ...stockWarning, open: false })}>
            <DialogContent className="border-red-500"><DialogHeader><DialogTitle className="text-red-600">Insufficient Stock</DialogTitle><DialogDescription>Proceeding will override stock.</DialogDescription></DialogHeader>
            <div className="bg-red-50 p-2 rounded max-h-[200px] overflow-y-auto">{stockWarning.missingItems.map((item, i) => <div key={i} className="flex justify-between text-sm"><span>{item.name}</span><span className="text-red-600">Req: {item.required}</span></div>)}</div>
            <DialogFooter><Button variant="outline" onClick={() => setStockWarning({ ...stockWarning, open: false })}>Cancel</Button><Button variant="destructive" onClick={() => handlePaymentExecution(stockWarning.pendingMethod, true)}>Proceed Override</Button></DialogFooter>
            </DialogContent>
       </Dialog>
    </div>
  );
};

export default Billing;
