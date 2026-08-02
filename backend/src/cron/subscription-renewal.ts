import { db } from "../config/db";
import { BackendZohoPaymentsService } from "../services/zoho-payments.service";
import nodemailer from "nodemailer";

// ─── Local email sender (backend uses its own SMTP env) ───────────────────────
const appUrl = process.env.APP_URL || "https://primeinbox.online";
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromName = process.env.SMTP_FROM || "PrimeInbox";
const emailBaseUrl = /localhost|127\.0\.0\.1/i.test(appUrl) ? "https://primeinbox.online" : appUrl;
const logoUrl = `${emailBaseUrl}/logo/primeinbox-logo.png`;

const transporter = smtpHost && smtpUser && smtpPass
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
    })
  : null;

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!transporter) {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"${fromName}" <${smtpUser}>`, to, subject, html, text });
    console.log(`[Cron Email] Sent "${subject}" to ${to}`);
  } catch (err: any) {
    console.error(`[Cron Email] Failed to send to ${to}:`, err.message);
  }
}

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background-color:#fff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 40px 20px;">
          <img src="${logoUrl}" alt="PrimeInbox" width="150" style="height:auto;display:block;" />
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#f0f0f0;"></div></td></tr>
        <tr><td style="padding:28px 40px;">${body}</td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#f0f0f0;"></div></td></tr>
        <tr><td style="padding:18px 40px;text-align:center;">
          <p style="color:#a1a1aa;font-size:11px;margin:0;">© ${new Date().getFullYear()} PrimeInbox · <a href="mailto:contact.primeinbox@gmail.com" style="color:#6366f1;text-decoration:none;">contact.primeinbox@gmail.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Helper: get owner email for a company ────────────────────────────────────
async function getCompanyOwner(companyId: string) {
  return db.user.findFirst({
    where: { companyId, role: { in: ["OWNER", "ADMIN"] } },
    orderBy: { role: "asc" },
    select: { email: true, name: true },
  });
}

// ─── Renewal Reminder Email ────────────────────────────────────────────────────
async function sendRenewalReminderEmail(
  ownerEmail: string,
  ownerName: string,
  planName: string,
  amount: number,
  renewalDate: Date,
  paymentMode: string | null,
  workspaceSlug: string
) {
  const dateStr = renewalDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const amountStr = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const billingUrl = `${appUrl}/dashboard/billing`;
  const subject = `Your PrimeInbox subscription renews tomorrow — ${amountStr}`;

  const html = emailWrapper(`
    <h2 style="font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Your subscription renews tomorrow</h2>
    <p style="font-size:13px;color:#52525b;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${ownerName}</strong>, just a heads-up — your <strong>${planName} Plan</strong> subscription will auto-renew tomorrow.
    </p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;background-color:#f8faff;border:1px solid #e0e7ff;border-radius:12px;padding:18px 22px;">
      <tr><td style="padding:5px 0;border-bottom:1px solid #e8eaf6;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Plan</span>
        <span style="float:right;font-weight:700;color:#1e293b;">${planName}</span>
      </td></tr>
      <tr><td style="padding:5px 0;border-bottom:1px solid #e8eaf6;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Renewal Date</span>
        <span style="float:right;font-weight:700;color:#1e293b;">${dateStr}</span>
      </td></tr>
      <tr><td style="padding:5px 0;border-bottom:1px solid #e8eaf6;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Amount</span>
        <span style="float:right;font-size:15px;font-weight:800;color:#4f46e5;">${amountStr}</span>
      </td></tr>
      <tr><td style="padding:5px 0;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Payment Method</span>
        <span style="float:right;font-weight:600;color:#1e293b;">${paymentMode || "Auto-Pay (Mandate)"}</span>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr><td style="padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:12px;color:#166534;">
        ✅ <strong>No action needed.</strong> Payment will be deducted automatically. Ensure your account has sufficient balance.
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="${billingUrl}" style="display:inline-block;padding:11px 28px;background-color:#4f46e5;color:#fff;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">Manage Subscription</a>
    </td></tr></table>
  `);

  const text = `Hi ${ownerName},\n\nYour PrimeInbox ${planName} subscription renews tomorrow (${dateStr}) for ${amountStr}.\nPayment: ${paymentMode || "Auto-Pay"}\n\nNo action needed. Manage at: ${billingUrl}`;
  await sendEmail(ownerEmail, subject, html, text);
}

// ─── Payment Failed Email ─────────────────────────────────────────────────────
async function sendPaymentFailedEmail(
  ownerEmail: string,
  ownerName: string,
  planName: string,
  amount: number,
  workspaceSlug: string
) {
  const amountStr = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const paymentUrl = `${appUrl}/dashboard/billing`;
  const subject = `⚠️ Payment failed — your PrimeInbox workspace has been suspended`;

  const html = emailWrapper(`
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;"><tr>
      <td style="padding:14px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
        <p style="font-size:13px;color:#991b1b;font-weight:700;margin:0 0 4px;">⚠️ Automatic payment failed</p>
        <p style="font-size:12px;color:#b91c1c;margin:0;line-height:1.5;">Your workspace has been temporarily suspended until payment is completed.</p>
      </td>
    </tr></table>
    <h2 style="font-size:17px;font-weight:700;color:#18181b;margin:0 0 6px;">Action required to restore access</h2>
    <p style="font-size:13px;color:#52525b;line-height:1.6;margin:0 0 20px;">
      Hi <strong>${ownerName}</strong>, we were unable to charge your payment method for your <strong>${planName} Plan</strong> renewal of <strong>${amountStr}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:18px 22px;">
      <tr><td style="padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Plan</span>
        <span style="float:right;font-weight:700;color:#1e293b;">${planName}</span>
      </td></tr>
      <tr><td style="padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Amount Due</span>
        <span style="float:right;font-size:15px;font-weight:800;color:#dc2626;">${amountStr}</span>
      </td></tr>
      <tr><td style="padding:5px 0;font-size:12px;">
        <span style="color:#6b7280;font-weight:600;">Workspace</span>
        <span style="float:right;font-weight:600;color:#1e293b;">/${workspaceSlug}</span>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;"><tr><td align="center">
      <a href="${paymentUrl}" style="display:inline-block;padding:13px 34px;background:#dc2626;color:#fff;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;">Complete Payment Now →</a>
    </td></tr></table>
    <p style="font-size:12px;color:#71717a;text-align:center;line-height:1.6;margin:0;">
      Common reasons: insufficient balance, expired card, bank limits.<br/>
      Need help? <a href="mailto:contact.primeinbox@gmail.com" style="color:#dc2626;">contact.primeinbox@gmail.com</a>
    </p>
  `);

  const text = `Hi ${ownerName},\n\nPayment for your PrimeInbox ${planName} subscription (${amountStr}) failed.\nYour workspace /${workspaceSlug} has been suspended.\n\nComplete payment: ${paymentUrl}`;
  await sendEmail(ownerEmail, subject, html, text);
}

// ─── 1. notifyUpcomingRenewals ────────────────────────────────────────────────
/**
 * Sends 24-hour pre-debit notifications for mandates due in ~24 hours.
 * Also sends a user-facing email reminder to the workspace owner.
 * Required by RBI / NPCI mandate execution rules.
 */
export async function notifyUpcomingRenewals() {
  console.log("[Subscription Renewal] Checking for mandates requiring 24h pre-debit notification...");
  try {
    const now = new Date();
    const rangeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h from now
    const rangeEnd   = new Date(now.getTime() + 26 * 60 * 60 * 1000); // 26h from now

    const mandatesToNotify = await db.mandate.findMany({
      where: {
        status: "ACTIVE",
        notifiedAt: null,
        nextChargeAt: { gte: rangeStart, lte: rangeEnd },
      },
    });

    if (mandatesToNotify.length === 0) {
      console.log("[Subscription Renewal] No mandates require notification right now.");
      return;
    }

    console.log(`[Subscription Renewal] Found ${mandatesToNotify.length} mandates to notify.`);

    for (const mandate of mandatesToNotify) {
      if (!mandate.nextChargeAt) continue;

      // 1a. Send Zoho RBI pre-debit notification (required for mandate execution)
      const executionDateStr = mandate.nextChargeAt.toISOString().split("T")[0];
      const zohoOk = await BackendZohoPaymentsService.sendMandateNotification(
        mandate.zohoMandateId,
        mandate.amount,
        executionDateStr
      );

      if (zohoOk) {
        await db.mandate.update({
          where: { id: mandate.id },
          data: { notifiedAt: new Date() },
        });
        console.log(`[Subscription Renewal] Pre-debit notification sent for Mandate ${mandate.id}`);
      }

      // 1b. Send user-facing email reminder to workspace owner
      try {
        const company = await db.company.findUnique({
          where: { id: mandate.companyId },
          select: { workspaceSlug: true, subscriptionPlan: true },
        });
        const owner = await getCompanyOwner(mandate.companyId);

        if (owner && company) {
          await sendRenewalReminderEmail(
            owner.email,
            owner.name,
            mandate.planId,
            mandate.amount,
            mandate.nextChargeAt,
            mandate.paymentMode,
            company.workspaceSlug
          );
        }
      } catch (emailErr: any) {
        console.warn(`[Subscription Renewal] Failed to send reminder email for company ${mandate.companyId}:`, emailErr.message);
      }
    }
  } catch (error: any) {
    console.error("[Subscription Renewal] Error in notifyUpcomingRenewals:", error.message);
  }
}

// ─── 2. processDueRenewals ────────────────────────────────────────────────────
/**
 * Executes due mandate charges for automatic monthly recurring renewals.
 * On failure: sets subscriptionStatus to SUSPENDED and emails the owner.
 */
export async function processDueRenewals() {
  console.log("[Subscription Renewal] Checking for due mandate charges...");
  try {
    const now = new Date();

    const dueMandates = await db.mandate.findMany({
      where: { status: "ACTIVE", nextChargeAt: { lte: now } },
    });

    if (dueMandates.length === 0) {
      console.log("[Subscription Renewal] No due mandate charges right now.");
      return;
    }

    console.log(`[Subscription Renewal] Found ${dueMandates.length} due mandates to charge.`);

    for (const mandate of dueMandates) {
      try {
        console.log(`[Subscription Renewal] Charging Mandate ${mandate.zohoMandateId} for Company ${mandate.companyId}...`);

        const result = await BackendZohoPaymentsService.executeMandateCharge(
          mandate.zohoMandateId,
          mandate.amount,
          "INR",
          { companyId: mandate.companyId, planId: mandate.planId }
        );

        if (result.status === "succeeded" || result.status === "success") {
          // ── SUCCESS ──────────────────────────────────────────────────────
          const newPeriodEnd = new Date(now);
          newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

          await db.$transaction(async (tx) => {
            await tx.mandate.update({
              where: { id: mandate.id },
              data: {
                lastChargedAt: now,
                nextChargeAt: newPeriodEnd,
                notifiedAt: null, // reset for next cycle
              },
            });

            await tx.company.update({
              where: { id: mandate.companyId },
              data: {
                subscriptionPlan: mandate.planId,
                subscriptionStatus: "ACTIVE",
              },
            });

            await tx.subscription.upsert({
              where: { companyId: mandate.companyId },
              create: {
                companyId: mandate.companyId,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: newPeriodEnd,
                gatewayPriceId: `${mandate.planId.toLowerCase()}_inr`,
              },
              update: {
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: newPeriodEnd,
                gatewayPriceId: `${mandate.planId.toLowerCase()}_inr`,
              },
            });

            const invoice = await tx.invoice.create({
              data: {
                companyId: mandate.companyId,
                invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${mandate.planId}-AUTO`,
                amount: mandate.amount,
                currency: "inr",
                status: "PAID",
              },
            });

            await tx.payment.create({
              data: {
                companyId: mandate.companyId,
                invoiceId: invoice.id,
                amount: mandate.amount,
                currency: "inr",
                status: "SUCCESS",
                provider: "zoho",
                transactionId: result.paymentId,
              },
            });

            await tx.systemLog.create({
              data: {
                level: "INFO",
                service: "subscription-renewal",
                message: `Auto-renewal SUCCESS for company ${mandate.companyId} | Plan: ${mandate.planId} | Amount: ${mandate.amount} | PaymentId: ${result.paymentId}`,
              },
            });
          });

          console.log(`[Subscription Renewal] ✅ Renewed ${mandate.planId} for Company ${mandate.companyId}. PaymentId: ${result.paymentId}`);

        } else {
          // ── FAILURE ───────────────────────────────────────────────────────
          console.warn(`[Subscription Renewal] ❌ Charge status "${result.status}" for Mandate ${mandate.zohoMandateId}`);
          await handlePaymentFailure(mandate.companyId, mandate.planId, mandate.amount, now);
        }
      } catch (chargeErr: any) {
        console.error(`[Subscription Renewal] ❌ Charge failed for Mandate ${mandate.zohoMandateId}:`, chargeErr.message);
        await handlePaymentFailure(mandate.companyId, mandate.planId, mandate.amount, now);
      }
    }
  } catch (error: any) {
    console.error("[Subscription Renewal] Error in processDueRenewals:", error.message);
  }
}

