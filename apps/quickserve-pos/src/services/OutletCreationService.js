/**
 * Outlet Creation Service
 * Orchestrates secure outlet creation via Edge Function
 */

import { supabase } from '@/lib/supabase';

export const OutletCreationService = {
  /**
   * Create outlet and owner account automatically
   * Called after request is fully approved
   */
  async createOutletFromRequest(requestId, adminId) {
    try {
      console.log('Invoking create-outlet Edge Function for:', requestId);
      
      const { data: result, error } = await supabase.functions.invoke('create-outlet', {
        body: { requestId, adminId }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Unknown error from server');

      return { 
          success: true, 
          data: {
              credentials: {
                  email: result.data.email, 
                  temporaryPassword: "(Sent via Email)",
                  outletUrl: `${window.location.origin}/${result.data.outletId}`,
                  outletId: result.data.outletId,
                  emailSent: result.data.emailSent
              }
          }
      };

    } catch (error) {
      console.error('Outlet Creation Failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Process all fully approved requests
   */
  async processApprovedRequests() {
    try {
      const { data: requests, error } = await supabase
        .from('conversion_requests')
        .select('id')
        .eq('status', 'fully_approved')
        .is('created_outlet_id', null);

      if (error) throw error;

      const results = [];
      for (const request of requests) {
        const result = await this.createOutletFromRequest(request.id);
        results.push({ requestId: request.id, ...result });
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('Error processing approved requests:', error);
      return { success: false, error: error.message };
    }
  }
};
