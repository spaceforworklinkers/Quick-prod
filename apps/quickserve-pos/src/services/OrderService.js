import { dbOperations } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Helper to remove local-only fields before syncing
const cleanForSync = (obj) => {
    // keys to exclude
    const { is_synced, menu_items, order_items, ...rest } = obj; 
    return rest;
};

// Helper to clean items
const cleanItemsForSync = (items) => {
    return items.map(item => {
        const { menu_items, menu_item_name, name, ...rest } = item;
        return rest;
    });
};

export const OrderService = {
    /**
     * Creates an order locally and queues for sync.
     */
    async createOrder(orderData, items, outletId) {
        if (!outletId) throw new Error("Outlet ID required");

        const orderId = crypto.randomUUID();
        
        const newOrder = {
          status: 'NEW',
          ...orderData,
          id: orderId,
          restaurant_id: outletId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_synced: false 
        };
        
        const newItems = items.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            order_id: orderId,
            restaurant_id: outletId
        }));
        
        const orderForDisplay = { 
            ...newOrder, 
            order_items: newItems.map(i => ({
                ...i,
                menu_items: { name: i.name || i.menu_item_name || 'Unknown' } 
            }))
        };

        await dbOperations.put('orders', orderForDisplay);
        
        await dbOperations.put('pending_orders', {
            type: 'CREATE_ORDER',
            payload: { order: newOrder, items: newItems },
            retries: 0,
            timestamp: Date.now()
        });

        this.processQueue();
        
        return orderForDisplay;
    },

    /**
     * Updates an order locally and queues for sync.
     */
    async updateOrder(orderId, updates, items = null, outletId) {
        const existing = await dbOperations.get('orders', orderId);
        if (!existing) throw new Error("Order not found locally");
         
        const updatedOrder = { ...existing, ...updates, updated_at: new Date().toISOString(), is_synced: false };
         
        if (items) {
             updatedOrder.order_items = items.map(i => ({ ...i, menu_items: { name: i.name || i.menu_item_name || 'Unknown' } }));
        }
         
        await dbOperations.put('orders', updatedOrder);
        
        if (items) {
             await dbOperations.put('pending_orders', {
                 type: 'UPDATE_ORDER_FULL',
                 payload: { orderId, updates, items },
                 timestamp: Date.now()
             });
        } else {
             await dbOperations.put('pending_orders', {
                 type: 'UPDATE_ORDER',
                 payload: { orderId, updates },
                 timestamp: Date.now()
             });
        }
         
        this.processQueue();
        return updatedOrder;
    },
    
    /**
     * Mark order as completed/billed locally, then sync.
     */
    async completeOrder(orderId, paymentData, context, outletId) {
        const updates = {
           status: 'BILLED',
           payment_method: paymentData.method,
           customer_name: context.customer?.name || null,
           customer_mobile: context.customer?.mobile || null,
           customer_email: context.customer?.email || null,
           discount_type: paymentData.discountType,
           discount_value: paymentData.discountValue,
           discount_amount: paymentData.discountAmount,
           promo_code: paymentData.promoCode,
           subtotal: paymentData.subtotal,
           total: paymentData.total,
           tax: paymentData.tax,
           updated_at: new Date().toISOString()
        };

        const existing = await dbOperations.get('orders', orderId);
        if (existing) {
             const updated = { ...existing, ...updates, is_synced: false };
             await dbOperations.put('orders', updated);
        }
        
        await dbOperations.put('pending_orders', {
             type: 'COMPLETE_ORDER',
             payload: { orderId, paymentData, context, outletId, updates },
             timestamp: Date.now()
        });
        
        this.processQueue();
    },

    /**
     * Update Table Status (Local + Sync)
     */
    async updateTable(tableId, updates, outletId) {
         const existing = await dbOperations.get('restaurant_tables', tableId);
         if (existing) {
             await dbOperations.put('restaurant_tables', { ...existing, ...updates });
         }
         
         await dbOperations.put('pending_orders', {
             type: 'UPDATE_TABLE',
             payload: { tableId, updates },
             timestamp: Date.now()
         });
         
         this.processQueue();
    },

    /**
     * Process the Sync Queue
     */
    async processQueue() {
        if (!navigator.onLine) return;

        const pending = await dbOperations.getAll('pending_orders');
        if (!pending.length) return;
        
        pending.sort((a,b) => a.timestamp - b.timestamp);

        for (const job of pending) {
            try {
                if (job.type === 'CREATE_ORDER') {
                    const { order, items } = job.payload;
                    
                    // Use ACID Transaction: submit_order
                    const { data, error } = await supabase.rpc('submit_order', {
                        p_order: cleanForSync(order),
                        p_items: cleanItemsForSync(items)
                    });
                    
                    if (error) throw error;
                    if (data && !data.success) throw new Error(data.error || 'Transaction failed');
                    
                } else if (job.type === 'UPDATE_ORDER') {
                    const { orderId, updates } = job.payload;
                    const { error } = await supabase.from('orders').update(cleanForSync(updates)).eq('id', orderId);
                    if (error) throw error;
                    
                } else if (job.type === 'UPDATE_TABLE') {
                    const { tableId, updates } = job.payload;
                    const { error } = await supabase.from('restaurant_tables').update(updates).eq('id', tableId);
                    if (error) throw error;

                } else if (job.type === 'UPDATE_ORDER_FULL') {
                    const { orderId, updates, items } = job.payload;
                    const { error: uErr } = await supabase.from('orders').update(cleanForSync(updates)).eq('id', orderId);
                    if(uErr) throw uErr;
                    const { error: dErr } = await supabase.from('order_items').delete().eq('order_id', orderId);
                    if(dErr) throw dErr;
                    const { error: iErr } = await supabase.from('order_items').insert(cleanItemsForSync(items));
                    if(iErr) throw iErr;
                    
                } else if (job.type === 'COMPLETE_ORDER') {
                    const { orderId, outletId, updates, context, paymentData } = job.payload;
                    const { appliedPromoId } = paymentData;
                    
                    const { error } = await supabase.from('orders').update(cleanForSync(updates)).eq('id', orderId);
                    if (error) throw error;
                    
                    const { deductStockForOrder } = await import('@/lib/stockHelpers'); 
                    if (context.items && context.items.length > 0) {
                        try { await deductStockForOrder(context.items, orderId, outletId, true); } catch (e) { console.error("Stock Sync Error", e); }
                    }
                    
                    if (appliedPromoId) {
                         const { data: pc } = await supabase.from('promo_codes').select('usage_count').eq('id', appliedPromoId).single();
                         if(pc) { await supabase.from('promo_codes').update({ usage_count: pc.usage_count + 1 }).eq('id', appliedPromoId); }
                    }
                    
                    const today = new Date().toISOString().split('T')[0];
                    const { data: existingSummary } = await supabase.from('sales_summary').select('*').eq('date', today).eq('restaurant_id', outletId).maybeSingle();
                    if (existingSummary) {
                        await supabase.from('sales_summary').update({ total_orders: existingSummary.total_orders + 1, total_sales: parseFloat(existingSummary.total_sales) + paymentData.total }).eq('id', existingSummary.id);
                    } else {
                        await supabase.from('sales_summary').insert({ restaurant_id: outletId, date: today, total_orders: 1, total_sales: paymentData.total });
                    }

                    if (context.customer?.mobile) {
                        const { data: existingCust } = await supabase.from('customers').select('*').eq('mobile', context.customer.mobile).eq('restaurant_id', outletId).maybeSingle();
                        if (existingCust) {
                            await supabase.from('customers').update({ total_spent: (existingCust.total_spent || 0) + paymentData.total, total_visits: (existingCust.total_visits || 0) + 1, last_visit: new Date().toISOString() }).eq('id', existingCust.id);
                        } else {
                             await supabase.from('customers').insert({ restaurant_id: outletId, mobile: context.customer.mobile, name: context.customer.name, email: context.customer.email, total_visits: 1, total_spent: paymentData.total, last_visit: new Date().toISOString() });
                        }
                    }
                    
                     if (context.tableId) {
                        const { data: tbl } = await supabase.from('restaurant_tables').select('current_occupancy').eq('id', context.tableId).single();
                        if (tbl) {
                            const newOcc = Math.max(0, (tbl.current_occupancy || 0) - (context.peopleCount || 0));
                            await supabase.from('restaurant_tables').update({ current_occupancy: newOcc, status: newOcc === 0 ? 'Available' : 'Occupied' }).eq('id', context.tableId);
                        }
                    }
                }
                
                await dbOperations.delete('pending_orders', job.tempId);
                
                const localId = job.payload.orderId || job.payload.order?.id;
                if (localId) {
                     const local = await dbOperations.get('orders', localId);
                     if (local) await dbOperations.put('orders', { ...local, is_synced: true });
                }
                
            } catch (err) {
                console.error("Sync Job Failed", err);
            }
        }
    }
};
