import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing campaign and steps
    const campaign = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
      include: {
        steps: true,
        leadLists: { select: { id: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Duplicate Campaign and steps in transaction
    const duplicated = await db.$transaction(async (tx) => {
      const newCampaign = await tx.campaign.create({
        data: {
          companyId: session.companyId!,
          name: `Copy of ${campaign.name}`,
          smtpGroupId: campaign.smtpGroupId,
          smtpAccountId: campaign.smtpAccountId,
          dailySendLimit: campaign.dailySendLimit,
          delayMin: campaign.delayMin,
          delayMax: campaign.delayMax,
          rotationType: campaign.rotationType,
          timezone: campaign.timezone,
          weekendSending: campaign.weekendSending,
          trackingOpens: campaign.trackingOpens,
          trackingClicks: campaign.trackingClicks,
          trackingReplies: campaign.trackingReplies,
          trackingUnsub: campaign.trackingUnsub,
          status: "DRAFT",
          leadLists: {
            connect: campaign.leadLists.map((list) => ({ id: list.id })),
          },
        },
      });

      // Duplicate steps
      await Promise.all(
        campaign.steps.map((step) =>
          tx.campaignStep.create({
            data: {
              campaignId: newCampaign.id,
              stepNumber: step.stepNumber,
              templateId: step.templateId,
              delayDays: step.delayDays,
            },
          })
        )
      );

      return newCampaign;
    });

    // Populate leads
    if (campaign.leadLists.length > 0) {
      const leads = await db.lead.findMany({
        where: {
          listId: { in: campaign.leadLists.map((l) => l.id) },
          companyId: session.companyId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (leads.length > 0) {
        await db.campaignLead.createMany({
          data: leads.map((lead) => ({
            campaignId: duplicated.id,
            leadId: lead.id,
            status: "PENDING",
            currentStepNumber: 1,
            nextSendAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true, campaign: duplicated });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/duplicate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}
