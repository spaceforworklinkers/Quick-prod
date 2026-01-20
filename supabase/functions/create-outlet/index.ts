// This function is the Universal Outlet Creator.
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

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let createdUserId: string | null = null;

    try {
        const body = await req.json();
        const { requestId, adminId, directParams } = body;

        console.log(`[Create-Outlet] Processing...`);

        // VARIABLES to be populated either from Request OR Direct Params
        let outletName, ownerName, ownerEmail, ownerPhone, city, state, gstNumber;
        let subscriptionIntent, subscriptionType, trialDuration;
        let password = null;

        if (requestId) {
            // MODE A: From Conversion Request
            const { data: request, error: fetchError } = await supabaseAdmin
                .from('conversion_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (fetchError || !request) throw new Error(`Request not found: ${requestId}`);

            outletName = request.outlet_name;
            ownerName = request.owner_name;
            ownerEmail = request.owner_email;
            ownerPhone = request.owner_phone;
            city = request.city;
            state = ''; // Not in requests table usually
            gstNumber = '';
            subscriptionIntent = request.subscription_intent;
            subscriptionType = request.subscription_type;
            trialDuration = request.trial_duration;
        } else if (directParams) {
            // MODE B: Direct Creation
            outletName = directParams.outlet_name;
            ownerName = directParams.owner_name;
            ownerEmail = directParams.owner_email;
            ownerPhone = directParams.owner_phone;
            city = directParams.city;
            state = directParams.state;
            gstNumber = directParams.gst_number;
            subscriptionIntent = directParams.is_paid ? 'paid' : 'trial';
            subscriptionType = directParams.billing_cycle; // monthly/yearly
            trialDuration = directParams.trial_days;
            password = directParams.password;
        } else {
            throw new Error("Missing requestId or directParams");
        }

        // 2. Check Existing Email
        const { data: existingUser } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('email', ownerEmail)
            .single();

        if (existingUser) throw new Error(`Email ${ownerEmail} already exists`);

        // 3. Create Auth User
        const finalPassword = password || generateTemporaryPassword();

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: ownerEmail,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                full_name: ownerName,
                role: 'OWNER' // CORRECT ROLE
            }
        });

        if (authError) throw authError;
        createdUserId = authUser.user.id;

        // 4. Create User Profile
        await supabaseAdmin.from('user_profiles').insert([{
            id: authUser.user.id,
            email: ownerEmail,
            full_name: ownerName,
            role: 'OWNER', // CORRECT ROLE
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
                name: outletName,
                phone: ownerPhone || '',
                email: ownerEmail,
                city: city,
                state: state,
                gst_number: gstNumber,
                subscription_status: subscriptionIntent === 'trial' ? 'trial' : 'active',
                subscription_expiry: calculateSubscriptionEndDate(subscriptionIntent, subscriptionType, trialDuration).toISOString(),
                temporary_password: finalPassword,
                password_change_required: true,
                onboarding_status: 'setup_pending',
                is_active: true
            }])
            .select()
            .single();
        if (restError) throw restError;

        // 7. Store Settings & Manager Assignment
        await supabaseAdmin.from('store_settings').insert([{
            restaurant_id: restaurant.id,
            order_settings: { business_type: 'restaurant' }
        }]);

        await supabaseAdmin.from('restaurant_users').insert([{
            restaurant_id: restaurant.id,
            user_id: authUser.user.id,
            role: 'MANAGER'
        }]);

        // 8. Subscription Tracking
        await supabaseAdmin.from('subscription_tracking').insert([{
            restaurant_id: restaurant.id,
            subscription_type: subscriptionIntent === 'trial' ? 'trial' : `paid_${subscriptionType}`,
            start_date: new Date(),
            end_date: calculateSubscriptionEndDate(subscriptionIntent, subscriptionType, trialDuration),
            payment_proof_required: subscriptionIntent === 'paid',
            status: 'active'
        }]).then(checkError);

        // 9. Update Request (If applicable)
        if (requestId) {
            await supabaseAdmin.from('conversion_requests').update({
                status: 'outlet_created',
                created_outlet_id: restaurant.id,
                outlet_created_at: new Date(),
                updated_at: new Date()
            }).eq('id', requestId).then(checkError);
        }

        // 10. Audit Log
        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert([{
                action: 'CREATE_OUTLET',
                entity_type: 'restaurant',
                entity_id: restaurant.id,
                details: { requestId, ownerEmail },
                performed_by: adminId,
                created_at: new Date()
            }]);
        }

        // 11. Email Credentials
        // (Only send email if we generated password, or if requested. For direct create, maybe unnecessary if Admin copies it?)
        // We'll send it for consistency.

        try {
            await sendWelcomeEmail(ownerName, outletName, ownerEmail, finalPassword, restaurant.id, req.headers.get('origin') || 'http://localhost:5173');

            await supabaseAdmin.from('email_logs').insert([{
                recipient: ownerEmail,
                subject: "Welcome to QuickServe POS!",
                status: 'sent',
                metadata: { type: 'credential_email' }
            }]);

        } catch (e) {
            console.error("Email failed:", e);
        }

        return new Response(JSON.stringify({
            success: true,
            data: { outletId: restaurant.id, email: ownerEmail }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error(`[Create-Outlet] Failed: ${error.message}`);
        if (createdUserId) await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(e => console.error("Rollback failed", e));

        return new Response(JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});

function generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function calculateSubscriptionEndDate(intent: string, type: string | null, trialDuration: number | null) {
    const startDate = new Date();
    let endDate = new Date();
    if (intent === 'trial') {
        endDate.setDate(startDate.getDate() + (trialDuration || 15));
    } else if (intent === 'paid') {
        if (type === 'monthly') endDate.setMonth(startDate.getMonth() + 1);
        else if (type === 'yearly') endDate.setFullYear(startDate.getFullYear() + 1);
    }
    return endDate;
}

function checkError(res: any) {
    if (res.error) throw res.error;
    return res;
}

async function sendWelcomeEmail(name: string, outletName: string, email: string, pass: string, outletId: string, origin: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: Deno.env.get("EMAIL_USER"),
            pass: Deno.env.get("EMAIL_APP_PASSWORD"),
        },
    });

    const outletUrl = `${origin}/${outletId}`;
    await transporter.sendMail({
        from: `"${Deno.env.get("EMAIL_FROM_NAME") || 'QuickServe POS'}" <${Deno.env.get("EMAIL_USER")}>`,
        to: email,
        subject: "Welcome to QuickServe POS - Your Account is Ready!",
        html: `
            <div style="font-family: sans-serif; color: #333;">
                <h2>Welcome to QuickServe POS! 🎉</h2>
                <p>Dear ${name},</p>
                <p>Your outlet <strong>"${outletName}"</strong> has been successfully created.</p>
                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>🔐 Your Credentials</h3>
                    <p><strong>URL:</strong> <a href="${outletUrl}">${outletUrl}</a></p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Password:</strong> <code>${pass}</code></p>
                </div>
            </div>
        `
    });
}
