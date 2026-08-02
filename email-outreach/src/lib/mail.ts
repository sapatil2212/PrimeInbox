import nodemailer from "nodemailer";

const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT || "587") === 465,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
};

const hasSMTP = !!(smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass);

const transporter = hasSMTP ? nodemailer.createTransport(smtpConfig) : null;
const fromName = process.env.SMTP_FROM || "PrimeInbox";
const fromEmail = process.env.SMTP_USER || "noreply@primeinbox.dev";
const appUrl = process.env.APP_URL || "http://localhost:3001";

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
          'X-PM-Message-Stream': 'outbound',
          'X-SES-CONFIGURATION-SET': 'transactional',
        },
        messageId: `<${uniqueId}@${domain}>`,
        priority: 'high',
      });
      console.log(`[SMTP] Email sent successfully to ${to} (BCC: ${bccEmail || 'none'}): "${subject}"`);
      return true;
    } catch (error) {
      console.error(`[SMTP] Error sending email to ${to}:`, error);
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

// ─── Shared layout helpers ────────────────────────────────────────────────────

// For email images, never use localhost — email clients can't resolve it.
// Fall back to the production domain if APP_URL points to localhost.
const emailBaseUrl = /localhost|127\.0\.0\.1/i.test(appUrl)
  ? "https://primeinbox.online"
  : appUrl;
const logoUrl = `${emailBaseUrl}/logo/primeinbox-logo.png`;

function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">body, table, td { font-family: Arial, sans-serif !important; }</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Poppins',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">

        <!-- Main card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;">
              <img src="${logoUrl}" alt="PrimeInbox" width="160" style="height:auto;display:block;max-width:160px;" />
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#f0f0f0;"></div></td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#f0f0f0;"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;">
              <p style="font-family:'Poppins',Arial,sans-serif;color:#a1a1aa;font-size:11px;line-height:1.6;margin:0 0 4px;">
                <strong style="color:#71717a;">PrimeInbox</strong> · Email Campaign Platform
              </p>
              <p style="font-family:'Poppins',Arial,sans-serif;color:#a1a1aa;font-size:11px;line-height:1.6;margin:0 0 4px;">
                Questions? <a href="mailto:contact.primeinbox@gmail.com" style="color:#6366f1;text-decoration:none;">contact.primeinbox@gmail.com</a>
              </p>
              <p style="font-family:'Poppins',Arial,sans-serif;color:#d4d4d8;font-size:10px;margin:8px 0 0;">
                © ${new Date().getFullYear()} PrimeInbox. All rights reserved. · Automated message — do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. Verification / OTP email ─────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, otp: string) {
  const subject = `${otp} is your PrimeInbox verification code`;

  const text = `Hi ${name},\n\nThank you for signing up for PrimeInbox!\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes for your security.\n\nIf you did not create a PrimeInbox account, you can safely ignore this email.\n\nBest regards,\nThe PrimeInbox Team\n\n---\nPrimeInbox - Email Campaign Platform\nSupport: contact.primeinbox@gmail.com\nWebsite: ${appUrl}\n\nThis is an automated message from a notification-only address that cannot accept incoming email.`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:600;color:#18181b;margin:0 0 6px;">Verify your email address</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 24px;">
      Hi <strong style="color:#18181b;">${name}</strong>, thanks for signing up. Use the code below to complete your registration.
    </p>

    <!-- OTP box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:24px 20px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Your verification code</p>
          <p style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#6366f1;margin:0;line-height:1;">${otp}</p>
        </td>
      </tr>
    </table>

    <!-- Expiry notice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 4px;">
      <tr>
        <td style="padding:12px 16px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#92400e;margin:0;line-height:1.5;">
            ⏱ <strong>Expires in 5 minutes.</strong> If you didn't request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ─── 2. Password reset OTP email ─────────────────────────────────────────────

export async function sendPasswordResetOtpEmail(email: string, name: string, otp: string) {
  const subject = `${otp} is your PrimeInbox password reset code`;

  const text = `Hi ${name},\n\nWe received a request to reset your password.\n\nYour 6-digit password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you did not request a password reset, please ignore this email or contact support.\n\nBest regards,\nThe PrimeInbox Team`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:600;color:#18181b;margin:0 0 6px;">Reset your password</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 24px;">
      Hi <strong style="color:#18181b;">${name}</strong>, we received a request to reset your password. Use the 6-digit verification code below to set a new password.
    </p>

    <!-- OTP box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:18px 20px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your password reset code</p>
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:6px;color:#4f46e5;margin:0;line-height:1;">${otp}</p>
        </td>
      </tr>
    </table>

    <!-- Expiry notice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:12px 16px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#92400e;margin:0;line-height:1.5;">
            ⏱ <strong>Expires in 15 minutes.</strong> If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ─── 3. Super Admin OTP email ─────────────────────────────────────────────────

export async function sendSuperAdminOtpEmail(email: string, otp: string) {
  const subject = `${otp} is your Super Admin verification code`;

  const text = `SECURITY ALERT - Super Admin Password Change Request\n\nA request has been made to change the PrimeInbox Super Admin password.\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes for your security.\n\n⚠️ IMPORTANT: If you did not initiate this request, please investigate immediately and secure your account.\n\nBest regards,\nThe PrimeInbox Security Team\n\n---\nPrimeInbox - Email Campaign Platform\nSecurity Contact: contact.primeinbox@gmail.com\nWebsite: ${appUrl}\n\nThis is an automated security alert from a notification-only address that cannot accept incoming email.`;

  const body = `
    <!-- Security badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <span style="display:inline-block;background-color:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-family:'Poppins',Arial,sans-serif;font-size:11px;font-weight:600;padding:4px 12px;border-radius:999px;letter-spacing:0.5px;text-transform:uppercase;">🔒 Security Alert</span>
        </td>
      </tr>
    </table>

    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:600;color:#18181b;margin:0 0 6px;text-align:center;">Super Admin Password Change</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 24px;text-align:center;">
      A request has been made to change the <strong style="color:#dc2626;">Super Admin password</strong>. Use the code below to verify your identity.
    </p>

    <!-- OTP box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="padding:24px 20px;background-color:#fafafa;border:1px solid #fecaca;border-radius:12px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Verification code</p>
          <p style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#dc2626;margin:0;line-height:1;">${otp}</p>
        </td>
      </tr>
    </table>

    <!-- Warning notice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:12px 16px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#991b1b;margin:0 0 4px;font-weight:600;">⚠️ Security Notice</p>
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#7f1d1d;margin:0;line-height:1.5;">
            This code expires in <strong>5 minutes</strong>. If you did not initiate this request, do not share this code and contact security immediately.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ─── 4. Workspace activation email ───────────────────────────────────────────

export async function sendWorkspaceActivationEmail(
  email: string,
  name: string,
  planName: string,
  options?: { price?: number; durationDays?: number }
) {
  const loginUrl = `${appUrl}/login`;
  const priceLine = options?.price != null ? `₹${options.price}` : null;
  const durationLine = options?.durationDays ? `${options.durationDays} days` : null;

  const text = `Hi ${name},\n\nGreat news — your PrimeInbox workspace has been activated!\n\nPlan: ${planName}${priceLine ? `\nAmount: ${priceLine}` : ""}${durationLine ? `\nValidity: ${durationLine}` : ""}\n\nYou can now log in and start sending your email campaigns:\n${loginUrl}\n\nBest regards,\nThe PrimeInbox Team\n\n---\nPrimeInbox - Email Campaign Platform\nSupport: contact.primeinbox@gmail.com\nWebsite: ${appUrl}`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:600;color:#18181b;margin:0 0 6px;">Your workspace is now active 🎉</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 24px;">
      Hi <strong style="color:#18181b;">${name}</strong>, we've confirmed your payment and activated your PrimeInbox workspace. You're all set to start launching your email campaigns.
    </p>

    <!-- Plan details box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:18px 20px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:10px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Plan Details</p>
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:16px;font-weight:700;color:#18181b;margin:0 0 4px;">${planName}</p>
          ${priceLine ? `<p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#52525b;margin:0 0 2px;">Amount: <strong>${priceLine}</strong></p>` : ""}
          ${durationLine ? `<p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#52525b;margin:0;">Validity: <strong>${durationLine}</strong></p>` : ""}
        </td>
      </tr>
    </table>

    <!-- CTA button -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;">
      <tr>
        <td align="center">
          <a href="${loginUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">Log in to your workspace</a>
        </td>
      </tr>
    </table>

    <!-- Fallback link -->
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#a1a1aa;text-align:center;margin:0;">
      Or paste this link into your browser:<br/>
      <a href="${loginUrl}" style="color:#6366f1;text-decoration:none;">${loginUrl}</a>
    </p>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject: "Your PrimeInbox workspace is now active", html, text });
}

