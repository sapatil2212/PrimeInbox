import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// GET: full tenant detail (for the view modal)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const company = await db.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        businessType: true,
        workspaceSlug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        billingSub: {
          select: { status: true, currentPeriodStart: true, currentPeriodEnd: true },
        },
        users: {
          select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { users: true, campaigns: true, leads: true, smtpAccounts: true, templates: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tenant: company });
  } catch (error) {
    console.error("GET /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: edit tenant attributes (name, business type, plan, status)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const body = await req.json();
    const { name, businessType, subscriptionPlan, subscriptionStatus } = body;

    const company = await db.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const allowedStatuses = ["ACTIVE", "TRIALING", "SUSPENDED", "EXPIRED"];
    if (subscriptionStatus && !allowedStatuses.includes(subscriptionStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await db.company.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        businessType: businessType !== undefined ? businessType : undefined,
        subscriptionPlan: subscriptionPlan || undefined,
        subscriptionStatus: subscriptionStatus || undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_EDIT_TENANT",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: `tenant=${id}`,
      },
    });

    return NextResponse.json({ success: true, message: "Tenant updated", tenant: updated });
  } catch (error) {
    console.error("PATCH /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: permanently remove a tenant and all associated data (cascade)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const company = await db.company.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    await db.company.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_DELETE_TENANT",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: `tenant=${id};name=${company.name}`.slice(0, 250),
      },
    });

    return NextResponse.json({ success: true, message: `Deleted tenant "${company.name}"` });
  } catch (error) {
    console.error("DELETE /api/admin/tenants/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
