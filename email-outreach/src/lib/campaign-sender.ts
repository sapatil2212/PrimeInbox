import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { getCompanyTrialState } from "@/lib/access";
import { getPlanLimits } from "@/lib/plans";
import type { SmtpAccount } from "@prisma/client";

/**
 * Build a nodemailer transport for an SMTP account, including optional
 * app-level DKIM signing when the account has DKIM fields configured.
 *
 * Note: most managed relays (Gmail, SES, SendGrid, Mailgun) already sign
 * outbound mail with their own DKIM key. App-level signing is only useful
 * for raw SMTP servers that don't sign, and requires a matching DNS record
 * at `<selector>._domainkey.<domain>`.
 */
export function buildTransport(account: SmtpAccount) {
  const password = decrypt(account.passwordEncrypted);
  const secure = account.secureType === "SSL" || account.port === 465;

  const options: nodemailer.TransportOptions & Record<string, unknown> = {
    host: account.host,
    port: account.port,
    secure,
    auth: { user: account.username, pass: password },
    tls: { rejectUnauthorized: false },
  };

  if (account.dkimDomain && account.dkimSelector && account.dkimPrivateKey) {
    try {
      options.dkim = {
        domainName: account.dkimDomain,
        keySelector: account.dkimSelector,
        privateKey: decrypt(account.dkimPrivateKey),
      };
    } catch (e) {
      console.error(`[CampaignSender] Failed to load DKIM key for ${account.fromEmail}:`, e);
    }
  }

  return nodemailer.createTransport(options as nodemailer.TransportOptions);
}

/** Classify an SMTP send error as a hard bounce (permanent) vs transient failure. */
export function isHardBounce(error: any): boolean {
  const code = Number(error?.responseCode ?? error?.code);
  // 5xx SMTP replies are permanent failures.
  if (code >= 500 && code < 600) return true;

  const text = `${error?.response || ""} ${error?.message || ""}`.toLowerCase();
  const signals = [
    "5.1.1",
    "5.1.0",
    "5.1.2",
    "5.4.1",
    "user unknown",
    "no such user",
    "no such recipient",
    "mailbox not found",
    "mailbox unavailable",
    "recipient address rejected",
    "does not exist",
    "address rejected",
    "invalid recipient",
    "unknown recipient",
  ];
  return signals.some((s) => text.includes(s));
}

/**
 * Real campaign email sender.
 *
 * Unlike the legacy `@/lib/mail` helper (which used a single global env-based
 * SMTP transport and silently faked success), this module sends using the
 * SMTP account(s) actually selected on the campaign:
 *   - Single sender  -> campaign.smtpAccountId
 *   - Rotational pool -> campaign.smtpAccountIds (explicit subset) | smtpGroupId | all active
 */

export interface LeadLike {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  companyName?: string | null;
}

/** Replace {{firstName}}, {{lastName}}, {{email}}, {{companyName}} tokens. */
export function interpolate(text: string, lead: LeadLike): string {
  if (!text) return text;
  const replacements: Record<string, string> = {
    "{{firstName}}": lead.firstName || "",
    "{{lastName}}": lead.lastName || "",
    "{{email}}": lead.email || "",
    "{{companyName}}": lead.companyName || "",
  };
  let out = text;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "gi"), value);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip HTML to a readable plain-text alternative (improves spam score; multipart is expected). */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Append a compliant, low-key unsubscribe footer to the HTML body. */
function appendUnsubFooter(html: string, companyId: string, leadId: string): string {
  const url = unsubscribeUrl(companyId, leadId);
  const footer = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;line-height:1.5;">
If you'd prefer not to receive these emails, you can <a href="${url}" style="color:#9ca3af;text-decoration:underline;">unsubscribe here</a>.
</div>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return `${html}${footer}`;
}

/**
 * Resolve the pool of usable SMTP accounts for a campaign, respecting the
 * sender mode chosen during campaign creation.
 */
export async function resolveCampaignSmtpPool(campaign: {
  companyId: string;
  smtpAccountId: string | null;
  smtpGroupId: string | null;
  smtpAccountIds: unknown;
}): Promise<SmtpAccount[]> {
  // 1. Single sender
  if (campaign.smtpAccountId) {
    const acc = await db.smtpAccount.findUnique({ where: { id: campaign.smtpAccountId } });
    return acc && acc.status === "ACTIVE" ? [acc] : [];
  }

  // 2. Explicit rotational subset
  const ids = Array.isArray(campaign.smtpAccountIds) ? (campaign.smtpAccountIds as string[]) : [];
  if (ids.length > 0) {
    return db.smtpAccount.findMany({
      where: { id: { in: ids }, companyId: campaign.companyId, status: "ACTIVE" },
    });
  }

  // 3. Named SMTP group
  if (campaign.smtpGroupId) {
    const mappings = await db.smtpGroupAccount.findMany({
      where: { smtpGroupId: campaign.smtpGroupId },
      include: { smtpAccount: true },
    });
    return mappings.map((m) => m.smtpAccount).filter((a) => a.status === "ACTIVE");
  }

  // 4. Fallback: all active accounts for the company
  return db.smtpAccount.findMany({
    where: { companyId: campaign.companyId, status: "ACTIVE" },
  });
}

