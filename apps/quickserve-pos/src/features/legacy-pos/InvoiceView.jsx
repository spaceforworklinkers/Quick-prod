
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BillReceipt from '@/features/legacy-pos/BillReceipt';
import { Loader2, Download, Mail } from 'lucide-react';
import { Helmet } from 'react-helmet';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useOutlet } from '@/context/OutletContext';

const InvoiceView = ({ orderId, autoPrint }) => {
  const { toast } = useToast();
  const { outletId } = useOutlet(); // Use context if needed, mostly for URL consistency
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Order
        // Using 'price' column instead of 'menu_item_price' as per schema
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              price, 
              notes,
              variant_name,
              menu_items (name)
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // Transform data for UI (flatten menu_items.name to menu_item_name)
        const transformedOrder = {
            ...orderData,
            order_items: orderData.order_items.map(item => ({
                ...item,
                menu_item_price: item.price, // Map for compatibility
                menu_item_name: item.menu_items?.name || 'Unknown Item'
            }))
        };
        
        setOrder(transformedOrder);

        // 2. Fetch Settings using the restaurant_id from the order
        if (orderData.restaurant_id) {
            const { data: settingsData } = await supabase
              .from('store_settings')
              .select('*')
              .eq('restaurant_id', orderData.restaurant_id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (settingsData) setSettings(settingsData);
        }

      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Invoice not found or could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  useEffect(() => {
    if (!loading && order && autoPrint) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, order, autoPrint]);

  const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => {
          console.warn("Image load failed for PDF:", error);
          resolve(null);
      };
    });
  };

  const generatePDF = async () => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });

        const centerX = 40;
        let yPos = 10;

        // --- Store Logo ---
        if (settings?.logo_url) {
            try {
                const base64Img = await getBase64ImageFromURL(settings.logo_url);
                if (base64Img) {
                    const props = doc.getImageProperties(base64Img);
                    const imgWidth = 30; // 30mm width
                    const imgHeight = (props.height * imgWidth) / props.width;
                    
                    doc.addImage(base64Img, 'PNG', centerX - (imgWidth/2), yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 5;
                }
            } catch (err) {
                console.warn("Could not add logo to PDF:", err);
            }
        }

        // Store Header Text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(settings?.store_name || 'QuickServe Café', centerX, yPos, { align: 'center' });
        yPos += 5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        if (settings?.store_address) {
            const splitAddress = doc.splitTextToSize(settings.store_address, 70);
            doc.text(splitAddress, centerX, yPos, { align: 'center' });
            yPos += (splitAddress.length * 3) + 2;
        }
        if (settings?.store_phone) {
             doc.text(`Tel: ${settings.store_phone}`, centerX, yPos, { align: 'center' });
             yPos += 4;
        }
        
        doc.text("------------------------------------------", centerX, yPos, { align: 'center' });
        yPos += 5;

        // Order Info
        doc.setFont("helvetica", "bold");
        doc.text(`Order: ${order.order_number}`, 5, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(order.created_at).toLocaleDateString(), 75, yPos, { align: 'right' });
        yPos += 5;
        
        doc.text(`Type: ${order.order_type}`, 5, yPos);
        if (order.table_number) {
            doc.text(`Table: ${order.table_number}`, 75, yPos, { align: 'right' });
        }
        yPos += 5;

        doc.text("------------------------------------------", centerX, yPos, { align: 'center' });
        yPos += 5;

        // Headers
        doc.setFont("helvetica", "bold");
        doc.text("Item", 5, yPos);
        doc.text("Qty", 50, yPos, { align: 'center' });
        doc.text("Amt", 75, yPos, { align: 'right' });
        yPos += 5;

        // Items
        doc.setFont("helvetica", "normal");
        order.order_items?.forEach(item => {
            const name = item.menu_item_name + (item.variant_name ? ` (${item.variant_name})` : '');
            const splitName = doc.splitTextToSize(name, 40);
            doc.text(splitName, 5, yPos);
            doc.text(item.quantity.toString(), 50, yPos, { align: 'center' });
            doc.text((item.menu_item_price * item.quantity).toFixed(2), 75, yPos, { align: 'right' });
            yPos += (splitName.length * 4) + 2;
        });

        doc.text("------------------------------------------", centerX, yPos, { align: 'center' });
        yPos += 5;

        // Totals
        doc.text("Subtotal:", 40, yPos, { align: 'right' });
        doc.text(Number(order.subtotal).toFixed(2), 75, yPos, { align: 'right' });
        yPos += 4;

        if (Number(order.discount_amount) > 0) {
            doc.text("Discount:", 40, yPos, { align: 'right' });
            doc.text(`-${Number(order.discount_amount).toFixed(2)}`, 75, yPos, { align: 'right' });
            yPos += 4;
        }

        doc.text("Tax (5%):", 40, yPos, { align: 'right' });
        doc.text(Number(order.tax).toFixed(2), 75, yPos, { align: 'right' });
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", 40, yPos, { align: 'right' });
        doc.text(`Rs. ${Number(order.total).toFixed(2)}`, 75, yPos, { align: 'right' });
        yPos += 10;

        // Footer
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        
        const footerMsg = settings?.invoice_footer || "Thank you for your visit!";
        const splitFooter = doc.splitTextToSize(footerMsg, 70);
        doc.text(splitFooter, centerX, yPos, { align: 'center' });
        yPos += (splitFooter.length * 3) + 2;

        doc.setFont("helvetica", "italic");
        doc.text("Powered by: QuickServe POS", centerX, yPos, { align: 'center' });

        doc.save(`Invoice_${order.order_number}.pdf`);
        toast({ title: "PDF Downloaded", description: "Invoice saved successfully." });

    } catch (e) {
        console.error("PDF Gen Error", e);
        toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    }
  };

  const handleEmailShare = () => {
      const recipient = order.customer_email || '';
      const subject = "Invoice";
      
      let bodyText = `Hi ${order.customer_name || 'Customer'},\n\n`;
      bodyText += `Here is your order summary for Order #${order.order_number}:\n\n`;
      bodyText += `Total Amount: Rs. ${order.total}\n\n`;
      bodyText += `View Invoice: ${window.location.href}\n\n`;
      bodyText += `Thank you!`;

      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white p-4">
        <div className="text-center max-w-md w-full">
            <div className="text-4xl font-bold text-gray-200 mb-4">404</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
            <p className="text-gray-500 mb-8">{error || "The requested invoice ID does not exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Invoice #{order.order_number}</title>
      </Helmet>
      
      <div className={`min-h-screen bg-gray-100 py-8 ${autoPrint ? 'bg-white p-0 m-0' : ''}`}>
        <div className={`max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden ${autoPrint ? 'shadow-none rounded-none' : ''}`}>
           <BillReceipt order={order} settings={settings} />
           
           {!autoPrint && (
             <div className="bg-gray-50 p-4 border-t border-gray-200 no-print flex flex-col gap-2">
               <button 
                 onClick={() => window.print()}
                 className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors w-full"
               >
                 Print Invoice
               </button>
               <div className="flex gap-2">
                   <Button variant="outline" className="flex-1" onClick={generatePDF}>
                       <Download className="h-4 w-4 mr-2"/> PDF
                   </Button>
                   <Button variant="outline" className="flex-1" onClick={handleEmailShare}>
                       <Mail className="h-4 w-4 mr-2"/> Email
                   </Button>
               </div>
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default InvoiceView;