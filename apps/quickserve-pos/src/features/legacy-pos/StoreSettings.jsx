
import React, { useState, useEffect } from 'react';
import { Store, Plus, Trash2, MonitorSmartphone, Users, Calculator, MessageSquare, Sofa, QrCode, Printer, Download, ShieldCheck, Ticket, Calendar, AlertCircle, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import MarketingSettings from './MarketingSettings';
import { useOutlet } from '@/context/OutletContext';

const StoreSettings = () => {
  const { toast } = useToast();
  const { outletId } = useOutlet();

  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    logo_url: '',
    login_background_url: '',
    gst_number: '',
    website: '',
    invoice_footer: 'Thank you for your visit!',
    kitchen_password: 'kitchen_pass',
    gst_mode: 'inclusive',
    gst_percentage: 5.0,
    billing_settings: {
        subtotal_label: 'Subtotal',
        tax_label: 'Tax',
        discount_label: 'Discount',
        total_label: 'Total',
        mode_label: 'Payment Mode'
    }
  });

  const [qrSettings, setQrSettings] = useState({
    require_confirmation: false,
    session_timeout_minutes: 15,
    max_orders_per_window: 5
  });

  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({
    name: '',
    floor_name: 'Ground Floor',
    capacity: 4
  });
  const [loadingTables, setLoadingTables] = useState(false);
  const [printingQr, setPrintingQr] = useState(false);

  const [orderModeConfig, setOrderModeConfig] = useState({
    enabled: false,
    exit_pin: '1234'
  });
  const [showOrderModeConfirm, setShowOrderModeConfirm] = useState(false);
  
  const [whatsappConfig, setWhatsappConfig] = useState(null);
  const [engagementConfig, setEngagementConfig] = useState(null);
  const [repeatVisitConfig, setRepeatVisitConfig] = useState(null);
  const [groupVisitConfig, setGroupVisitConfig] = useState(null);
  const [eventConfig, setEventConfig] = useState(null);

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [newPromo, setNewPromo] = useState({
      code: '',
      type: 'percentage',
      value: '',
      usage_limit: '',
      expiry_date: '',
      status: 'active'
  });

  useEffect(() => {
    if (outletId) {
        fetchSettings();
        fetchTables();
        fetchPromoCodes();
    }
  }, [outletId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('restaurant_id', outletId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettingsId(data.id);
        setFormData({
          store_name: data.store_name || '',
          store_address: data.store_address || '',
          store_phone: data.store_phone || '',
          store_email: data.store_email || '',
          logo_url: data.logo_url || '',
          login_background_url: data.login_background_url || '',
          gst_number: data.gst_number || '',
          website: data.website || '',
          invoice_footer: data.invoice_footer || '',
          kitchen_password: data.kitchen_password || 'kitchen_pass',
          gst_mode: data.gst_mode || 'inclusive',
          gst_percentage: data.gst_percentage !== undefined ? data.gst_percentage : 5.0,
          billing_settings: {
              subtotal_label: data.billing_settings?.subtotal_label || 'Subtotal',
              tax_label: data.billing_settings?.tax_label || 'Tax',
              discount_label: data.billing_settings?.discount_label || 'Discount',
              total_label: data.billing_settings?.total_label || 'Total',
              mode_label: data.billing_settings?.mode_label || 'Payment Mode'
          }
        });
        if (data.qr_ordering_settings) setQrSettings(data.qr_ordering_settings);

        if (data.whatsapp_settings) setWhatsappConfig(data.whatsapp_settings);
        if (data.engagement_settings) setEngagementConfig(data.engagement_settings);
        if (data.repeat_visit_settings) setRepeatVisitConfig(data.repeat_visit_settings);
        if (data.group_visit_settings) setGroupVisitConfig(data.group_visit_settings);
        if (data.event_prompt_settings) setEventConfig(data.event_prompt_settings);
        if (data.order_mode_settings) setOrderModeConfig(data.order_mode_settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  
  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const { data } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', outletId)
        .order('floor_name')
        .order('name');
      setTables(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchPromoCodes = async () => {
      setLoadingPromos(true);
      try {
          const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('restaurant_id', outletId)
            .order('created_at', { ascending: false });
          if(error) throw error;
          
          // Sort: Active (non-expired) first, then expired
          const now = new Date();
          const sorted = (data || []).sort((a, b) => {
            const aExpired = a.expiry_date && new Date(a.expiry_date) <= now;
            const bExpired = b.expiry_date && new Date(b.expiry_date) <= now;
            
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;
            return 0;
          });
          
          setPromoCodes(sorted);
      } catch (e) {
          console.error("Promo fetch error", e);
      } finally {
          setLoadingPromos(false);
      }
  };

  const isPromoExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  const handleAddPromo = async () => {
      try {
          if (!newPromo.code || !newPromo.value) {
              toast({ variant: 'destructive', title: "Missing Fields", description: "Code and Value are required." });
              return;
          }
          if(!outletId) return;
          
          const payload = {
              restaurant_id: outletId,
              code: newPromo.code.toUpperCase(),
              type: newPromo.type,
              value: parseFloat(newPromo.value),
              usage_limit: newPromo.usage_limit ? parseInt(newPromo.usage_limit) : null,
              expiry_date: newPromo.expiry_date || null,
              status: 'active',
              usage_count: editingPromo ? editingPromo.usage_count : 0
          };

          if (editingPromo) {
            const { error } = await supabase.from('promo_codes')
                .update(payload)
                .eq('id', editingPromo.id)
                .eq('restaurant_id', outletId);
            if(error) throw error;
            toast({ title: "Promo Updated", description: `${payload.code} has been updated.` });
          } else {
            const { error } = await supabase.from('promo_codes').insert([payload]);
            if(error) throw error;
            toast({ title: "Promo Created", description: `${payload.code} is now active.` });
          }
          
          setShowAddPromo(false);
          setEditingPromo(null);
          setNewPromo({ code: '', type: 'percentage', value: '', usage_limit: '', expiry_date: '', status: 'active' });
          fetchPromoCodes();
      } catch (e) {
          toast({ variant: 'destructive', title: "Error", description: e.message });
      }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    setNewPromo({
      code: promo.code,
      type: promo.type,
      value: promo.value.toString(),
      usage_limit: promo.usage_limit?.toString() || '',
      expiry_date: promo.expiry_date ? promo.expiry_date.split('T')[0] : '',
      status: promo.status
    });
    setShowAddPromo(true);
  };

  const handleDeletePromo = async (id) => {
      if(!window.confirm("Are you sure you want to delete this promo code? This cannot be undone.")) return;
      if(!outletId) return;
      try {
          const { error } = await supabase.from('promo_codes')
            .delete()
            .eq('id', id)
            .eq('restaurant_id', outletId);
          if(error) throw error;
          toast({ title: "Deleted", description: "Promo code removed." });
          fetchPromoCodes();
      } catch (e) {
          toast({ variant: 'destructive', title: "Error", description: e.message });
      }
  };

  const handleSubmit = async e => {
    e?.preventDefault();
    await saveAllSettings({});
  };

  const saveAllSettings = async (additionalData = {}) => {
    setLoading(true);
    if (!outletId) return; 

    try {
      const payload = {
        restaurant_id: outletId,
        ...formData,
        order_mode_settings: additionalData.order_mode_settings || orderModeConfig,
        qr_ordering_settings: qrSettings,
        whatsapp_settings: additionalData.whatsapp_settings || whatsappConfig,
        engagement_settings: additionalData.engagement_settings || engagementConfig,
        repeat_visit_settings: additionalData.repeat_visit_settings || repeatVisitConfig,
        group_visit_settings: additionalData.group_visit_settings || groupVisitConfig,
        event_prompt_settings: additionalData.event_prompt_settings || eventConfig,
        updated_at: new Date().toISOString()
      };
      if (settingsId) {
        await supabase.from('store_settings')
            .update(payload)
            .eq('id', settingsId)
            .eq('restaurant_id', outletId);
      } else {
        const { data } = await supabase.from('store_settings')
            .insert([payload])
            .select()
            .single();
        setSettingsId(data.id);
      }

      if (additionalData.whatsapp_settings) setWhatsappConfig(additionalData.whatsapp_settings);
      if (additionalData.engagement_settings) setEngagementConfig(additionalData.engagement_settings);
      if (additionalData.repeat_visit_settings) setRepeatVisitConfig(additionalData.repeat_visit_settings);
      if (additionalData.group_visit_settings) setGroupVisitConfig(additionalData.group_visit_settings);
      if (additionalData.event_prompt_settings) setEventConfig(additionalData.event_prompt_settings);
      if (additionalData.order_mode_settings) setOrderModeConfig(additionalData.order_mode_settings);
      toast({ title: 'Settings Saved', description: 'Store configuration updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMarketingUpdate = payload => { saveAllSettings(payload); };
  
  const handleAddTable = async e => {
    e.preventDefault();
    if(!outletId) return;
    try {
      const { error } = await supabase.from('restaurant_tables')
        .insert([{ ...newTable, restaurant_id: outletId }]); // Add tenant ID
      if (error) throw error;
      toast({ title: "Table Added" });
      setNewTable({ ...newTable, name: '' });
      fetchTables();
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: e.message });
    }
  };

  const handleDeleteTable = async id => {
    if (!window.confirm("Delete this table?")) return;
    if (!outletId) return;
    await supabase.from('restaurant_tables')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', outletId);
    fetchTables();
  };

  const enableOrderMode = async () => {
    const newConfig = { ...orderModeConfig, enabled: true };
    setOrderModeConfig(newConfig);
    await saveAllSettings({ order_mode_settings: newConfig });
    setShowOrderModeConfirm(false);
    window.location.reload();
  };

  const getQrDataUrl = tableId => {
    const baseUrl = window.location.origin;
    // Embed outletId in the URL if needed, e.g. /:outletId/order/table/:tableId
    // Or if the order page is generic and looks up table.
    // Assuming table IDs are unique globally (UUIDs), we can lookup tenant from table.
    // But for safety, let's include outletId in the URL path.
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/${outletId}/order/table/${tableId}`)}`;
  };
  const getHighResQrUrl = tableId => {
    const baseUrl = window.location.origin;
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${baseUrl}/${outletId}/order/table/${tableId}`)}`;
  };
  const handlePrintQr = async table => {
    const printWindow = window.open('', '_blank');
    const qrUrl = getHighResQrUrl(table.id);
    const html = `
        <html>
        <head>
            <title>QR Code - ${table.name}</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; }
                .card { border: 2px solid #000; padding: 40px; display: inline-block; border-radius: 20px; }
                .logo { max-height: 60px; margin-bottom: 20px; }
                .table-name { font-size: 48px; font-weight: bold; margin: 10px 0; }
                .instruction { font-size: 18px; color: #555; margin-top: 20px; }
                .qr-img { width: 300px; height: 300px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="card">
                ${formData.logo_url ? `<img src="${formData.logo_url}" class="logo" />` : `<h1>${formData.store_name}</h1>`}
                <div class="table-name">${table.name}</div>
                <img src="${qrUrl}" class="qr-img" />
                <div class="instruction">Scan to order. Please pay at the counter.<br> <span style="font-size:11px; color:#aaa; opacity:0.8;">
    Powered by: Spacelinkers Infotech Private Limited
  </span> </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
    printWindow.document.write(html);
    printWindow.document.close();
  };
  const handleDownloadPdf = () => {
    setPrintingQr(true);
    const doc = new jsPDF();
    let col = 0; let row = 0;
    const cardWidth = 90; const cardHeight = 110; const margin = 10;
    tables.forEach((table, index) => {
      if (index > 0 && index % 4 === 0) {
        doc.addPage();
        col = 0; row = 0;
      }
      const xPos = 15 + col * (cardWidth + margin);
      const yPos = 30 + row * (cardHeight + margin);
      doc.setDrawColor(0);
      doc.rect(xPos, yPos, cardWidth, cardHeight);
      doc.setFontSize(16);
      doc.text(table.name, xPos + cardWidth / 2, yPos + 15, { align: "center" });
      doc.setFontSize(10);
      doc.text("Scan for Menu", xPos + cardWidth / 2, yPos + cardHeight - 10, { align: "center" });
      doc.rect(xPos + 20, yPos + 25, 50, 50);
      doc.setFontSize(8);
      doc.text("QR PLACEHOLDER", xPos + cardWidth / 2, yPos + 50, { align: "center" });
      doc.text(getQrDataUrl(table.id), xPos + cardWidth / 2, yPos + 80, { align: "center", maxWidth: 80 });
      col++;
      if (col > 1) { col = 0; row++; }
    });
    doc.save("table-qrs.pdf");
    setPrintingQr(false);
    toast({ title: "PDF Generated", description: "QR list downloaded." });
  };

  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-orange-600" />
                Settings
                </h2>
            </div>
            <TabsList className="flex flex-row md:flex-col items-stretch h-auto bg-transparent gap-1 p-0 w-full overflow-x-auto md:overflow-visible no-scrollbar">
                <TabsTrigger value="general" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><Store className="h-4 w-4 mr-3" /> General</TabsTrigger>
                <TabsTrigger value="tables" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><Sofa className="h-4 w-4 mr-3" /> Tables & QRs</TabsTrigger>
                <TabsTrigger value="qr_settings" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><QrCode className="h-4 w-4 mr-3" /> QR Rules</TabsTrigger>
                <TabsTrigger value="billing" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><Calculator className="h-4 w-4 mr-3" /> Billing</TabsTrigger>
                <TabsTrigger value="promos" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><Ticket className="h-4 w-4 mr-3" /> Promo Codes</TabsTrigger>
                <TabsTrigger value="access" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><Users className="h-4 w-4 mr-3" /> Access</TabsTrigger>
                <TabsTrigger value="marketing" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><MessageSquare className="h-4 w-4 mr-3" /> Marketing</TabsTrigger>
                <TabsTrigger value="order_mode" className="justify-start px-4 py-3 data-[state=active]:bg-orange-50 data-[state=active]:border-orange-500 rounded-none border-l-4 border-transparent"><MonitorSmartphone className="h-4 w-4 mr-3" /> Order Mode</TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 mt-0">
            <TabsContent value="general" className="mt-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">General Information</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Cafe Name</Label><Input value={formData.store_name} onChange={e => setFormData({ ...formData, store_name: e.target.value })} /></div>
                        <div><Label>Address</Label><Input value={formData.store_address} onChange={e => setFormData({ ...formData, store_address: e.target.value })} /></div>
                        <div><Label>Phone</Label><Input value={formData.store_phone} onChange={e => setFormData({ ...formData, store_phone: e.target.value })} /></div>
                        <div><Label>Email</Label><Input value={formData.store_email} onChange={e => setFormData({ ...formData, store_email: e.target.value })} /></div>
                        <div><Label>Logo URL</Label><Input value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} /></div>
                        <div><Label>Login Background URL</Label><Input value={formData.login_background_url} onChange={e => setFormData({ ...formData, login_background_url: e.target.value })} placeholder="https://..." /></div>
                        
                        <div><Label>Invoice Footer</Label><Input value={formData.invoice_footer} onChange={e => setFormData({ ...formData, invoice_footer: e.target.value })} /></div>
                        <div><Label>Website</Label><Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." /></div>
                        <div><Label>GST Number</Label><Input value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
                    </div>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>Save Settings</Button>
                </form>
            </div>
            </TabsContent>

            <TabsContent value="tables" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Tables & QR Codes</h3>
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={printingQr}>
                            <Download className="h-4 w-4 mr-2" /> Download All PDF
                        </Button>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Add New Table</h4>
                        <form onSubmit={handleAddTable} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div><Label className="text-xs">Floor</Label><Input value={newTable.floor_name} onChange={e => setNewTable({ ...newTable, floor_name: e.target.value })} placeholder="Ground Floor" className="bg-white" /></div>
                            <div><Label className="text-xs">Name</Label><Input value={newTable.name} onChange={e => setNewTable({ ...newTable, name: e.target.value })} placeholder="T1" className="bg-white" /></div>
                            <div><Label className="text-xs">Seats</Label><Input type="number" value={newTable.capacity} onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })} placeholder="4" className="bg-white" /></div>
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Add</Button>
                        </form>
                    </div>

                    <div className="space-y-6">
                         {Object.entries(tables.reduce((acc, table) => { (acc[table.floor_name] = acc[table.floor_name] || []).push(table); return acc; }, {})).map(([floor, floorTables]) => <div key={floor} className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 border-b">{floor}</div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {floorTables.map(table => <div key={table.id} className="border rounded-lg p-4 flex flex-col items-center bg-white hover:shadow-md transition-shadow relative group">
                                                <div className="font-bold text-lg mb-1">{table.name}</div>
                                                <div className="text-xs text-gray-500 mb-3">{table.capacity} Seats</div>
                                                <div className="bg-white p-2 border rounded mb-3"><img src={getQrDataUrl(table.id)} alt={`QR ${table.name}`} className="w-24 h-24 object-contain" /></div>
                                                <div className="flex gap-2 w-full"><Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handlePrintQr(table)}><Printer className="h-3 w-3 mr-1" /> Print</Button></div>
                                                <button onClick={() => handleDeleteTable(table.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                            </div>)}
                                    </div>
                                </div>)}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="qr_settings" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">QR Ordering Configuration</h3>
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
                             <div><h4 className="font-bold text-gray-900">Require Staff Confirmation</h4><p className="text-sm text-gray-600">If enabled, QR orders will need approval before going to the kitchen.</p></div>
                             <Switch checked={qrSettings.require_confirmation} onCheckedChange={checked => setQrSettings({ ...qrSettings, require_confirmation: checked })} className="data-[state=checked]:bg-orange-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Session Timeout (Minutes)</Label><Input type="number" value={qrSettings.session_timeout_minutes} onChange={e => setQrSettings({ ...qrSettings, session_timeout_minutes: parseInt(e.target.value) })} /><p className="text-xs text-gray-500 mt-1">Guest session expires after inactivity.</p></div>
                            <div><Label>Max Orders per Window</Label><Input type="number" value={qrSettings.max_orders_per_window} onChange={e => setQrSettings({ ...qrSettings, max_orders_per_window: parseInt(e.target.value) })} /><p className="text-xs text-gray-500 mt-1">Prevent spam by limiting orders.</p></div>
                        </div>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">Save Rules</Button>
                    </form>
                </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Billing Settings</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="max-w-lg space-y-4">
                             <div>
                                <Label>GST Percentage (%)</Label>
                                <Input type="number" step="0.1" value={formData.gst_percentage} onChange={e => setFormData({ ...formData, gst_percentage: e.target.value })} placeholder="5.0" />
                                <p className="text-xs text-gray-500 mt-1">Applies to all billing calculations.</p>
                             </div>
                            <div className="space-y-3">
                                <Label className="text-base font-medium">GST Calculation Mode</Label>
                                <div className="flex flex-col gap-3">
                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.gst_mode === 'inclusive' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="gst_mode" value="inclusive" checked={formData.gst_mode === 'inclusive'} onChange={e => setFormData({ ...formData, gst_mode: e.target.value })} className="mt-1" />
                                        <div><span className="font-bold text-gray-900 block">GST Inclusive (Recommended)</span><span className="text-sm text-gray-500">Menu prices include GST.</span></div>
                                    </label>
                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.gst_mode === 'exclusive' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="gst_mode" value="exclusive" checked={formData.gst_mode === 'exclusive'} onChange={e => setFormData({ ...formData, gst_mode: e.target.value })} className="mt-1" />
                                        <div><span className="font-bold text-gray-900 block">GST Exclusive</span><span className="text-sm text-gray-500">Tax is added on top.</span></div>
                                    </label>
                                </div>
                            </div>
                         </div>
                         
                         <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-900 mb-3">Bill Display Labels</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Subtotal Label</Label><Input value={formData.billing_settings.subtotal_label} onChange={e => setFormData({ ...formData, billing_settings: {...formData.billing_settings, subtotal_label: e.target.value} })} /></div>
                                <div><Label>Tax Label</Label><Input value={formData.billing_settings.tax_label} onChange={e => setFormData({ ...formData, billing_settings: {...formData.billing_settings, tax_label: e.target.value} })} /></div>
                                <div><Label>Discount Label</Label><Input value={formData.billing_settings.discount_label} onChange={e => setFormData({ ...formData, billing_settings: {...formData.billing_settings, discount_label: e.target.value} })} /></div>
                                <div><Label>Total Label</Label><Input value={formData.billing_settings.total_label} onChange={e => setFormData({ ...formData, billing_settings: {...formData.billing_settings, total_label: e.target.value} })} /></div>
                                <div><Label>Payment Mode Label</Label><Input value={formData.billing_settings.mode_label} onChange={e => setFormData({ ...formData, billing_settings: {...formData.billing_settings, mode_label: e.target.value} })} /></div>
                            </div>
                         </div>

                        <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700">Save Billing</Button>
                    </form>
                 </div>
            </TabsContent>
            
            <TabsContent value="promos" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Ticket className="h-5 w-5" /> Promo Codes</h3>
                        <Button size="sm" onClick={() => { setEditingPromo(null); setNewPromo({ code: '', type: 'percentage', value: '', usage_limit: '', expiry_date: '', status: 'active' }); setShowAddPromo(true); }} className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="h-4 w-4 mr-2" /> Add Code
                        </Button>
                    </div>

                    {loadingPromos ? (
                         <div className="text-center py-8 text-gray-500">Loading codes...</div>
                    ) : (
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Code</th>
                                        <th className="px-4 py-3">Value</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Usage</th>
                                        <th className="px-4 py-3">Expiry</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {promoCodes.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No promo codes active.</td></tr>
                                    ) : (
                                        promoCodes.map((promo) => {
                                          const expired = isPromoExpired(promo.expiry_date);
                                          return (
                                            <tr key={promo.id} className={`hover:bg-gray-50 ${expired ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-4 py-3 font-bold text-gray-800">{promo.code}</td>
                                                <td className="px-4 py-3">
                                                    {promo.type === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {expired ? (
                                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                                        <AlertCircle className="h-3 w-3" /> Expired
                                                      </span>
                                                    ) : (
                                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                        <CheckCircle className="h-3 w-3" /> Active
                                                      </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {promo.usage_count} {promo.usage_limit ? `/ ${promo.usage_limit}` : ''}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {promo.expiry_date ? (
                                                      <span className={expired ? 'text-red-600 font-medium' : ''}>
                                                        {new Date(promo.expiry_date).toLocaleDateString()}
                                                      </span>
                                                    ) : 'No expiry'}
                                                </td>
                                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditPromo(promo)} className="text-blue-500 hover:bg-blue-50 h-8 w-8 p-0">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeletePromo(promo.id)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                          );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="access" className="mt-0">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">Access Control</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                        <div><Label>Kitchen Password</Label><Input type="text" value={formData.kitchen_password} onChange={e => setFormData({ ...formData, kitchen_password: e.target.value })} /></div>
                        <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700">Update Password</Button>
                    </form>
                </div>
            </TabsContent>

             <TabsContent value="order_mode" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-100">
                        <MonitorSmartphone className="h-6 w-6 text-purple-600" />
                        <h3 className="text-lg font-bold text-gray-900">Order Taking Mode</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-5">
                            <h4 className="font-bold text-purple-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Simplify your POS</h4>
                            <p className="text-purple-800/80 text-sm mb-4">Enable Order Mode to restrict this device to only taking orders and payments.</p>
                            {!orderModeConfig.enabled ? <Button onClick={() => setShowOrderModeConfirm(true)} className="bg-purple-600 hover:bg-purple-700 text-white">Enable Order Mode</Button> : <div className="flex items-center gap-2 text-green-600 font-bold bg-white px-3 py-2 rounded border border-green-200 inline-flex"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Mode Active</div>}
                        </div>
                        <div className="max-w-md space-y-4">
                            <div><Label>Exit PIN</Label><Input type="text" value={orderModeConfig.exit_pin} onChange={e => setOrderModeConfig({ ...orderModeConfig, exit_pin: e.target.value })} placeholder="e.g. 1234" maxLength={6} /><p className="text-xs text-gray-500 mt-1">PIN required to exit Order Mode.</p></div>
                            <Button onClick={handleSubmit} variant="outline" className="w-full">Update PIN</Button>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="marketing" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <MarketingSettings 
                      settings={{ 
                        whatsapp_settings: whatsappConfig, 
                        engagement_settings: engagementConfig, 
                        repeat_visit_settings: repeatVisitConfig, 
                        group_visit_settings: groupVisitConfig, 
                        event_prompt_settings: eventConfig, 
                        store_name: formData.store_name 
                      }} 
                      onUpdate={handleMarketingUpdate} 
                   />
                </div>
            </TabsContent>
        </div>

        <Dialog open={showOrderModeConfirm} onOpenChange={setShowOrderModeConfirm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enable Order Mode?</DialogTitle>
                    <DialogDescription>This will hide all admin features. To exit later, you will need to enter the PIN: <strong>{orderModeConfig.exit_pin}</strong></DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowOrderModeConfirm(false)}>Cancel</Button>
                    <Button onClick={enableOrderMode} className="bg-purple-600 hover:bg-purple-700">Enable Now</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={showAddPromo} onOpenChange={(open) => { setShowAddPromo(open); if (!open) { setEditingPromo(null); setNewPromo({ code: '', type: 'percentage', value: '', usage_limit: '', expiry_date: '', status: 'active' }); } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}</DialogTitle>
                    <DialogDescription>Create a code for customers to use at checkout.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Promo Code</Label>
                            <Input placeholder="e.g. SUMMER50" value={newPromo.code} onChange={(e) => setNewPromo({...newPromo, code: e.target.value})} className="uppercase" />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newPromo.type} onValueChange={(val) => setNewPromo({...newPromo, type: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Label>Value</Label>
                         <Input type="number" placeholder={newPromo.type === 'percentage' ? "e.g. 10 (for 10%)" : "e.g. 100 (for ₹100 off)"} value={newPromo.value} onChange={(e) => setNewPromo({...newPromo, value: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Usage Limit (Optional)</Label>
                            <Input type="number" placeholder="Total allowed uses" value={newPromo.usage_limit} onChange={(e) => setNewPromo({...newPromo, usage_limit: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date (Optional)</Label>
                            <div className="relative">
                                <Input type="date" value={newPromo.expiry_date} onChange={(e) => setNewPromo({...newPromo, expiry_date: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddPromo(false)}>Cancel</Button>
                    <Button onClick={handleAddPromo} className="bg-green-600 hover:bg-green-700">
                      {editingPromo ? 'Update Code' : 'Create Code'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </Tabs>
    </div>;
};
export default StoreSettings;
