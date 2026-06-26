import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { CampaignStatus } from "@prisma/client";
import { runCampaignSend } from "@/lib/campaign-sender";

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

    const campaign = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "COMPLETED" || campaign.status === "ARCHIVED") {
      return NextResponse.json(
        { error: `Campaign is ${campaign.status.toLowerCase()} and cannot be resumed.` },
        { status: 400 }
      );
    }

    let newStatus: CampaignStatus;
    if (campaign.status === "RUNNING") {
      newStatus = "PAUSED";
    } else {
      newStatus = "RUNNING";
    }

    const updated = await db.campaign.update({
      where: { id },
      data: { status: newStatus },
    });

    // Log the toggle action
    await db.campaignLog.create({
      data: {
        campaign: { connect: { id } },
        action: "STATUS_TOGGLED",
        status: "SUCCESS",
        message: `Campaign status updated from ${campaign.status} to ${newStatus}`,
      },
    });

    // Starting/resuming a campaign should kick off sending immediately.
    if (newStatus === "RUNNING" && session.companyId) {
      void runCampaignSend(id, session.companyId)
        .then((r) => console.log(`[Toggle] Send run for ${id}: ${r.message}`))
        .catch((err) => console.error(`[Toggle] Send run failed for ${id}:`, err));
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
