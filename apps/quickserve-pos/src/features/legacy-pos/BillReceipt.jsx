
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const FOOTER_TEMPLATES = [
  { id: 'option1', text: "Thank you for visiting! We hope to serve you again." },
  { id: 'option2', text: "We hope you enjoyed your meal! Have a great day." },
  { id: 'option3', text: "Follow us on social media for daily specials!" },
  { id: 'option4', text: "Your satisfaction is our priority. Let us know how we did!" },
  { id: 'option5', text: "Made with love, served with a smile." },
  { id: 'option6', text: "Tag us in your photos to get featured!" },
  { id: 'option7', text: "Ask our staff about our loyalty program!" }
];

const BillReceipt = ({ order, settings, calculatedTotals = null }) => {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    if (order?.customer_mobile && settings?.repeat_visit_settings?.enabled) {
        const fetchVisits = async () => {
            const { data } = await supabase
                .from('customers')
                .select('total_visits')
                .eq('mobile', order.customer_mobile)
                .maybeSingle();
            if (data) setVisitCount(data.total_visits);
        };
        fetchVisits();
    }
  }, [order?.customer_mobile, settings?.repeat_visit_settings?.enabled]);

  if (!order) return null;

  // Values
  const subtotal = calculatedTotals ? calculatedTotals.subtotal : (order.subtotal || 0);
  const discountAmount = calculatedTotals ? calculatedTotals.discountAmount : (order.discount_amount || 0);
  const tax = calculatedTotals ? calculatedTotals.tax : (order.tax || 0);
  const total = calculatedTotals ? calculatedTotals.total : (order.total || 0);
  const cgst = calculatedTotals ? calculatedTotals.cgst : (order.cgst || 0);
  const sgst = calculatedTotals ? calculatedTotals.sgst : (order.sgst || 0);
  
  // Settings & Labels
  const gstPercent = settings?.gst_percentage !== undefined ? settings.gst_percentage : 5;
  const labels = settings?.billing_settings || {};
  const subtotalLabel = labels.subtotal_label || 'Subtotal';
  const taxLabel = labels.tax_label || 'Tax';
  const discountLabel = labels.discount_label || 'Discount';
  const totalLabel = labels.total_label || 'Total';
  const modeLabel = labels.mode_label || 'Mode';
  
  // Promo code display
  const promoCode = calculatedTotals ? calculatedTotals.promoCode : order.promo_code;

  // --- Engagement Helpers ---
  const getEngagementMessage = () => {
      const config = settings?.engagement_settings?.footer_message;
      if (!config || !config.enabled) return null;

      if (config.message_type === 'custom' || config.selected_option === 'custom') {
          return config.custom_text;
      }

      // Handle both new 'selected_template_id' and old 'selected_option'
      const tplId = config.selected_template_id || config.selected_option;
      const found = FOOTER_TEMPLATES.find(t => t.id === tplId);
      return found ? found.text : null;
  };

  const getActionLink = () => {
      const config = settings?.engagement_settings?.action_link;
      if (!config || !config.enabled || !config.url) return null;

      let url = config.url.trim();
      // BUG FIX: Ensure URL is absolute and valid
      if (!url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
      }

      return {
          url: url, 
          label: config.link_type || "Visit Link"
      };
  };

  const getRepeatVisitMessage = () => {
      const config = settings?.repeat_visit_settings;
      if (!config || !config.enabled || !visitCount) return null;
      
      const milestone = config.milestones?.find(m => m.visits === visitCount);
      return milestone ? milestone.message : null;
  };

  const getGroupVisitMessage = () => {
      const config = settings?.group_visit_settings;
      if (!config || !config.enabled) return null;
      return config.message || null;
  };

  const engagementMessage = getEngagementMessage();
  const actionLink = getActionLink();
  const repeatVisitMessage = getRepeatVisitMessage();
  const groupVisitMessage = getGroupVisitMessage();

  return (
    <>
      <style>
        {`
          @media print {
            body {
               background-color: white !important;
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 50%;
              transform: translateX(-50%);
              top: 0;
              width: 80mm; 
              max-width: 80mm; 
              margin: 0 auto;
              padding: 5mm;
              box-shadow: none;
              border: none;
              text-align: center;
              background-color: white !important;
            }
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            #printable-receipt table { width: 100%; border-collapse: collapse; }
            #printable-receipt .text-right { text-align: right !important; }
            #printable-receipt .text-left { text-align: left !important; }
            #printable-receipt .text-center { text-align: center !important; }
            img { max-width: 100% !important; display: block; margin: 0 auto; }
          }
        `}
      </style>
      <div id="printable-receipt" className="bg-white p-6 w-full max-w-md mx-auto h-full overflow-y-auto printable-area font-mono text-sm border-0 sm:border border-gray-100">
        <div className="text-center mb-6 pb-4 border-b border-dashed border-gray-300">
          {settings?.logo_url && (
            <div className="flex justify-center mb-2">
                 <img 
                    src={settings.logo_url} 
                    alt="Store Logo" 
                    className="h-16 w-auto object-contain max-w-[120px]" 
                    crossOrigin="anonymous"
                 />
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-1">{settings?.store_name || 'QuickServe Café'}</h1>
          <p className="text-xs text-gray-500">{settings?.store_address}</p>
          {settings?.store_phone && <p className="text-xs text-gray-500">Tel: {settings.store_phone}</p>}
          {settings?.website && <p className="text-xs text-gray-500">{settings.website}</p>}
          {settings?.gst_number && <p className="text-xs text-gray-600 mt-1 font-bold">GSTIN: {settings.gst_number}</p>}
        </div>

        <div className="flex justify-between text-xs mb-4">
          <div className="space-y-1 text-left">
            <p><span className="text-gray-500">Order:</span> <span className="font-bold">{order.order_number}</span></p>
            <p><span className="text-gray-500">Date:</span> {new Date(order.created_at).toLocaleDateString()}</p>
            {(order.customer_name || order.customer_mobile) && (
              <div className="pt-2">
                {order.customer_name && <p><span className="text-gray-500">Cust:</span> <span className="font-semibold">{order.customer_name}</span></p>}
                {order.customer_mobile && <p><span className="text-gray-500">Ph:</span> {order.customer_mobile}</p>}
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <p><span className="text-gray-500">Type:</span> <span className="font-bold uppercase">{order.order_type || 'Takeaway'}</span></p>
            {order.table_number && <p><span className="text-gray-500">Table:</span> {order.table_number}</p>}
          </div>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-gray-400 text-xs text-gray-600 uppercase">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1 w-8">Qty</th>
              <th className="text-right py-1 w-16">Amt</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {order.order_items?.map((item) => (
              <tr key={item.id} className="border-b border-dashed border-gray-200">
                <td className="py-2 text-left">
                  <div className="font-medium">{item.menu_item_name}</div>
                  {item.variant_name && <div className="text-[10px] text-gray-500">({item.variant_name})</div>}
                  {item.notes && <div className="text-[10px] text-gray-400 italic">*{item.notes}</div>}
                </td>
                <td className="text-center py-2 align-top">{item.quantity}</td>
                <td className="text-right py-2 align-top">{(item.menu_item_price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations */}
        <div className="border-t border-gray-400 pt-2">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{subtotalLabel}</span>
              <span>{Number(subtotal).toFixed(2)}</span>
            </div>
            
            {Number(discountAmount) > 0 && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>{discountLabel} {promoCode ? `(${promoCode})` : ''}</span>
                <span>-{Number(discountAmount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-600">
              <span>{taxLabel} ({gstPercent}%)</span>
              <span>{Number(tax).toFixed(2)}</span>
            </div>
            
            {/* CGST/SGST Breakdown */}
            {(Number(cgst) > 0 || Number(sgst) > 0) && (
              <div className="pl-4 space-y-0.5 text-[10px] text-gray-500">
                <div className="flex justify-between">
                  <span>CGST ({(gstPercent / 2).toFixed(2)}%)</span>
                  <span>{Number(cgst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({(gstPercent / 2).toFixed(2)}%)</span>
                  <span>{Number(sgst).toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t-2 border-dashed border-gray-300 pt-2 mt-2">
              <span>{totalLabel.toUpperCase()}</span>
              <span>₹{Number(total).toFixed(2)}</span>
            </div>
             <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{modeLabel}:</span>
              <span className="uppercase">{order.payment_method || 'PENDING'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-dashed border-gray-200 pt-4">
          
          {/* 1. Milestone Message */}
          {repeatVisitMessage && (
               <p className="mb-2 font-medium text-red-600 italic px-2 border-t border-dashed border-red-100 pt-1">
                 ✨ {repeatVisitMessage}
               </p>
          )}

          {/* 2. Group Visit Prompt */}
          {groupVisitMessage && (
               <p className="mb-2 font-medium text-purple-600 italic px-2">
                 👯 {groupVisitMessage}
               </p>
          )}

          {/* 3. Footer Message (Template/Custom) */}
          {!engagementMessage && (
               <p className="mb-1 font-medium text-gray-600">{settings?.invoice_footer || "Thank you for your visit!"}</p>
          )}
          {engagementMessage && (
               <p className="mb-2 font-medium text-gray-800 text-xs px-2 whitespace-pre-line">{engagementMessage}</p>
          )}
          
          {/* 4. Social / Action Links (Fixed: Direct Anchor Tag, No Router) */}
          {actionLink && (
              <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100">
                  <a 
                    href={actionLink.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block text-blue-600 underline decoration-blue-300 font-bold hover:text-blue-800 text-xs"
                  >
                    {actionLink.label}
                  </a>
              </div>
          )}
          
          <p className="italic mt-3">Powered by: QuickServe POS</p>
        </div>
      </div>
    </>
  );
};

export default BillReceipt;
