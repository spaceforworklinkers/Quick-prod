// Supabase Edge Function: send-email
// Uses 'nodemailer' via npm compatibility for robust sending

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

    let to, subject;

    try {
        const body = await req.json();
        to = body.to;
        subject = body.subject;
        const { html } = body;

        // Create Transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // STARTTLS
            auth: {
                user: Deno.env.get("EMAIL_USER"),
                pass: Deno.env.get("EMAIL_APP_PASSWORD"),
            },
        });

        // Send Mail
        const info = await transporter.sendMail({
            from: `"${Deno.env.get("EMAIL_FROM_NAME") || 'QuickServe POS'}" <${Deno.env.get("EMAIL_USER")}>`,
            to: to,
            subject: subject,
            html: html,
        });

        console.log("Message sent: %s", info.messageId);

        // Log Success
        await supabaseAdmin.from('email_logs').insert([{
            recipient: to,
            subject: subject,
            status: 'sent',
            metadata: { messageId: info.messageId }
        }]);

        return new Response(
            JSON.stringify({ success: true, messageId: info.messageId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error("Email Error:", error);

        // Log Failure (if to/subject exist)
        if (to && subject) {
            await supabaseAdmin.from('email_logs').insert([{
                recipient: to,
                subject: subject,
                status: 'failed',
                error_message: error.message
            }]);
        }

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
