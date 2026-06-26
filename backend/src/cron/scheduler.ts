import { db } from "../config/db";
import { SmtpRotationService } from "../services/smtp-rotation.service";
import { processEmailJob } from "../workers/email.worker";

/**
 * Checks if the current time in the target timezone fits outreach sending rules.
 * Business hours: 8 AM to 6 PM.
 * Weekend rule: Toggles sending on Sat/Sun.
 */
function isSendingWindowActive(timezone: string, weekendSending: boolean): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(new Date());
    const weekday = parts.find((p) => p.type === "weekday")?.value; // "Mon", "Sat", etc.
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);

    // Validate weekend rule
    if (!weekendSending && (weekday === "Sat" || weekday === "Sun")) {
      return false;
    }

    // Validate business hours (08:00 to 18:00)
    if (hour < 8 || hour >= 18) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Scheduler] Timezone validation failed for ${timezone}:`, error);
    return true; // Fallback to sending if timezone is invalid
  }
}

/**
 * Schedules an email job to be dispatched after a delay.
 * Uses setTimeout instead of BullMQ — no Redis required.
 */
function scheduleEmailDispatch(
  jobData: { leadId: string; campaignId: string; stepId: string; smtpAccountId: string },
  delayMs: number
): void {
  setTimeout(async () => {
    try {
      await processEmailJob(jobData);
    } catch (err) {
      console.error(`[Scheduler] Email dispatch failed for Lead ${jobData.leadId}:`, err);
    }
  }, delayMs);
}

/**
 * Main scheduler loop executed periodically (e.g. every minute).
 * Scans active campaigns, rotates SMTP accounts, and dispatches outbound email jobs.
 */
export async function runCampaignScheduler() {
  console.log("[Scheduler] Running campaign queue scan...");

  try {
    // 1. Fetch all active campaigns
    const runningCampaigns = await db.campaign.findMany({
      where: { status: "RUNNING" },
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
      },
    });

    for (const campaign of runningCampaigns) {
      // 2. Validate timezone & schedule window
      if (!isSendingWindowActive(campaign.timezone, campaign.weekendSending)) {
        console.log(`[Scheduler] Campaign "${campaign.name}" (${campaign.id}) is outside of active sending hours. Skipping.`);
        continue;
      }

      // 3. Check daily limits for campaign sends
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const sentCountToday = await db.emailEvent.count({
        where: {
          campaignId: campaign.id,
          createdAt: { gte: todayStart },
        },
      });

      const remainingCampaignLimit = campaign.dailySendLimit - sentCountToday;
      if (remainingCampaignLimit <= 0) {
        console.log(`[Scheduler] Campaign "${campaign.name}" has reached its daily limit (${campaign.dailySendLimit}). Skipping.`);
        continue;
      }

      // 4. Query pending leads whose nextSendAt <= now
      const now = new Date();
      const pendingLeads = await db.campaignLead.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING",
          nextSendAt: { lte: now },
        },
        take: Math.min(remainingCampaignLimit, 50), // Batch size per loop
        include: {
          lead: true,
        },
      });

      if (pendingLeads.length === 0) {
        continue;
      }

      console.log(`[Scheduler] Found ${pendingLeads.length} pending leads for Campaign "${campaign.name}"`);

      let lastSelectedSmtpId: string | undefined;

      for (const campaignLead of pendingLeads) {
        const lead = campaignLead.lead;
        const currentStep = campaign.steps.find((s) => s.stepNumber === campaignLead.currentStepNumber);
        
        if (!currentStep) {
          console.error(`[Scheduler] Step ${campaignLead.currentStepNumber} not found in Campaign ${campaign.id}`);
          continue;
        }

        // 5. Select SMTP account from pool via rotation or single account
        const selectedSmtp = await SmtpRotationService.selectSmtpAccount(
          campaign.companyId,
          campaign.smtpGroupId,
          campaign.rotationType,
          lastSelectedSmtpId,
          campaign.smtpAccountId
        );

        if (!selectedSmtp) {
          console.warn(`[Scheduler] No active/available SMTP account found for Campaign "${campaign.name}". Pausing dispatch queue.`);
          break; // Stop processing this campaign since SMTP pool is congested or offline
        }

        lastSelectedSmtpId = selectedSmtp.id;

        // 6. Calculate random anti-spam delay offset (in milliseconds)
        const delayRange = campaign.delayMax - campaign.delayMin;
        const randomSeconds = campaign.delayMin + Math.random() * (delayRange > 0 ? delayRange : 0);
        const delayMs = Math.round(randomSeconds * 1000);

        // 7. Prevent duplicate selection: lock lead by shifting nextSendAt to tomorrow
        const distantFuture = new Date();
        distantFuture.setHours(distantFuture.getHours() + 24); // Shunted forward by 24h to avoid double pick up

        await db.$transaction([
          // Update campaign lead nextSendAt to lock it
          db.campaignLead.update({
            where: {
              campaignId_leadId: {
                campaignId: campaign.id,
                leadId: lead.id,
              },
            },
            data: {
              nextSendAt: distantFuture,
            },
          }),
          // Log enqueued status
          db.campaignLog.create({
            data: {
              campaign: { connect: { id: campaign.id } },
              lead: { connect: { id: lead.id } },
              step: { connect: { id: currentStep.id } },
              smtpAccount: { connect: { id: selectedSmtp.id } },
              action: "ENQUEUED",
              status: "SUCCESS",
              message: `Lead enqueued with random delay of ${Math.round(randomSeconds)}s. Selected SMTP: ${selectedSmtp.username}`,
            },
          }),
        ]);

        // 8. Schedule email dispatch (no BullMQ — uses setTimeout directly)
        scheduleEmailDispatch(
          {
            leadId: lead.id,
            campaignId: campaign.id,
            stepId: currentStep.id,
            smtpAccountId: selectedSmtp.id,
          },
          delayMs
        );

        console.log(`[Scheduler] Scheduled email for ${lead.email} via SMTP ${selectedSmtp.username} with delay: ${delayMs}ms`);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in runCampaignScheduler:", error);
  }
}
