// This function runs every night (automatically).
// It checks all subscriptions.
// 1. If a subscription is expired, it turns off the outlet.
// 2. If it expires in 7 days, it sends a warning email to the owner.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.9";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        console.log('🔍 Checking expiring subscriptions...');

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // -------------------------------------------------------------
        // 1. PROCESS EXPIRED SUBSCRIPTIONS (Strict)
        // -------------------------------------------------------------
        const { data: expiredSubs, error: expireError } = await supabase
            .from('subscription_tracking')
            .select('id, restaurant_id')
            .eq('status', 'active')
            .lt('end_date', todayStr);

        if (expireError) throw expireError;

        if (expiredSubs && expiredSubs.length > 0) {
            console.log(`Found ${expiredSubs.length} expired subscriptions. Deactivating...`);
            const outletIds = expiredSubs.map(s => s.restaurant_id);
            const subIds = expiredSubs.map(s => s.id);

            // Mark Tracking as Expired
            await supabase
                .from('subscription_tracking')
                .update({ status: 'expired' })
                .in('id', subIds);

            // Mark Restaurant as Expired
            await supabase
                .from('restaurants')
                .update({ subscription_status: 'expired' })
                .in('id', outletIds);

            console.log(`Deactivated ${outletIds.length} outlets.`);
        }

        // -------------------------------------------------------------
        // 2. ALERT EXPIRING SOON (7 Days Warning)
        // -------------------------------------------------------------
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + 7);
        const targetStr = targetDate.toISOString().split('T')[0];

        // Query Subscriptions
        const { data: subs, error } = await supabase
            .from('subscription_tracking')
            .select(`
          *,
          restaurant:restaurant_id (
              name,
              email,
              owner:owner_id ( email )
          )
      `)
            .eq('status', 'active')
            .lte('end_date', targetStr)
            .gte('end_date', todayStr);

        if (error) throw error;

        console.log(`Found ${subs?.length || 0} subscriptions expiring soon.`);

        // Initialize Mailer
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // STARTTLS
            auth: {
                user: Deno.env.get("EMAIL_USER"),
                pass: Deno.env.get("EMAIL_APP_PASSWORD"),
            },
        });

        let processedRequest = 0;

        if (subs) {
            for (const sub of subs) {
                const emailToUse = sub.restaurant?.email || sub.restaurant?.owner?.email;
                if (emailToUse) {
                    const daysRemaining = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

                    const html = `
                <div style="font-family: sans-serif;">
                    <h2 style="color: #ea580c;">Subscription Expiring Soon</h2>
                    <p>Your subscription for <strong>${sub.restaurant?.name}</strong> is expiring in <strong>${daysRemaining} days</strong>.</p>
                    <p>Please renew to avoid access interruption.</p>
                </div>
               `;

                    try {
                        await transporter.sendMail({
                            from: `"${Deno.env.get("EMAIL_FROM_NAME") || 'QuickServe POS'}" <${Deno.env.get("EMAIL_USER")}>`,
                            to: emailToUse,
                            subject: `⚠️ Action Required: Subscription Expiring`,
                            html: html,
                        });
                        console.log(`Sent alert to ${emailToUse}`);
                        // Log to email_logs
                        await supabase
                            .from('email_logs')
                            .insert([{ recipient: emailToUse, subject: 'Subscription Warning', status: 'sent', metadata: { type: 'sub_warning', days: daysRemaining } }]);

                        processedRequest++;
                    } catch (e) {
                        console.error("Alert Email Failed", e);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                expiredCount: expiredSubs?.length || 0,
                alertsSent: processedRequest
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
