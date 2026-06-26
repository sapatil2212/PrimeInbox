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
    const body = await req.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    // Verify campaign ownership
    const campaign = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const createdNote = await db.campaignNote.create({
      data: {
        campaignId: id,
        userId: session.userId,
        note: note.trim(),
      },
    });

    return NextResponse.json({ success: true, note: createdNote }, { status: 201 });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
