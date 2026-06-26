import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access Denied. Super Admin only." }, { status: 403 });
    }

    const companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        businessType: true,
        workspaceSlug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            campaigns: true,
            leads: true,
            smtpAccounts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tenants = companies.map((c) => ({
      id: c.id,
      name: c.name,
      businessType: c.businessType,
      slug: c.workspaceSlug,
      plan: c.subscriptionPlan,
      status: c.subscriptionStatus,
      createdAt: c.createdAt,
      users: c._count.users,
      campaigns: c._count.campaigns,
      leads: c._count.leads,
      smtpAccounts: c._count.smtpAccounts,
    }));

    return NextResponse.json({ success: true, tenants });
  } catch (error) {
    console.error("GET /api/admin/tenants error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
