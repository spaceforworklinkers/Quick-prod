/**
 * Conversion Request Service
 * Handles conversion request workflow: create, review, approve, reject
 */

import { supabase } from '@/lib/supabase';

export const ConversionRequestService = {
  /**
   * Create a new conversion request (Salesperson)
   */
  async createRequest(data, userId) {
    try {
      const requestData = {
        outlet_name: data.outletName,
        owner_name: data.ownerName,
        owner_email: data.ownerEmail,
        owner_phone: data.ownerPhone,
        business_type: data.businessType,
        subscription_intent: data.subscriptionIntent,
        subscription_type: data.subscriptionType || null,
        trial_duration: data.trialDuration || null,
        internal_notes: data.internalNotes || null,
        salesperson_id: userId,
        created_by: userId,
        status: 'pending_manager_review'
      };

      const { data: request, error } = await supabase
        .from('conversion_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: request };
    } catch (error) {
      console.error('Error creating conversion request:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all requests (filtered by role)
   */
  async getRequests(userId, userRole) {
    try {
      let query = supabase
        .from('conversion_requests')
        .select(`
          *,
          salesperson:salesperson_id(id, full_name, email),
          manager:manager_id(id, full_name),
          approver:approver_id(id, full_name),
          created_outlet:created_outlet_id(id, name)
        `)
        .order('created_at', { ascending: false });

      // Filter based on role
      if (userRole === 'SALESPERSON') {
        query = query.eq('salesperson_id', userId);
      }
      // Manager, Admin, Super Admin see all

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching requests:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get single request by ID
   */
  async getRequestById(requestId) {
    try {
      const { data, error } = await supabase
        .from('conversion_requests')
        .select(`
          *,
          salesperson:salesperson_id(id, full_name, email),
          manager:manager_id(id, full_name),
          approver:approver_id(id, full_name),
          created_outlet:created_outlet_id(id, name),
          queries:conversion_request_queries(
            *,
            created_by_user:created_by(id, full_name)
          )
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching request:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel request (Salesperson)
   */
  async cancelRequest(requestId, userId) {
    try {
      const { error } = await supabase
        .from('conversion_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('salesperson_id', userId); // Extra safety check

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelling request:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Manager: Add query to request
   */
  async addManagerQuery(requestId, message, userId) {
    try {
      const { data: request } = await supabase.from('conversion_requests').select('salesperson_id, outlet_name').eq('id', requestId).single();

      // Add query
      const { error: queryError } = await supabase
        .from('conversion_request_queries')
        .insert([{
          request_id: requestId,
          query_type: 'manager_query',
          message,
          created_by: userId
        }]);

      if (queryError) throw queryError;

      // Update request status
      const { error: updateError } = await supabase
        .from('conversion_requests')
        .update({
          status: 'query_from_manager',
          manager_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Notify Salesperson
      if (request) {
        await this.createNotification(
          request.salesperson_id,
          'New Query on Request',
          `The manager has a question regarding ${request.outlet_name}: "${message.slice(0, 50)}..."`,
          'WARNING'
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding manager query:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Salesperson: Reply to manager query
   */
  async replySalespersonQuery(requestId, message, userId) {
    try {
      // Add reply
      const { error: queryError } = await supabase
        .from('conversion_request_queries')
        .insert([{
          request_id: requestId,
          query_type: 'salesperson_reply',
          message,
          created_by: userId
        }]);

      if (queryError) throw queryError;

      // Update request status back to pending review
      const { error: updateError } = await supabase
        .from('conversion_requests')
        .update({
          status: 'pending_manager_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error replying to query:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Helper: Create internal notification
   */
  async createNotification(userId, title, message, type = 'INFO') {
    return supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type
    }]);
  },

  /**
   * Manager: Approve request (first level)
   */
  async managerApprove(requestId, userId) {
    try {
      const { data: request } = await supabase.from('conversion_requests').select('salesperson_id, outlet_name').eq('id', requestId).single();
      
      const { error } = await supabase
        .from('conversion_requests')
        .update({
          status: 'manager_approved',
          manager_id: userId,
          manager_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      // Notify Salesperson
      if (request) {
          await this.createNotification(
              request.salesperson_id,
              'Request Approved by Manager',
              `Your request for ${request.outlet_name} has been approved by the manager and is pending final Admin approval.`,
              'SUCCESS'
          );
      }

      return { success: true };
    } catch (error) {
      console.error('Error approving request (manager):', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Manager: Reject request
   */
  async managerReject(requestId, reason, userId) {
    try {
      const { error } = await supabase
        .from('conversion_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          manager_id: userId,
          manager_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request (manager):', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Admin/Super Admin: Final approval
   */
  async adminApprove(requestId, userId) {
    try {
      const { error } = await supabase
        .from('conversion_requests')
        .update({
          status: 'fully_approved',
          approver_id: userId,
          admin_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Trigger automated outlet creation
      // This will be handled by a separate process/trigger
      return { success: true };
    } catch (error) {
      console.error('Error approving request (admin):', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Admin/Super Admin: Reject request
   */
  async adminReject(requestId, reason, userId) {
    try {
      const { error } = await supabase
        .from('conversion_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approver_id: userId,
          admin_approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request (admin):', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get request statistics
   */
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('conversion_requests')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        pending_manager_review: data.filter(r => r.status === 'pending_manager_review').length,
        query_from_manager: data.filter(r => r.status === 'query_from_manager').length,
        manager_approved: data.filter(r => r.status === 'manager_approved').length,
        fully_approved: data.filter(r => r.status === 'fully_approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        outlet_created: data.filter(r => r.status === 'outlet_created').length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return { success: false, error: error.message };
    }
  }
};
