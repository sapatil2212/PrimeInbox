import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** GET: list the company's suppression (blacklist) entries — unsubscribed & bounced. */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suppressions = await db.suppressionList.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, reason: true, createdAt: true },
    });

    const counts = {
      total: suppressions.length,
      unsubscribed: suppressions.filter((s) => s.reason === "UNSUBSCRIBED").length,
      bounced: suppressions.filter((s) => s.reason === "BOUNCED").length,
    };

    return NextResponse.json({ success: true, suppressions, counts });
  } catch (error) {
    console.error("GET /api/unsubscribes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST: manually add an email to the suppression list so it's never contacted. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const companyId = session.companyId;

    await db.$transaction([
      db.suppressionList.upsert({
        where: { companyId_email: { companyId, email: clean } },
        update: { reason: "MANUAL" },
        create: { companyId, email: clean, reason: "MANUAL" },
      }),
      // Mark any matching leads as unsubscribed so they're excluded from sends.
      db.lead.updateMany({
        where: { companyId, email: clean },
        data: { status: "UNSUBSCRIBED" },
      }),
    ]);

    return NextResponse.json({ success: true, message: `${clean} added to the suppression list.` });
  } catch (error) {
    console.error("POST /api/unsubscribes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE: remove an entry from the suppression list (re-allow sending to that address). */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing entry id" }, { status: 400 });
    }

    const entry = await db.suppressionList.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await db.$transaction([
      db.suppressionList.delete({ where: { id } }),
      // Reactivate matching leads so they can be contacted again.
      db.lead.updateMany({
        where: { companyId: session.companyId, email: entry.email, status: "UNSUBSCRIBED" },
        data: { status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({ success: true, message: `${entry.email} removed from the suppression list.` });
  } catch (error) {
    console.error("DELETE /api/unsubscribes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
