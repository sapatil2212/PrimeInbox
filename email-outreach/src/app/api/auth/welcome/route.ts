import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * POST /api/auth/welcome — marks the current user's hasSeenWelcome flag as true.
 * Called by the WelcomeModal component when the user dismisses the modal.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.user.update({
      where: { id: session.userId },
      data: { hasSeenWelcome: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/welcome error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
