import { supabase } from '@/lib/supabase';

/**
 * Calculates the percentage growth between two periods for a given table and criteria
 * @param {string} table - Table name
 * @param {object} criteria - Filter criteria object { column: value } or null
 * @returns {Promise<number>} - Percentage growth (e.g., 15.5 for 15.5%)
 */
export const fetchMonthlyGrowth = async (table, criteria = {}) => {
    try {
        const now = new Date();
        const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        // Query Current Month
        let queryCurrent = supabase.from(table).select('*', { count: 'exact', head: true }).gte('created_at', startCurrentMonth);
        Object.keys(criteria).forEach(key => {
            queryCurrent = queryCurrent.eq(key, criteria[key]);
        });
        const { count: currentCount } = await queryCurrent;

        // Query Last Month
        let queryLast = supabase.from(table).select('*', { count: 'exact', head: true }).gte('created_at', startLastMonth).lte('created_at', endLastMonth);
        Object.keys(criteria).forEach(key => {
            queryLast = queryLast.eq(key, criteria[key]);
        });
        const { count: lastCount } = await queryLast;

        if (!lastCount || lastCount === 0) return currentCount > 0 ? 100 : 0; // If 0 last month and >0 this month, 100% growth
        
        const growth = ((currentCount - lastCount) / lastCount) * 100;
        return parseFloat(growth.toFixed(1));

    } catch (error) {
        console.error("Growth calc error:", error);
        return 0;
    }
};
