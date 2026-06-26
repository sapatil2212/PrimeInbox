import { db } from "../config/db";
import { EmailSenderService } from "../services/email-sender.service";
import {
  injectOpenTrackingPixel,
  rewriteLinksForTracking,
  injectUnsubscribeLink
} from "../services/tracking.service";
import crypto from "crypto";

interface EmailJobData {
  leadId: string;
  campaignId: string;
  stepId: string;
  smtpAccountId: string;
}

/**
 * Interpolates template strings with Lead metadata fields.
 * Replaces {{variableName}} with Lead[variableName] or empty string.
 */
function interpolate(template: string, lead: any): string {
  if (!template) return "";
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    // Check direct properties or custom fields
    if (lead[key] !== undefined && lead[key] !== null) {
      return String(lead[key]);
    }
    if (lead.customFields && typeof lead.customFields === "object" && (lead.customFields as any)[key] !== undefined) {
      return String((lead.customFields as any)[key]);
    }
    return ""; // Fallback to empty string if variable is not resolved
  });
}

/**
 * Processes a single email send job.
 * Called directly by the scheduler (no BullMQ/Redis required).
 */
export async function processEmailJob(data: EmailJobData): Promise<void> {
  const { leadId, campaignId, stepId, smtpAccountId } = data;
  console.log(`[Worker] Processing email - Lead: ${leadId}, Step: ${stepId}, SMTP: ${smtpAccountId}`);

  // 1. Fetch DB records
  const [lead, campaign, step, smtpAccount] = await Promise.all([
    db.lead.findUnique({ where: { id: leadId } }),
    db.campaign.findUnique({ where: { id: campaignId }, include: { steps: true } }),
    db.campaignStep.findUnique({ where: { id: stepId }, include: { template: true } }),
    db.smtpAccount.findUnique({ where: { id: smtpAccountId } }),
  ]);

  if (!lead || !campaign || !step || !smtpAccount) {
    const errMsg = `Missing database records: Lead=${!!lead}, Campaign=${!!campaign}, Step=${!!step}, SMTP=${!!smtpAccount}`;
    console.error(`[Worker] Email job failed: ${errMsg}`);
    throw new Error(errMsg);
  }

  // 2. Safety check: Verify campaign is running and lead is active
  if (campaign.status !== "RUNNING") {
    console.log(`[Worker] Campaign ${campaign.name} is not running (Status: ${campaign.status}). Skipping.`);
    return;
  }

  if (lead.status === "UNSUBSCRIBED" || lead.status === "BOUNCED") {
    console.log(`[Worker] Lead ${lead.email} is in suppressed state (${lead.status}). Skipping.`);
    return;
  }

  // Check suppression list
  const suppressed = await db.suppressionList.findUnique({
    where: {
      companyId_email: {
        companyId: campaign.companyId,
        email: lead.email,
      },
    },
  });

  if (suppressed) {
    console.log(`[Worker] Lead ${lead.email} is suppressed (Reason: ${suppressed.reason}). Skipping.`);
    // Update campaign lead status to suppressed
    await db.campaignLead.update({
      where: {
        campaignId_leadId: { campaignId, leadId },
      },
      data: {
        status: suppressed.reason === "UNSUBSCRIBED" ? "UNSUBSCRIBED" : "BOUNCED",
      },
    });
    return;
  }

  // 3. Interpolate Subject & HTML Body
  let subject = interpolate(step.template.subject, lead);
  let htmlBody = interpolate(step.template.bodyHtml, lead);
  let textBody = step.template.bodyText ? interpolate(step.template.bodyText, lead) : undefined;

  // 4. Create Tracking Event ID
  const eventId = crypto.randomUUID();

  // 5. Apply tracking wrappers if enabled
  if (campaign.trackingOpens) {
    htmlBody = injectOpenTrackingPixel(htmlBody, eventId);
  }
  if (campaign.trackingClicks) {
    htmlBody = rewriteLinksForTracking(htmlBody, eventId);
  }
  if (campaign.trackingUnsub) {
    htmlBody = injectUnsubscribeLink(htmlBody, lead.id, campaign.companyId);
  }

  // 6. Send the outreach email
  try {
    const sendResult = await EmailSenderService.sendEmail(smtpAccount, {
      to: lead.email,
      subject,
      html: htmlBody,
      text: textBody,
      eventId,
      campaignId,
      leadId,
      stepId,
    });

    // 7. Success operations
    const now = new Date();
    await db.$transaction([
      // Create EmailEvent
      db.emailEvent.create({
        data: {
          id: eventId,
          campaign: { connect: { id: campaignId } },
          lead: { connect: { id: leadId } },
          step: { connect: { id: stepId } },
          smtpAccount: smtpAccountId ? { connect: { id: smtpAccountId } } : undefined,
          messageId: sendResult.messageId,
          eventType: "SENT",
          createdAt: now,
        },
      }),
      // Increment SMTP counters
      db.smtpAccount.update({
        where: { id: smtpAccountId },
        data: {
          currentDailyCount: { increment: 1 },
          currentHourlyCount: { increment: 1 },
        },
      }),
      // Log campaign action
      db.campaignLog.create({
        data: {
          campaign: { connect: { id: campaignId } },
          lead: { connect: { id: leadId } },
          step: { connect: { id: stepId } },
          smtpAccount: { connect: { id: smtpAccountId } },
          action: "DISPATCHED",
          status: "SUCCESS",
          message: `Email sent successfully via SMTP: ${smtpAccount.username}. Message-ID: ${sendResult.messageId}`,
          createdAt: now,
        },
      }),
      // Record Lead Activity
      db.leadActivity.create({
        data: {
          lead: { connect: { id: leadId } },
          action: "EMAIL_SENT",
          details: `Sent campaign step ${step.stepNumber}: "${subject}" via ${smtpAccount.fromEmail}`,
          createdAt: now,
        },
      }),
    ]);

    // 8. Progress Campaign Lead to next step
    const nextStep = campaign.steps.find((s) => s.stepNumber === step.stepNumber + 1);
    if (nextStep) {
      // Schedule next step
      const nextSendDate = new Date();
      nextSendDate.setDate(now.getDate() + nextStep.delayDays);

      await db.campaignLead.update({
        where: {
          campaignId_leadId: { campaignId, leadId },
        },
        data: {
          status: "SENT",
          currentStepNumber: nextStep.stepNumber,
          lastSentAt: now,
          nextSendAt: nextSendDate,
        },
      });
      console.log(`[Worker] Lead ${lead.email} scheduled for Step ${nextStep.stepNumber} on ${nextSendDate}`);
    } else {
      // Last step completed
      await db.campaignLead.update({
        where: {
          campaignId_leadId: { campaignId, leadId },
        },
        data: {
          status: "COMPLETED",
          lastSentAt: now,
        },
      });
      
      // Also update CRM Contact status if available
      await db.crmContact.updateMany({
        where: { leadId, companyId: campaign.companyId },
        data: { status: "COMPLETED", lastContactAt: now },
      });

      console.log(`[Worker] Campaign finished for Lead ${lead.email}`);
    }

  } catch (sendErr: any) {
    console.error(`[Worker] Failed to send email via SMTP ${smtpAccount.username}:`, sendErr);
    
    const errorMsg = sendErr.message || "Unknown SMTP dispatch error";

    // 9. Error operations
    try {
      await db.$transaction([
        db.campaignLog.create({
          data: {
            campaign: { connect: { id: campaignId } },
            lead: { connect: { id: leadId } },
            step: { connect: { id: stepId } },
            smtpAccount: { connect: { id: smtpAccountId } },
            action: "DISPATCHED",
            status: "ERROR",
            message: `SMTP Dispatch failed: ${errorMsg}`,
            createdAt: new Date(),
          },
        }),
        db.campaignLead.update({
          where: {
            campaignId_leadId: { campaignId, leadId },
          },
          data: {
            status: "FAILING",
          },
        }),
      ]);
    } catch (logErr) {
      console.error("[Worker] Failed to log error:", logErr);
    }

    // If credentials failed, pause SMTP account
    if (
      errorMsg.toLowerCase().includes("auth") || 
      errorMsg.toLowerCase().includes("credentials") || 
      errorMsg.toLowerCase().includes("username and password")
    ) {
      await db.smtpAccount.update({
        where: { id: smtpAccountId },
        data: {
          status: "INVALID_CREDENTIALS",
          errorLog: errorMsg,
        },
      });
      console.error(`[Worker] SMTP Account ${smtpAccount.username} flagged with INVALID_CREDENTIALS.`);
    }

    throw sendErr;
  }
}