/** Send a single email through a specific SMTP account using its decrypted credentials. */
export async function sendViaSmtpAccount(
  account: SmtpAccount,
  payload: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    companyId?: string;
    leadId?: string;
  }
): Promise<{ messageId: string }> {
  const transporter = buildTransport(account);

  // Align the Message-ID with the From domain (default hostnames hurt reputation).
  const fromDomain = account.fromEmail.split("@")[1] || "mail.local";
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${fromDomain}>`;

  // Build the body + headers. One-click unsubscribe is now expected by major providers.
  let html = payload.html;
  const headers: Record<string, string> = {};

  if (payload.companyId && payload.leadId) {
    html = appendUnsubFooter(html, payload.companyId, payload.leadId);
    const unsubUrl = unsubscribeUrl(payload.companyId, payload.leadId);
    headers["List-Unsubscribe"] = `<${unsubUrl}>, <mailto:${account.fromEmail}?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const text = payload.text && payload.text.trim() ? payload.text : htmlToPlainText(html);

  await transporter.sendMail({
    from: `"${account.fromName}" <${account.fromEmail}>`,
    to: payload.to,
    replyTo: account.replyTo || account.fromEmail,
    subject: payload.subject,
    html,
    text,
    messageId,
    headers,
  });

  return { messageId };
}

export interface RunCampaignSendResult {
  processed: number;
  failed: number;
  skipped: number;
  message: string;
}

/**
 * Process pending leads for a campaign, sending real emails through the
 * selected SMTP pool with an anti-spam delay between each send.
 *
 * Designed to be called fire-and-forget on a long-running Node server
 * (e.g. `next start`). It honours the campaign's RUNNING status.
 */
