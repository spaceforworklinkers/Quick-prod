// This function is the Main Boss for creating new outlets.
// It handles everything: creating the login, setting up the shop details,
// granting permissions, and sending the welcome email.
// It keeps things secure so nobody can fake it from the browser.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.9";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/**
 * Generate a random 12-char password
 */
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Calculate dates
 */
function calculateSubscriptionEndDate(intent: string, type: string | null, trialDuration: number | null) {
    const startDate = new Date();
    let endDate = new Date();

    if (intent === 'trial') {
        endDate.setDate(startDate.getDate() + (trialDuration || 15));
    } else if (intent === 'paid') {
        if (type === 'monthly') {
            endDate.setMonth(startDate.getMonth() + 1);
        } else if (type === 'yearly') {
            endDate.setFullYear(startDate.getFullYear() + 1);
        }
    }
    return endDate;
}

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Cleanup List
    let createdUserId: string | null = null;

    try {
        const { requestId, adminId } = await req.json();

        if (!requestId) {
            throw new Error("Missing requestId");
        }

        console.log(`[Create-Outlet] Processing Request: ${requestId}`);

        // 1. Fetch & Validate Request
        const { data: request, error: fetchError } = await supabaseAdmin
            .from('conversion_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) throw new Error(`Request not found: ${requestId}`);
        if (request.status !== 'fully_approved') throw new Error(`Request not approved: ${request.status}`);
        if (request.created_outlet_id) throw new Error("Outlet already created");

        // 2. Check Existing Email
        const { data: existingUser } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('email', request.owner_email)
            .single();

        if (existingUser) throw new Error("Email already exists");

        // 3. Create Auth User
        const tempPassword = generateTemporaryPassword();
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: request.owner_email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: request.owner_name,
                role: 'OWNER_SUPER_ADMIN'
            }
        });

        if (authError) throw authError;
        createdUserId = authUser.user.id;

        // 4. Create User Profile
        await supabaseAdmin.from('user_profiles').insert([{
            id: authUser.user.id,
            email: request.owner_email,
            full_name: request.owner_name,
            role: 'OWNER_SUPER_ADMIN',
            is_active: true
        }]).then(checkError);

        // 5. Create Restaurant Owner
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('restaurant_owners')
            .insert([{ user_id: authUser.user.id, max_restaurants_allowed: 1 }])
            .select()
            .single();
        if (ownerError) throw ownerError;

        // 6. Create Restaurant
        const { data: restaurant, error: restError } = await supabaseAdmin
            .from('restaurants')
            .insert([{
                owner_id: owner.id,
                name: request.outlet_name,
                phone: request.owner_phone || '',
                email: request.owner_email,
                subscription_status: request.subscription_intent === 'trial' ? 'trial' : 'active',
                subscription_expiry: calculateSubscriptionEndDate(request.subscription_intent, request.subscription_type, request.trial_duration).toISOString(),
                temporary_password: tempPassword,
                password_change_required: true,
                onboarding_status: 'setup_pending',
                is_active: true
            }])
            .select()
            .single();
        if (restError) throw restError;

        // 7. Subscription Tracking
        await supabaseAdmin.from('subscription_tracking').insert([{
            restaurant_id: restaurant.id,
            subscription_type: request.subscription_intent === 'trial' ? 'trial' : `paid_${request.subscription_type}`,
            start_date: new Date(),
            end_date: calculateSubscriptionEndDate(request.subscription_intent, request.subscription_type, request.trial_duration),
            payment_proof_required: request.subscription_intent === 'paid',
            status: 'active'
        }]).then(checkError);

        // 8. Update Request
        await supabaseAdmin.from('conversion_requests').update({
            status: 'outlet_created',
            created_outlet_id: restaurant.id,
            outlet_created_at: new Date(),
            updated_at: new Date()
        }).eq('id', requestId).then(checkError);

        // 9. Audit Log
        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert([{
                action: 'CREATE_OUTLET',
                entity_type: 'restaurant',
                entity_id: restaurant.id,
                details: { requestId, ownerEmail: request.owner_email },
                performed_by: adminId,
                created_at: new Date()
            }]);
        }

        // 10. Email Credentials
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: Deno.env.get("EMAIL_USER"),
                pass: Deno.env.get("EMAIL_APP_PASSWORD"),
            },
        });

        const outletUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/${restaurant.id}`;
        const emailHtml = `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Welcome to QuickServe POS! 🎉</h2>
        <p>Dear ${request.owner_name},</p>
        <p>Your outlet <strong>"${request.outlet_name}"</strong> has been successfully created.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🔐 Your Credentials</h3>
            <p><strong>URL:</strong> <a href="${outletUrl}">${outletUrl}</a></p>
            <p><strong>Email:</strong> ${request.owner_email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #e4e4e7; padding: 4px;">${tempPassword}</code></p>
        </div>
        <p>Please login immediately and change your password.</p>
      </div>
    `;

        let emailSent = false;
        try {
            await transporter.sendMail({
                from: `"${Deno.env.get("EMAIL_FROM_NAME") || 'QuickServe POS'}" <${Deno.env.get("EMAIL_USER")}>`,
                to: request.owner_email,
                subject: "Welcome to QuickServe POS - Your Account is Ready!",
                html: emailHtml
            });
            console.log(`[Create-Outlet] Email sent`);
            emailSent = true;

            await supabaseAdmin.from('email_logs').insert([{
                recipient: request.owner_email,
                subject: "Welcome to QuickServe POS - Your Account is Ready!",
                status: 'sent',
                metadata: { type: 'credential_email' }
            }]);

        } catch (e) {
            console.error("Email failed:", e);
            await supabaseAdmin.from('email_logs').insert([{
                recipient: request.owner_email,
                subject: "Welcome to QuickServe POS - Your Account is Ready!",
                status: 'failed',
                error_message: e.message
            }]);
        }

        return new Response(JSON.stringify({
            success: true,
            data: { outletId: restaurant.id, email: request.owner_email, emailSent }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error(`[Create-Outlet] Failed: ${error.message}`);
        // Rollback Auth
        if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(e => console.error("Rollback failed", e));

        return new Response(JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});

function checkError(res: any) {
    if (res.error) throw res.error;
    return res;
}
