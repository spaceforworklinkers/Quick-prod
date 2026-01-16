import { supabase } from '@/lib/supabase';

export const OnboardingService = {
  /**
   * Get current onboarding status (and steps) for a restaurant
   */
  async getOnboardingStatus(restaurantId) {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id, 
        name, 
        onboarding_status, 
        onboarding_step,
        business_info_completed,
        menu_created,
        tables_created,
        tax_configured,
        qr_generated
      `)
      .eq('id', restaurantId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update business info (Step 1)
   */
  async updateBusinessInfo(restaurantId, info) {
    const { name, address, phone } = info;
    const { error } = await supabase
      .from('restaurants')
      .update({
        name,
        address,
        phone,
        business_info_completed: true,
        onboarding_status: 'setup_in_progress',
        onboarding_step: 1 // Completed step 1, move to next logic handled in UI or here
      })
      .eq('id', restaurantId);

    if (error) throw error;
  },

  /**
   * Complete Menu Step (Step 2)
   * Validates if items exist first
   */
  async completeMenuStep(restaurantId) {
    // optional: verify items exist
    const { count, error } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (error) throw error;
    if (count === 0) throw new Error("Please add at least one menu item.");

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        menu_created: true,
        onboarding_step: 2
      })
      .eq('id', restaurantId);

    if (updateError) throw updateError;
  },

  /**
   * Complete Tables Step (Step 3)
   */
  async completeTableStep(restaurantId, tableCount) {
    // Check if tables exist
    const { count } = await supabase
      .from('restaurant_tables')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

     if (count === 0 && tableCount > 0) {
        // Auto generate tables if none exist and count provided
        // This logic might be complex for a service, but simpler to just call an edge function or loop
        // keeping it simple: assumes UI calls createTable separately or we do it here.
        // For now, let's assume UI handles creation.
     }
     
    // If we just want to mark complete based on validation:
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        tables_created: true,
        onboarding_step: 3
      })
      .eq('id', restaurantId);

    if (updateError) throw updateError;
  },

  /**
   * Update Tax & Complete Step 4
   */
  async updateTaxConfig(restaurantId, settings) {
    // Assuming settings are stored in store_settings or similar?
    // The requirement says "Tax Configuration". 
    // Schema has 'store_settings' JSONB or we might need to add columns.
    // For now, let's assume store_settings.
    
    // First fetch current settings
    const { data: currentSettings } = await supabase
      .from('store_settings')
      .select('billing_settings')
      .eq('restaurant_id', restaurantId)
      .single();
      
    const newBilling = { ...currentSettings?.billing_settings, ...settings };

    const { error } = await supabase
      .from('store_settings')
      .upsert({ 
        restaurant_id: restaurantId,
        billing_settings: newBilling
      }, { onConflict: 'restaurant_id' });

    if (error) throw error;

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        tax_configured: true,
        onboarding_step: 4
      })
      .eq('id', restaurantId);

    if (updateError) throw updateError;
  },

  /**
   * Complete Final Step (Step 5)
   */
  async completeOnboarding(restaurantId) {
    const { error } = await supabase
      .from('restaurants')
      .update({
        qr_generated: true,
        onboarding_status: 'active', // FINISHED!
        onboarding_step: 5
      })
      .eq('id', restaurantId);

    if (error) throw error;
  },
  
  /**
   * Reset onboarding (for testing)
   */
  async resetOnboarding(restaurantId) {
       const { error } = await supabase
      .from('restaurants')
      .update({
        onboarding_status: 'setup_pending',
        onboarding_step: 0,
        business_info_completed: false,
        menu_created: false,
        tables_created: false,
        tax_configured: false,
        qr_generated: false
      })
      .eq('id', restaurantId);
       if (error) throw error;
  }
};
