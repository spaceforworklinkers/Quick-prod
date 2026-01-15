
import { supabase } from '@/lib/supabase';

// Helper to calculate total stock required for a list of order items
export const calculateStockRequirements = async (orderItems) => {
  if (!orderItems || orderItems.length === 0) return {};

  // Extract menu item IDs
  const menuItemIds = orderItems.map(item => item.menu_item_id).filter(Boolean);
  
  if (menuItemIds.length === 0) return {};

  // Fetch mappings for these menu items
  const { data: mappings, error } = await supabase
    .from('menu_stock_usage')
    .select('menu_item_id, stock_item_id, quantity_used, stock_item:inventory_items(name, current_stock, unit)')
    .in('menu_item_id', menuItemIds);

  if (error) {
    console.error("Error fetching stock mappings:", error);
    throw error;
  }

  // Aggregate requirements by stock_item_id
  const requirements = {};

  mappings.forEach(mapping => {
    // Find all instances of this menu item in the order to sum up quantity
    // (A menu item might appear multiple times if variants were handled differently, though usually distinct IDs)
    const relevantOrderItems = orderItems.filter(item => item.menu_item_id === mapping.menu_item_id);
    const totalOrderedQty = relevantOrderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const totalRequired = parseFloat(mapping.quantity_used) * totalOrderedQty;

    if (!requirements[mapping.stock_item_id]) {
      requirements[mapping.stock_item_id] = {
        stock_item_id: mapping.stock_item_id,
        name: mapping.stock_item.name,
        unit: mapping.stock_item.unit,
        current_stock: mapping.stock_item.current_stock,
        required: 0
      };
    }
    requirements[mapping.stock_item_id].required += totalRequired;
  });

  return requirements;
};

// Check if stock is sufficient
export const checkStockAvailability = async (orderItems) => {
  try {
    const requirements = await calculateStockRequirements(orderItems);
    const missing = [];

    Object.values(requirements).forEach(item => {
      if (item.current_stock < item.required) {
        missing.push(item);
      }
    });

    return {
      passed: missing.length === 0,
      missingItems: missing
    };
  } catch (error) {
    console.error("Stock check failed:", error);
    // If check fails technically, we might want to block or warn. 
    // For now, assume passed to avoid blocking sales due to technical error, but log it.
    return { passed: true, missingItems: [], error };
  }
};

// Deduct stock and log movements
export const deductStockForOrder = async (orderItems, orderId, restaurantId, isOverride = false) => {
  try {
    const requirements = await calculateStockRequirements(orderItems);
    
    // Process deductions
    for (const stockId in requirements) {
      const item = requirements[stockId];
      
      // 1. Update Inventory
      const { error: updateError } = await supabase.rpc('decrement_stock', { 
         row_id: stockId, 
         amount: item.required 
      });

      // If RPC doesn't exist (fallback to standard update - slightly less concurrency safe but fine for this scope)
      if (updateError) {
          // Fallback manual update
          const newStock = item.current_stock - item.required;
          await supabase
            .from('inventory_items')
            .update({ current_stock: newStock })
            .eq('id', stockId)
            .eq('restaurant_id', restaurantId);
      }

      // 2. Log Movement
      if (restaurantId) {
          await supabase.from('stock_logs').insert({
              restaurant_id: restaurantId,
              stock_item_id: stockId,
              order_id: orderId,
              quantity_change: -item.required, // Negative for deduction
              reason: isOverride && item.current_stock < item.required ? 'Sold without stock (Override)' : 'Order Fulfillment'
          });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Stock deduction failed:", error);
    return { success: false, error };
  }
};
