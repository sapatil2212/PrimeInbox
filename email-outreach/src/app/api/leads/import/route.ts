import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { listId, leads } = body;

    if (!listId || !leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "listId and non-empty leads array are required" }, { status: 450 });
    }

    // Verify list ownership
    const list = await db.leadList.findUnique({
      where: { id: listId, companyId: session.companyId },
    });

    if (!list) {
      return NextResponse.json({ error: "Lead list not found" }, { status: 404 });
    }

    // Fetch suppression list for the company
    const suppressions = await db.suppressionList.findMany({
      where: { companyId: session.companyId },
      select: { email: true },
    });
    const suppressedEmails = new Set(suppressions.map(s => s.email.toLowerCase()));

    // Prepare leads for database insertion
    const leadsData = leads
      .filter((lead: any) => {
        if (!lead.email || typeof lead.email !== "string" || !lead.email.includes("@")) {
          return false; // Skip invalid emails
        }
        return !suppressedEmails.has(lead.email.toLowerCase()); // Skip suppressed emails
      })
      .map((lead: any) => ({
        companyId: session.companyId!,
        listId,
        email: lead.email.trim(),
        firstName: lead.firstName?.trim() || null,
        lastName: lead.lastName?.trim() || null,
        companyName: lead.companyName?.trim() || null,
        title: lead.title?.trim() || null,
        phone: lead.phone?.trim() || null,
        website: lead.website?.trim() || null,
        linkedin: lead.linkedin?.trim() || null,
        location: lead.location?.trim() || null,
        country: lead.country?.trim() || null,
        customFields: lead.customFields || {},
      }));

    if (leadsData.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No valid or new leads to import" });
    }

    // Bulk insert leads, skipping duplicates (unique listId + email)
    const result = await db.lead.createMany({
      data: leadsData,
      skipDuplicates: true,
    });

    // Fetch the newly imported leads to log their import activity
    // Note: createMany in prisma doesn't return created IDs, but we can query them or just log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: "LEAD_IMPORT",
        ipAddress: req.headers.get("x-forwarded-for"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully imported ${result.count} leads.`,
    });
  } catch (error) {
    console.error("POST /api/leads/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
