import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { CampaignStatus, RotationType } from "@prisma/client";
import { runCampaignSend } from "@/lib/campaign-sender";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await db.campaign.findMany({
      where: { companyId: session.companyId },
      include: {
        steps: true,
        _count: {
          select: {
            leads: true,
            emailEvents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Decorate campaigns with counts of Opens, Click, and Reply events
    const decoratedCampaigns = await Promise.all(
      campaigns.map(async (camp) => {
        const [sent, open, click, reply, bounce, activeLeads, totalLeads] = await Promise.all([
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: "SENT" } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: "OPENED" } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: "CLICKED" } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: "REPLIED" } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: "BOUNCED" } }),
          db.campaignLead.count({ where: { campaignId: camp.id, status: { in: ["PENDING", "SENT"] } } }),
          db.campaignLead.count({ where: { campaignId: camp.id } }),
        ]);

        // Reconcile a stuck RUNNING campaign: if every lead is finished, complete it.
        let status = camp.status;
        if (status === "RUNNING" && totalLeads > 0 && activeLeads === 0) {
          await db.campaign.update({ where: { id: camp.id }, data: { status: "COMPLETED" } });
          status = "COMPLETED";
        }

        const progress = totalLeads > 0 ? Math.round(((totalLeads - activeLeads) / totalLeads) * 100) : 0;

        return {
          ...camp,
          status,
          stats: {
            sent,
            open,
            click,
            reply,
            bounce,
            openRate: sent > 0 ? Number(((open / sent) * 100).toFixed(1)) : 0,
            clickRate: sent > 0 ? Number(((click / sent) * 100).toFixed(1)) : 0,
            replyRate: sent > 0 ? Number(((reply / sent) * 100).toFixed(1)) : 0,
            bounceRate: sent > 0 ? Number(((bounce / sent) * 100).toFixed(1)) : 0,
            progress,
            totalLeads,
            activeLeads,
          },
        };
      })
    );

    return NextResponse.json({ success: true, campaigns: decoratedCampaigns });
  } catch (error) {
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      leadListIds, // Array of LeadList IDs
      smtpGroupId,
      smtpAccountId,
      smtpAccountIds, // Array of SMTP account IDs (ad-hoc rotational pool)
      templateId, // Single template (simplified one-step campaign)
      steps: stepsInput, // Optional: explicit multi-step config
      dailySendLimit = 500,
      delayMin = 30,
      delayMax = 180,
      rotationType = "ROUND_ROBIN",
      timezone = "UTC",
      weekendSending = false,
      trackingOpens = true,
      trackingClicks = true,
      trackingReplies = true,
      trackingUnsub = true,
      startNow = false, // Create as RUNNING and dispatch immediately
    } = body;

    // Build steps: prefer explicit steps array, otherwise wrap the single templateId.
    const steps =
      Array.isArray(stepsInput) && stepsInput.length > 0
        ? stepsInput
        : templateId
        ? [{ stepNumber: 1, templateId, delayDays: 0 }]
        : [];

    if (!name || steps.length === 0) {
      return NextResponse.json(
        { error: "Campaign name and an email template are required" },
        { status: 400 }
      );
    }

    const normalizedAccountIds =
      Array.isArray(smtpAccountIds) && smtpAccountIds.length > 0 ? smtpAccountIds : null;

    // 1. Create the campaign and its steps inside a transaction
    const newCampaign = await db.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          companyId: session.companyId!,
          name,
          smtpGroupId: smtpGroupId || null,
          smtpAccountId: smtpAccountId || null,
          smtpAccountIds: normalizedAccountIds || undefined,
          dailySendLimit,
          delayMin,
          delayMax,
          rotationType: rotationType as RotationType,
          timezone,
          weekendSending,
          trackingOpens,
          trackingClicks,
          trackingReplies,
          trackingUnsub,
          status: startNow ? "RUNNING" : "DRAFT",
          // Connect lead lists
          leadLists: leadListIds && leadListIds.length > 0 ? {
            connect: leadListIds.map((id: string) => ({ id })),
          } : undefined,
        },
      });

      // Create campaign steps
      await Promise.all(
        steps.map((step: any) =>
          tx.campaignStep.create({
            data: {
              campaignId: campaign.id,
              stepNumber: step.stepNumber,
              templateId: step.templateId,
              delayDays: step.delayDays || 0,
            },
          })
        )
      );

      return campaign;
    });

    // 2. Fetch all leads associated with the selected lists and populate CampaignLead
    if (leadListIds && leadListIds.length > 0) {
      const leads = await db.lead.findMany({
        where: {
          listId: { in: leadListIds },
          companyId: session.companyId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (leads.length > 0) {
        // Bulk create CampaignLeads
        await db.campaignLead.createMany({
          data: leads.map((lead) => ({
            campaignId: newCampaign.id,
            leadId: lead.id,
            status: "PENDING",
            currentStepNumber: 1,
            nextSendAt: new Date(),
          })),
          skipDuplicates: true,
        });

        console.log(`[Campaign API] Associated ${leads.length} leads with Campaign ${newCampaign.id}`);
      }
    }

    // 3. If requested, dispatch immediately (fire-and-forget on the Node server).
    if (startNow) {
      void runCampaignSend(newCampaign.id, session.companyId!)
        .then((r) => console.log(`[Campaign API] Instant send for ${newCampaign.id}: ${r.message}`))
        .catch((err) => console.error(`[Campaign API] Instant send failed for ${newCampaign.id}:`, err));
    }

    return NextResponse.json(
      { success: true, campaign: newCampaign, started: !!startNow },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
