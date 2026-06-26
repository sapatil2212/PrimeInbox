import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT || "587") === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
};

const hasSMTP = !!(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);

// Create transporter only if SMTP settings are fully populated
const transporter = hasSMTP ? nodemailer.createTransport(smtpConfig) : null;
const fromName = process.env.SMTP_FROM || "PrimeInbox";
const fromEmail = process.env.SMTP_USER || "noreply@primeinbox.dev";
const appUrl = process.env.APP_URL || "http://localhost:3000";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const bccEmail = process.env.SMTP_BCC || "";

export async function sendMail({ to, subject, html, text }: SendMailOptions) {
  if (transporter) {
    try {
      // Generate unique message ID with proper domain
      const domain = fromEmail.split('@')[1] || 'primeinbox.com';
      const uniqueId = `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
      
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        bcc: bccEmail || undefined,
        subject,
        html,
        text,
        headers: {
          'X-Mailer': 'PrimeInbox',
          'X-Priority': '1',
          'Importance': 'high',
          'X-Entity-Ref-ID': uniqueId,
          // Remove bulk headers for transactional emails
          // 'Precedence': 'bulk', // REMOVED - causes spam filtering
          // 'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`, // REMOVED - not needed for OTP
          // 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click', // REMOVED - not needed for OTP
          'X-PM-Message-Stream': 'outbound', // Postmark compatibility
          'X-SES-CONFIGURATION-SET': 'transactional', // AWS SES hint
        },
        messageId: `<${uniqueId}@${domain}>`,
        priority: 'high',
      });
      console.log(`[SMTP] Email sent successfully to ${to} (BCC: ${bccEmail || 'none'}): "${subject}"`);
      return true;
    } catch (error) {
      console.error(`[SMTP] Error sending email to ${to}:`, error);
      // Fallback logging in case of SMTP connection error during dev
      logEmailFallback(to, subject, text);
      return true;
    }
  } else {
    logEmailFallback(to, subject, text);
    return true;
  }
}

function logEmailFallback(to: string, subject: string, text: string) {
  console.log("\n========================================================");
  console.log(`[DEV EMAIL FALLBACK] Sending Email to: ${to} (BCC: ${bccEmail || 'none'})`);
  console.log(`Subject: ${subject}`);
  console.log("--------------------------------------------------------");
  console.log(text);
  console.log("========================================================\n");
}

export async function sendVerificationEmail(email: string, name: string, otp: string) {
  const subject = `${otp} is your PrimeInbox verification code`;
  const text = `Hi ${name},

Thank you for signing up for PrimeInbox!

Your verification code is: ${otp}

This code expires in 5 minutes for your security.

If you did not create a PrimeInbox account, you can safely ignore this email.

Best regards,
The PrimeInbox Team

---
PrimeInbox - Email Outreach Platform
Support: contact.primeinbox@gmail.com
Website: ${appUrl}

This is an automated message from a notification-only address that cannot accept incoming email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your PrimeInbox Account</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background-color: #667eea;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">PrimeInbox</h1>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <h2 style="color: #111827; font-size: 22px; font-weight: 600; margin: 0 0 16px; line-height: 1.3;">Verify Your Email Address</h2>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Thank you for signing up for PrimeInbox! Use the verification code below to complete your registration:
              </p>
              <!-- OTP Code Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 24px; background-color: #f3f4f6; border-radius: 8px;">
                    <p style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">Your Verification Code</p>
                    <p style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #667eea; margin: 0; line-height: 1;">${otp}</p>
                  </td>
                </tr>
              </table>
              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 12px 16px; margin: 0 0 24px;">
                <tr>
                  <td>
                    <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 0;">
                      <strong>⏱️ Expires in 5 minutes.</strong> If you didn't request this code, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5; text-align: center; margin: 0 0 8px;">
                <strong>PrimeInbox</strong> - Email Outreach Platform
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
                Questions? Contact <a href="mailto:contact.primeinbox@gmail.com" style="color: #667eea; text-decoration: none;">contact.primeinbox@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
        <!-- Legal Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-top: 16px;">
          <tr>
            <td style="padding: 0 20px;">
              <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
                This is an automated message from a notification-only address. Please do not reply to this email.<br/>
                © ${new Date().getFullYear()} PrimeInbox. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendMail({ to: email, subject, html, text });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  
  const subject = "Reset your PrimeInbox password";
  const text = `Hi ${name},\n\nWe received a request to reset your password. You can reset your password by clicking the link below:\n\n${resetUrl}\n\nThis link will expire in 2 hours.\n\nBest regards,\nThe PrimeInbox Team`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 12px;">
      <h2 style="color: #09090b; font-weight: bold; margin-bottom: 24px;">Reset your password</h2>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">Hi ${name},</p>
      <p style="color: #71717a; font-size: 14px; line-height: 1.5;">We received a request to reset the password linked to your account. Click the button below to set a new password:</p>
      <div style="margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #09090b; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #a1a1aa; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 12px;">Best regards,<br />The PrimeInbox Team</p>
    </div>
  `;

  return await sendMail({ to: email, subject, html, text });
}

export async function sendSuperAdminOtpEmail(email: string, otp: string) {
  const subject = `${otp} is your Super Admin verification code`;
  const text = `SECURITY ALERT - Super Admin Password Change Request

A request has been made to change the PrimeInbox Super Admin password.

Your verification code is: ${otp}

This code expires in 5 minutes for your security.

⚠️ IMPORTANT: If you did not initiate this request, please investigate immediately and secure your account.

Best regards,
The PrimeInbox Security Team

---
PrimeInbox - Email Outreach Platform
Security Contact: contact.primeinbox@gmail.com
Website: ${appUrl}

This is an automated security alert from a notification-only address that cannot accept incoming email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Super Admin Security Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; border: 2px solid #ef4444;">
          <!-- Security Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
              <img src="${appUrl}/logo/primeinbox-logo.png" alt="PrimeInbox" style="height: 40px; width: auto; display: inline-block; filter: brightness(0) invert(1);" />
              <p style="color: #ffffff; font-size: 13px; font-weight: 600; margin: 12px 0 0; text-transform: uppercase; letter-spacing: 1px;">🔒 Security Alert</p>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 32px;">
              <h1 style="color: #111827; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 16px; line-height: 1.3;">Super Admin Password Change</h1>
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 32px;">
                A request has been made to change the <strong style="color: #dc2626;">Super Admin password</strong>. To verify your identity and authorize this change, please use the verification code below:
              </p>
              <!-- OTP Code Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 32px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 3px; border-radius: 12px; display: inline-block;">
                      <div style="background-color: #ffffff; border-radius: 10px; padding: 20px 40px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #dc2626; display: block;">${otp}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Security Warning -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
                <tr>
                  <td>
                    <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 0; font-weight: 600;">
                      ⚠️ SECURITY NOTICE
                    </p>
                    <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 8px 0 0;">
                      This code expires in 5 minutes. If you did not initiate this password change request, <strong>do not share this code</strong> and contact security immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center; margin: 0 0 8px;">
                <strong style="color: #6b7280;">PrimeInbox Security Team</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">
                Security Issues? Contact us at <a href="mailto:contact.primeinbox@gmail.com" style="color: #dc2626; text-decoration: none;">contact.primeinbox@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
        <!-- Legal Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td style="padding: 0 40px;">
              <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
                This is an automated security alert. Please do not reply.<br/>
                © ${new Date().getFullYear()} PrimeInbox. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await sendMail({ to: email, subject, html, text });
}

