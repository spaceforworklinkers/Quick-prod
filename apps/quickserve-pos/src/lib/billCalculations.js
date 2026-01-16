/**
 * Centralized Bill Calculation Logic
 * Handles GST (inclusive/exclusive), discounts, and tax splits.
 */

/**
 * Calculates bill totals including taxable value, GST, and final total.
 * 
 * @param {Array} items - Array of items with { price, quantity }
 * @param {number} discount - Total discount amount
 * @param {number} gstRate - GST Percentage (e.g., 5, 12, 18)
 * @param {string} gstMode - 'inclusive' or 'exclusive'
 * @returns {Object} Calculated values
 */
export function calculateBill(items, discount = 0, gstRate = 5, gstMode = 'inclusive') {
  // 1. Calculate Total Item Value (Gross)
  const totalItemValue = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || parseFloat(item.menu_item_price) || 0;
    const qty = parseInt(item.quantity) || 0;
    return sum + (price * qty);
  }, 0);

  // Ensure positive values
  const validDiscount = Math.max(0, Math.min(parseFloat(discount) || 0, totalItemValue));
  const validGstRate = Math.max(0, parseFloat(gstRate) || 0);

  let taxableValue = 0;
  let gstAmount = 0;
  let total = 0;
  let netPayable = 0; // Only relevant for inclusive

  if (gstMode === 'exclusive') {
    // Exclusive: Price is base. Tax is added on top.
    // Taxable Value = (Items Total - Discount)
    taxableValue = Math.max(0, totalItemValue - validDiscount);
    
    // GST = Taxable Value * (Rate / 100)
    gstAmount = taxableValue * (validGstRate / 100);
    
    // Total = Taxable Value + GST
    total = taxableValue + gstAmount;

  } else {
    // Inclusive: Price includes Tax.
    // Net Payable (Cash collected) = Items Total - Discount
    netPayable = Math.max(0, totalItemValue - validDiscount);

    // Taxable Value = Net Payable * 100 / (100 + Rate)
    // Formula derived from: Net = Taxable + (Taxable * Rate/100)
    taxableValue = (netPayable * 100) / (100 + validGstRate);

    // GST = Net Payable - Taxable Value
    gstAmount = netPayable - taxableValue;

    // Total = Net Payable (since tax is inside)
    total = netPayable;
  }

  // Rounding Strategy: Standard financial rounding (half-up)
  const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Split Taxes
  const roundedGstAmount = round(gstAmount);
  const cgst = round(roundedGstAmount / 2);
  
  // SGST Adjustment: Ensure CGST + SGST = GST Amount exactly
  // If (cgst + cgst) != gstAmount, add remainder to SGST
  // This handles odd cent splits like 4.19 total -> 2.10 + 2.09
  let sgst = round(roundedGstAmount - cgst);

  return {
    totalItemValue: round(totalItemValue),
    discount: round(validDiscount),
    netPayable: gstMode === 'inclusive' ? round(netPayable) : null,
    taxableValue: round(taxableValue),
    gstAmount: roundedGstAmount,
    cgst,
    sgst,
    total: round(total),
    gstRate: validGstRate,
    gstMode
  };
}

/**
 * Test Case Examples (JSDoc):
 * 
 * Case 1 (Inclusive):
 * calculateBill([{price: 188, quantity: 1}], 12, 5, 'inclusive')
 * -> Total Item Value: 188
 * -> Discount: 12
 * -> Net Payable: 176
 * -> Taxable: 167.62 (176 * 100 / 105)
 * -> GST Amount: 8.38 (176 - 167.62)
 * -> CGST: 4.19
 * -> SGST: 4.19
 * -> Total: 176.00
 * 
 * Case 2 (Exclusive):
 * calculateBill([{price: 188, quantity: 1}], 12, 5, 'exclusive')
 * -> Total Item Value: 188
 * -> Discount: 12
 * -> Taxable: 176
 * -> GST Amount: 8.80 (176 * 0.05)
 * -> CGST: 4.40
 * -> SGST: 4.40
 * -> Total: 184.80
 */
