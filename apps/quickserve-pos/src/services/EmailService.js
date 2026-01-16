/**
 * CENTRALIZED EMAIL SERVICE
 * Calls backend API for secure email delivery
 */

import { supabase } from '@/lib/supabase';

// Backend URL no longer needed (Supabase Functions Used)
// const BACKEND_URL = ...

/**
 * Base email template wrapper
 */
function getEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; }
    .content { padding: 40px 30px; }
    .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .otp-box { background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #16a34a; font-family: 'Courier New', monospace; background: #fff; padding: 10px 20px; border-radius: 8px; display: inline-block; }
    .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; font-size: 14px; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0; font-size: 24px;">QuickServe POS</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 QuickServe POS. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Log email to database
 */
async function logEmail(toEmail, subject, emailType, status, errorMessage = null) {
  try {
    await supabase.from('email_logs').insert([{
      to_email: toEmail,
      subject,
      email_type: emailType,
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      error_message: errorMessage
    }]);
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

/**
 * Send email via Backend API
 */
async function sendEmail(to, subject, htmlContent, emailType) {
  try {
    const fullHtml = getEmailTemplate(htmlContent);
    
    // Call Supabase Edge Function (Serverless)
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html: fullHtml
      }
    });

    if (error) throw error;
    if (!result.success) throw new Error(result.error || 'Failed to send email');

    await logEmail(to, subject, emailType, 'sent');
    return { success: true };

  } catch (error) {
    console.error('Email send error:', error);
    await logEmail(to, subject, emailType, 'failed', error.message);
    return { success: false, error: 'Email failed: ' + error.message };
  }
}
// Remove BACKEND_URL constant as it's no longer needed
// const BACKEND_URL = ...

export const EmailService = {
  /**
   * Send OTP login email
   */
  async sendOTP(email, otp) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Login Verification</h2>
      <p style="color: #4b5563; font-size: 16px; text-align: center;">Use the code below to complete your login.</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="margin: 15px 0 0 0; color: #16a34a; font-weight: 600; font-size: 14px;">Valid for 2 minutes</p>
      </div>
      
      <div class="warning">
        <strong>🔒 Security Notice:</strong><br>
        Do not share this code with anyone. QuickServe staff will never ask for it.
      </div>
    `;

    return await sendEmail(email, 'Your QuickServe POS Login Code', content, 'otp_login');
  },

  /**
   * Send outlet credentials email
   */
  async sendOutletCredentials(credentials) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome to QuickServe POS! 🎉</h2>
      <p style="color: #4b5563; font-size: 16px;">Dear ${credentials.ownerName},</p>
      <p style="color: #4b5563; font-size: 16px;">
        Congratulations! Your outlet <strong>"${credentials.outletName}"</strong> has been successfully created.
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">🔐 Your Login Details:</h3>
        <p style="margin: 10px 0;"><strong>Login URL:</strong><br>
          <a href="${credentials.outletUrl}" style="color: #f97316; word-break: break-all;">${credentials.outletUrl}</a>
        </p>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${credentials.email}</p>
        <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${credentials.temporaryPassword}</code></p>
      </div>
      
      <div class="warning">
        <strong>🔒 Security Notice:</strong><br>
        You will be required to change your password on first login.
      </div>
      
      <h3 style="color: #374151;">📋 Next Steps:</h3>
      <ol style="color: #4b5563; line-height: 1.8;">
        <li>Click the login URL above or copy it to your browser</li>
        <li>Login using the provided credentials</li>
        <li>Change your password immediately</li>
        <li>Complete the setup wizard to configure your outlet</li>
        <li>Start using your POS!</li>
      </ol>
      
      <a href="${credentials.outletUrl}" class="button">Login Now →</a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Need help? Contact our support team at sales@spacelinkers.com
      </p>
    `;

    return await sendEmail(
      credentials.email,
      `Welcome to QuickServe POS - Your Account is Ready!`,
      content,
      'outlet_credentials'
    );
  },

  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiry(outlet, daysRemaining) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">⚠️ Subscription Expiry Notice</h2>
      <p style="color: #4b5563; font-size: 16px;">Dear ${outlet.ownerName},</p>
      <p style="color: #4b5563; font-size: 16px;">
        Your subscription for <strong>"${outlet.outletName}"</strong> will expire in <strong>${daysRemaining} days</strong>.
      </p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #991b1b;">Subscription Details:</h3>
        <p style="margin: 5px 0;"><strong>Outlet:</strong> ${outlet.outletName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${outlet.subscriptionType}</p>
        <p style="margin: 5px 0;"><strong>Expires:</strong> ${outlet.expiryDate}</p>
      </div>
      
      <p style="color: #4b5563; font-size: 16px;">
        To avoid service interruption, please renew your subscription before the expiry date.
      </p>
      
      <a href="mailto:sales@spacelinkers.com" class="button">Contact Support</a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Questions? Reach out to us at sales@spacelinkers.com or call our support team.
      </p>
    `;

    return await sendEmail(
      outlet.email,
      `⚠️ QuickServe POS - Subscription Expiring Soon`,
      content,
      'subscription_expiry'
    );
  },

  // Removed testConnection (No longer needed for serverless)
};
