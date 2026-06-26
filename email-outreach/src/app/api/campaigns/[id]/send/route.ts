import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
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
      select: { id: true, status: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "RUNNING") {
      return NextResponse.json({ error: "Campaign is not currently RUNNING." }, { status: 400 });
    }

    // Send a small batch synchronously so the manual button gives instant feedback.
    const result = await runCampaignSend(id, session.companyId, {
      batchSize: 25,
      applyDelay: false,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      processed: result.processed,
      failed: result.failed,
    });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
