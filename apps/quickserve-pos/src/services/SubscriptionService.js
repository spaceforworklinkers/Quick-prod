/**
 * Subscription Service
 * Manages subscription tracking, alerts, and payment proofs
 */

import { supabase } from '@/lib/supabase';

export const SubscriptionService = {
  /**
   * Get all subscriptions (Admin/Accountant view)
   */
  async getAllSubscriptions(filters = {}) {
    try {
      let query = supabase
        .from('subscription_tracking')
        .select(`
          *,
          restaurant:restaurant_id(
            id,
            name,
            phone,
            email,
            owner:owner_id(
              user:user_id(full_name, email)
            )
          )
        `)
        .order('end_date', { ascending: true });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.subscriptionType) {
        query = query.eq('subscription_type', filters.subscriptionType);
      }
      if (filters.expiringWithinDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
        query = query.lte('end_date', futureDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get subscription for specific outlet
   */
  async getSubscriptionByOutlet(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('subscription_tracking')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload payment proof (Outlet owner)
   */
  async uploadPaymentProof(restaurantId, file) {
    try {
      // Upload file to Supabase Storage
      const fileName = `payment-proofs/${restaurantId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Update subscription tracking
      const { error: updateError } = await supabase
        .from('subscription_tracking')
        .update({
          payment_proof_url: publicUrl,
          payment_proof_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId);

      if (updateError) throw updateError;

      return { success: true, data: { url: publicUrl } };
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check for expiring subscriptions and update status
   * Should be run daily via cron
   */
  async checkExpiringSubscriptions() {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      // Get subscriptions expiring within 7 days
      const { data: expiring, error: expiringError } = await supabase
        .from('subscription_tracking')
        .select('*')
        .eq('status', 'active')
        .lte('end_date', sevenDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);

      if (expiringError) throw expiringError;

      // Update status to expiring_soon
      for (const subscription of expiring) {
        await supabase
          .from('subscription_tracking')
          .update({
            status: 'expiring_soon',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);
      }

      // Get expired subscriptions
      const { data: expired, error: expiredError } = await supabase
        .from('subscription_tracking')
        .select('*')
        .in('status', ['active', 'expiring_soon'])
        .lt('end_date', today.toISOString().split('T')[0]);

      if (expiredError) throw expiredError;

      // Update status to expired
      for (const subscription of expired) {
        await supabase
          .from('subscription_tracking')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        // Also update restaurant status
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'expired',
            is_active: false
          })
          .eq('id', subscription.restaurant_id);
      }

      return {
        success: true,
        data: {
          expiringSoon: expiring.length,
          expired: expired.length
        }
      };
    } catch (error) {
      console.error('Error checking expiring subscriptions:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get subscription statistics
   */
  async getStatistics() {
    try {
      const { data, error } = await supabase
        .from('subscription_tracking')
        .select('subscription_type, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        byType: {
          trial: data.filter(s => s.subscription_type === 'trial').length,
          paid_monthly: data.filter(s => s.subscription_type === 'paid_monthly').length,
          paid_yearly: data.filter(s => s.subscription_type === 'paid_yearly').length
        },
        byStatus: {
          active: data.filter(s => s.status === 'active').length,
          expiring_soon: data.filter(s => s.status === 'expiring_soon').length,
          expired: data.filter(s => s.status === 'expired').length,
          cancelled: data.filter(s => s.status === 'cancelled').length
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Extend subscription (Admin action)
   */
  async extendSubscription(restaurantId, days) {
    try {
      const { data: subscription, error: fetchError } = await supabase
        .from('subscription_tracking')
        .select('end_date')
        .eq('restaurant_id', restaurantId)
        .single();

      if (fetchError) throw fetchError;

      const newEndDate = new Date(subscription.end_date);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error: updateError } = await supabase
        .from('subscription_tracking')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId);

      if (updateError) throw updateError;

      // Update restaurant status
      await supabase
        .from('restaurants')
        .update({
          subscription_status: 'active',
          subscription_expiry: newEndDate.toISOString(),
          is_active: true
        })
        .eq('id', restaurantId);

      return { success: true };
    } catch (error) {
      console.error('Error extending subscription:', error);
      return { success: false, error: error.message };
    }
  }
};
