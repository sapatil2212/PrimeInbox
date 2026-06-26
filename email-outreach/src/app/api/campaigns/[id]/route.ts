import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { RotationType, CampaignStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
        leadLists: {
          select: { id: true, name: true },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Retrieve stats
    const [sent, open, click, reply, bounce] = await Promise.all([
      db.emailEvent.count({ where: { campaignId: id, eventType: "SENT" } }),
      db.emailEvent.count({ where: { campaignId: id, eventType: "OPENED" } }),
      db.emailEvent.count({ where: { campaignId: id, eventType: "CLICKED" } }),
      db.emailEvent.count({ where: { campaignId: id, eventType: "REPLIED" } }),
      db.emailEvent.count({ where: { campaignId: id, eventType: "BOUNCED" } }),
    ]);

    // Retrieve leads progress summary
    const leadsProgress = await db.campaignLead.findMany({
      where: { campaignId: id },
      take: 100, // Limit list size
      include: {
        lead: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    });

    // Retrieve recent logs
    const logs = await db.campaignLog.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        lead: { select: { email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
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
      },
      leads: leadsProgress,
      logs,
    });
  } catch (error) {
    console.error("GET /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      smtpGroupId,
      smtpAccountId,
      dailySendLimit,
      delayMin,
      delayMax,
      rotationType,
      timezone,
      weekendSending,
      trackingOpens,
      trackingClicks,
      trackingReplies,
      trackingUnsub,
      status,
    } = body;

    // Check ownership
    const existing = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        name: name || undefined,
        smtpGroupId: smtpGroupId !== undefined ? smtpGroupId : undefined,
        smtpAccountId: smtpAccountId !== undefined ? smtpAccountId : undefined,
        dailySendLimit: dailySendLimit !== undefined ? Number(dailySendLimit) : undefined,
        delayMin: delayMin !== undefined ? Number(delayMin) : undefined,
        delayMax: delayMax !== undefined ? Number(delayMax) : undefined,
        rotationType: rotationType ? (rotationType as RotationType) : undefined,
        timezone: timezone || undefined,
        weekendSending: weekendSending !== undefined ? weekendSending : undefined,
        trackingOpens: trackingOpens !== undefined ? trackingOpens : undefined,
        trackingClicks: trackingClicks !== undefined ? trackingClicks : undefined,
        trackingReplies: trackingReplies !== undefined ? trackingReplies : undefined,
        trackingUnsub: trackingUnsub !== undefined ? trackingUnsub : undefined,
        status: status ? (status as CampaignStatus) : undefined,
      },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error) {
    console.error("PUT /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Cascade delete via database relations
    await db.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