export async function runCampaignSend(
  campaignId: string,
  companyId: string,
  opts: { batchSize?: number; applyDelay?: boolean } = {}
): Promise<RunCampaignSendResult> {
  const batchSize = opts.batchSize ?? 500;
  const applyDelay = opts.applyDelay ?? true;

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId, companyId },
    include: { steps: { include: { template: true }, orderBy: { stepNumber: "asc" } } },
  });

  if (!campaign) return { processed: 0, failed: 0, skipped: 0, message: "Campaign not found" };
  if (campaign.status !== "RUNNING")
    return { processed: 0, failed: 0, skipped: 0, message: "Campaign is not RUNNING" };
  if (!campaign.steps.length)
    return { processed: 0, failed: 0, skipped: 0, message: "Campaign has no steps configured" };

  // Block sending if the company's trial has ended and they're not subscribed.
  const trial = await getCompanyTrialState(companyId);
  if (trial?.blocked) {
    return {
      processed: 0,
      failed: 0,
      skipped: 0,
      message: "Trial period ended. Subscribe to a plan to resume sending.",
    };
  }

  // Enforce the plan's monthly email quota.
  const limits = getPlanLimits(trial?.plan);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const sentThisMonth = await db.emailEvent.count({
    where: { campaign: { companyId }, eventType: "SENT", createdAt: { gte: monthStart } },
  });
  const remainingQuota = limits.emailsPerMonth - sentThisMonth;
  if (remainingQuota <= 0) {
    return {
      processed: 0,
      failed: 0,
      skipped: 0,
      message: `Monthly email limit reached (${limits.emailsPerMonth.toLocaleString()}). Upgrade your plan to send more.`,
    };
  }

  const pool = await resolveCampaignSmtpPool(campaign);
  if (pool.length === 0)
    return { processed: 0, failed: 0, skipped: 0, message: "No active SMTP accounts available for this campaign" };

  const pendingLeads = await db.campaignLead.findMany({
    where: {
      campaignId,
      status: { in: ["PENDING", "SENT"] },
      nextSendAt: { lte: new Date() },
    },
    take: Math.min(batchSize, remainingQuota),
    include: { lead: true },
  });

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  let rotationIdx = 0;

  for (const campaignLead of pendingLeads) {
    const stepConfig = campaign.steps.find((s) => s.stepNumber === campaignLead.currentStepNumber);

    if (!stepConfig) {
      await db.campaignLead.update({
        where: { campaignId_leadId: { campaignId, leadId: campaignLead.leadId } },
        data: { status: "COMPLETED" },
      });
      skipped++;
      continue;
    }

    // Round-robin selection across the resolved pool
    const account = pool[rotationIdx % pool.length];
    rotationIdx++;

    const subject = interpolate(stepConfig.template.subject, campaignLead.lead);
    const html = interpolate(stepConfig.template.bodyHtml, campaignLead.lead);
    const text = stepConfig.template.bodyText
      ? interpolate(stepConfig.template.bodyText, campaignLead.lead)
      : undefined;

    try {
      const { messageId } = await sendViaSmtpAccount(account, {
        to: campaignLead.lead.email,
        subject,
        html,
        text,
        companyId,
        leadId: campaignLead.leadId,
      });

      const nextStep = campaign.steps.find((s) => s.stepNumber === campaignLead.currentStepNumber + 1);
      const nextSendAt = new Date();
      let newStatus: "SENT" | "COMPLETED" = "SENT";
      if (nextStep) {
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays);
      } else {
        newStatus = "COMPLETED";
      }

      await db.$transaction([
        db.campaignLead.update({
          where: { campaignId_leadId: { campaignId, leadId: campaignLead.leadId } },
          data: {
            status: newStatus,
            currentStepNumber: nextStep ? nextStep.stepNumber : campaignLead.currentStepNumber,
            lastSentAt: new Date(),
            nextSendAt,
          },
        }),
        db.emailEvent.create({
          data: {
            campaignId,
            leadId: campaignLead.leadId,
            stepId: stepConfig.id,
            smtpAccountId: account.id,
            eventType: "SENT",
            messageId,
          },
        }),
        db.smtpAccount.update({
          where: { id: account.id },
          data: {
            currentDailyCount: { increment: 1 },
            currentHourlyCount: { increment: 1 },
          },
        }),
        db.campaignLog.create({
          data: {
            campaignId,
            leadId: campaignLead.leadId,
            stepId: stepConfig.id,
            smtpAccountId: account.id,
            action: "EMAIL_SENT",
            status: "SUCCESS",
            message: `Sent step ${stepConfig.stepNumber} to ${campaignLead.lead.email} via ${account.fromEmail}`,
          },
        }),
      ]);

      processed++;
    } catch (error: any) {
      failed++;
      const hardBounce = isHardBounce(error);
      console.error(
        `[CampaignSender] ${hardBounce ? "Hard bounce" : "Send failure"} for ${campaignLead.lead.email}:`,
        error?.message || error
      );

      await db.campaignLog.create({
        data: {
          campaignId,
          leadId: campaignLead.leadId,
          stepId: stepConfig.id,
          smtpAccountId: account.id,
          action: hardBounce ? "EMAIL_BOUNCED" : "EMAIL_FAILED",
          status: "FAIL",
          message: `${hardBounce ? "Hard bounce" : "Failed"} step ${stepConfig.stepNumber} via ${account.fromEmail}: ${error?.message || "Unknown error"}`,
        },
      });

      if (hardBounce) {
        // Permanent failure: suppress the address so it's never contacted again.
        await db.$transaction([
          db.campaignLead.update({
            where: { campaignId_leadId: { campaignId, leadId: campaignLead.leadId } },
            data: { status: "BOUNCED" },
          }),
          db.lead.update({
            where: { id: campaignLead.leadId },
            data: { status: "BOUNCED" },
          }),
          db.suppressionList.upsert({
            where: { companyId_email: { companyId, email: campaignLead.lead.email } },
            update: { reason: "BOUNCED" },
            create: { companyId, email: campaignLead.lead.email, reason: "BOUNCED" },
          }),
          db.emailEvent.create({
            data: {
              campaignId,
              leadId: campaignLead.leadId,
              stepId: stepConfig.id,
              smtpAccountId: account.id,
              eventType: "BOUNCED",
              messageId: `<bounce.${Date.now()}.${Math.random().toString(36).slice(2)}@${account.fromEmail.split("@")[1] || "mail"}>`,
            },
          }),
        ]);
      } else {
        await db.campaignLead.update({
          where: { campaignId_leadId: { campaignId, leadId: campaignLead.leadId } },
          data: { status: "FAILING" },
        });
      }
    }

    // Anti-spam delay between sends (skip after the final lead)
    if (applyDelay && campaignLead !== pendingLeads[pendingLeads.length - 1]) {
      const min = campaign.delayMin ?? 0;
      const max = campaign.delayMax ?? min;
      const range = Math.max(0, max - min);
      const delaySeconds = min + Math.random() * range;
      await sleep(Math.round(delaySeconds * 1000));
    }
  }

  // Auto-complete: if no leads remain actionable (none PENDING and none SENT
  // waiting on a later step), mark the campaign COMPLETED.
  const [remaining, total] = await Promise.all([
    db.campaignLead.count({ where: { campaignId, status: { in: ["PENDING", "SENT"] } } }),
    db.campaignLead.count({ where: { campaignId } }),
  ]);

  if (total > 0 && remaining === 0) {
    await db.campaign.update({ where: { id: campaignId }, data: { status: "COMPLETED" } });
    await db.campaignLog.create({
      data: {
        campaignId,
        action: "CAMPAIGN_COMPLETED",
        status: "SUCCESS",
        message: `All ${total} leads processed. Campaign marked COMPLETED.`,
      },
    });
  }

  return {
    processed,
    failed,
    skipped,
    message: `Processed ${processed} sent, ${failed} failed, ${skipped} skipped.`,
  };
}