// ─── Payment failure handler ──────────────────────────────────────────────────
async function handlePaymentFailure(
  companyId: string,
  planId: string,
  amount: number,
  failedAt: Date
) {
  try {
    // 1. Suspend the company account
    const company = await db.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: "SUSPENDED" },
      select: { workspaceSlug: true, subscriptionPlan: true },
    });

    // 2. Update subscription status
    await db.subscription.updateMany({
      where: { companyId },
      data: { status: "PAYMENT_FAILED" },
    });

    // 3. Record failed payment in DB
    const failedInvoice = await db.invoice.create({
      data: {
        companyId,
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${planId}-FAILED`,
        amount,
        currency: "inr",
        status: "FAILED",
      },
    });

    await db.payment.create({
      data: {
        companyId,
        invoiceId: failedInvoice.id,
        amount,
        currency: "inr",
        status: "FAILED",
        provider: "zoho",
        transactionId: `FAILED-${Date.now()}`,
      },
    });

    // 4. Log the failure
    await db.systemLog.create({
      data: {
        level: "ERROR",
        service: "subscription-renewal",
        message: `Auto-renewal FAILED for company ${companyId} | Plan: ${planId} | Amount: ${amount} | Account SUSPENDED`,
      },
    });

    // 5. Email the owner
    const owner = await getCompanyOwner(companyId);
    if (owner) {
      await sendPaymentFailedEmail(
        owner.email,
        owner.name,
        planId,
        amount,
        company.workspaceSlug
      );
    }

    console.warn(`[Subscription Renewal] Company ${companyId} SUSPENDED due to payment failure.`);
  } catch (err: any) {
    console.error(`[Subscription Renewal] Failed to handle payment failure for ${companyId}:`, err.message);
  }
}