// ─── 8. Subscription renewal reminder (24 hours before billing) ───────────────

export async function sendSubscriptionRenewalReminder(
  email: string,
  name: string,
  opts: {
    planName: string;
    amount: number;
    renewalDate: Date;
    paymentMode?: string;
    workspaceSlug: string;
  }
) {
  const dateStr = opts.renewalDate.toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const amountStr = `₹${opts.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const billingUrl = `${appUrl}/dashboard/billing`;
  const subject = `Your PrimeInbox subscription renews tomorrow — ${amountStr}`;

  const text = `Hi ${name},\n\nThis is a reminder that your PrimeInbox ${opts.planName} subscription will automatically renew tomorrow on ${dateStr}.\n\nAmount: ${amountStr}\nPayment Method: ${opts.paymentMode || "Auto-Pay"}\n\nNo action is needed — the payment will be deducted automatically. If you wish to update your payment method or cancel, visit:\n${billingUrl}\n\nThank you for using PrimeInbox!\n\nBest regards,\nThe PrimeInbox Team`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Your subscription renews tomorrow</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 22px;">
      Hi <strong style="color:#18181b;">${name}</strong>, just a heads-up that your <strong>${opts.planName} Plan</strong> subscription is set to automatically renew tomorrow.
    </p>

    <!-- Renewal details box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">
      <tr>
        <td style="background-color:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #e8eaf6;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Plan</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:700;float:right;">${opts.planName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #e8eaf6;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Renewal Date</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:700;float:right;">${dateStr}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #e8eaf6;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Amount</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:15px;color:#4f46e5;font-weight:800;float:right;">${amountStr}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payment Method</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:600;float:right;">${opts.paymentMode || "Auto-Pay (Mandate)"}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Info notice -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">
      <tr>
        <td style="padding:12px 16px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#166534;margin:0;line-height:1.5;">
            ✅ <strong>No action needed.</strong> The payment will be deducted automatically via your registered payment method. Ensure sufficient balance is available.
          </p>
        </td>
      </tr>
    </table>

    <!-- Manage link -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 4px;">
      <tr>
        <td align="center">
          <a href="${billingUrl}" style="display:inline-block;padding:11px 28px;background-color:#4f46e5;color:#ffffff;font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">
            Manage Subscription
          </a>
        </td>
      </tr>
    </table>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#a1a1aa;text-align:center;margin:10px 0 0;">
      To cancel or update payment: <a href="${billingUrl}" style="color:#6366f1;text-decoration:none;">${billingUrl}</a>
    </p>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ─── 9. Payment failed / account suspended notification ───────────────────────

export async function sendPaymentFailedEmail(
  email: string,
  name: string,
  opts: {
    planName: string;
    amount: number;
    failedAt: Date;
    workspaceSlug: string;
    paymentUrl: string;
  }
) {
  const dateStr = opts.failedAt.toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const amountStr = `₹${opts.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const subject = `⚠️ Payment failed — your PrimeInbox workspace has been suspended`;

  const text = `Hi ${name},\n\nUnfortunately, we were unable to automatically deduct your PrimeInbox ${opts.planName} subscription renewal of ${amountStr} on ${dateStr}.\n\nAs a result, your workspace (${opts.workspaceSlug}) has been temporarily suspended.\n\nTo restore access, please complete your payment at:\n${opts.paymentUrl}\n\nIf you have any questions, contact us at contact.primeinbox@gmail.com.\n\nThe PrimeInbox Team`;

  const body = `
    <!-- Alert banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td style="padding:14px 18px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#991b1b;font-weight:700;margin:0 0 4px;">⚠️ Automatic payment failed</p>
          <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#b91c1c;margin:0;line-height:1.5;">
            Your workspace has been temporarily suspended until payment is completed.
          </p>
        </td>
      </tr>
    </table>

    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Action required to restore access</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 22px;">
      Hi <strong style="color:#18181b;">${name}</strong>, we were unable to charge your registered payment method for your <strong>${opts.planName} Plan</strong> renewal. Please complete your payment to restore full access to your workspace.
    </p>

    <!-- Failed payment details -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">
      <tr>
        <td style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Plan</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:700;float:right;">${opts.planName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Amount Due</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:15px;color:#dc2626;font-weight:800;float:right;">${amountStr}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Failed On</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:600;float:right;">${dateStr}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;">Workspace</span>
                <span style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#1e293b;font-weight:600;float:right;">/${opts.workspaceSlug}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;">
      <tr>
        <td align="center">
          <a href="${opts.paymentUrl}" style="display:inline-block;padding:13px 34px;background-color:#dc2626;color:#ffffff;font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
            Complete Payment Now →
          </a>
        </td>
      </tr>
    </table>

    <p style="font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#71717a;text-align:center;line-height:1.6;margin:0;">
      Common reasons: insufficient balance, expired card, bank limit exceeded.<br/>
      Ensure funds are available and retry. Need help? <a href="mailto:contact.primeinbox@gmail.com" style="color:#dc2626;">contact.primeinbox@gmail.com</a>
    </p>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ── Subscription Cancelled Confirmation Email ──────────────────────────────
export async function sendSubscriptionCancelledEmail(
  email: string,
  name: string,
  planName: string,
  endDate: Date
) {
  const dateStr = endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const billingUrl = `${appUrl}/dashboard/billing`;
  const subject = `Your PrimeInbox ${planName} subscription has been cancelled`;
  const text = `Hi ${name},\n\nYour ${planName} subscription has been cancelled. Your plan will remain active until ${dateStr}.\n\nYou can resubscribe anytime at: ${billingUrl}`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Subscription Cancelled</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${name}</strong>, your <strong>${planName} Plan</strong> subscription has been cancelled as requested.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;background-color:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:18px 22px;">
      <tr><td style="padding:5px 0;border-bottom:1px solid #fde68a;font-family:'Poppins',Arial,sans-serif;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Status</span>
        <span style="float:right;font-weight:700;color:#d97706;">Cancelling</span>
      </td></tr>
      <tr><td style="padding:5px 0;border-bottom:1px solid #fde68a;font-family:'Poppins',Arial,sans-serif;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Plan Active Until</span>
        <span style="float:right;font-weight:800;color:#1e293b;">${dateStr}</span>
      </td></tr>
      <tr><td style="padding:5px 0;font-family:'Poppins',Arial,sans-serif;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Auto-Pay</span>
        <span style="float:right;font-weight:600;color:#dc2626;">Stopped</span>
      </td></tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr><td style="padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#166534;">
        Your workspace will continue to work normally until <strong>${dateStr}</strong>. After that, your account will be deactivated but your data will be preserved.
      </td></tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="${billingUrl}" style="display:inline-block;padding:11px 28px;background-color:#4f46e5;color:#ffffff;font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">
        Manage Subscription
      </a>
    </td></tr></table>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}

// ── Account Deactivated Email ──────────────────────────────────────────────
export async function sendAccountDeactivatedEmail(
  email: string,
  name: string,
  planName: string
) {
  const billingUrl = `${appUrl}/dashboard/billing`;
  const subject = `Your PrimeInbox account has been deactivated`;
  const text = `Hi ${name},\n\nYour ${planName} subscription period has ended and your account has been deactivated.\n\nYour data is safely preserved. Resubscribe anytime at: ${billingUrl}`;

  const body = `
    <h2 style="font-family:'Poppins',Arial,sans-serif;font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Account Deactivated</h2>
    <p style="font-family:'Poppins',Arial,sans-serif;font-size:13px;color:#52525b;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${name}</strong>, your <strong>${planName} Plan</strong> subscription period has ended and your workspace has been deactivated.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr><td style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#991b1b;">
        <strong>Your data is safely preserved.</strong> You can reactivate your workspace at any time by subscribing to a plan.
      </td></tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="${billingUrl}" style="display:inline-block;padding:13px 34px;background-color:#4f46e5;color:#ffffff;font-family:'Poppins',Arial,sans-serif;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;">
        Reactivate Account
      </a>
    </td></tr></table>
  `;

  const html = emailWrapper(body);
  return await sendMail({ to: email, subject, html, text });
}
