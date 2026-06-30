import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Admin-only: list workspaces awaiting manual activation (paid signups that
 * have not yet been marked paid & activated).
 */
export async function GET(_req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const companies = await db.company.findMany({
      where: { subscriptionStatus: "PENDING_ACTIVATION" },
      select: {
        id: true,
        name: true,
        businessType: true,
        workspaceSlug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        users: {
          where: { role: "OWNER" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { name: true, email: true, contactNo: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pending = companies.map((c) => ({
      id: c.id,
      name: c.name,
      businessType: c.businessType,
      slug: c.workspaceSlug,
      plan: c.subscriptionPlan,
      status: c.subscriptionStatus,
      createdAt: c.createdAt,
      ownerName: c.users[0]?.name || "—",
      ownerEmail: c.users[0]?.email || "—",
      ownerContact: c.users[0]?.contactNo || null,
      users: c._count.users,
    }));

    return NextResponse.json({ success: true, pending });
  } catch (error) {
    console.error("GET /api/admin/pending-activations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
