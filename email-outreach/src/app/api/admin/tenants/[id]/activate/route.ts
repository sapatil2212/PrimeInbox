import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { sendWorkspaceActivationEmail } from "@/lib/mail";

export const runtime = "nodejs";

/**
 * Admin-only: mark a PENDING_ACTIVATION workspace as paid and activate it.
 *
 * Sets the company to ACTIVE (keeping the plan chosen at signup, unless an
 * override planId is supplied), records a subscription + invoice + payment for
 * the audit trail, and emails the workspace owner a login link with plan
 * details.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id: companyId } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      planId: planOverride,
      method = "manual",
      reference = "",
      amount,
      durationDays = 30,
      note = "",
    } = body || {};

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          where: { role: "OWNER" },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const planId = planOverride || company.subscriptionPlan;
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Tenant has no valid paid plan to activate" }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + Number(durationDays || 30));
    const finalAmount = amount != null ? Number(amount) : plan.price;

    await db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: plan.id,
          subscriptionStatus: "ACTIVE",
          trialEndsAt: null,
        },
      });

      await tx.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gatewayPriceId: `${plan.id.toLowerCase()}_manual`,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gatewayPriceId: `${plan.id.toLowerCase()}_manual`,
        },
      });

      if (finalAmount > 0) {
        const invoice = await tx.invoice.create({
          data: {
            companyId,
            invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${plan.id}-ACT`,
            amount: finalAmount,
            currency: "inr",
            status: "PAID",
          },
        });

        await tx.payment.create({
          data: {
            companyId,
            invoiceId: invoice.id,
            amount: finalAmount,
            currency: "inr",
            status: "SUCCESS",
            provider: method || "manual",
            transactionId: reference || `manual-${Date.now()}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: "ADMIN_ACTIVATE_WORKSPACE",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: `tenant=${companyId} plan=${plan.id} note=${note}`.slice(0, 250),
        },
      });
    });

    // Notify the workspace owner with a login link + plan details.
    const owner = company.users[0];
    if (owner?.email) {
      sendWorkspaceActivationEmail(owner.email, owner.name, plan.name, {
        price: finalAmount,
        durationDays: Number(durationDays || 30),
      }).catch((err) => {
        console.error("Failed to send workspace activation email:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `${company.name} activated on the ${plan.name} plan${owner?.email ? " — activation email sent." : "."}`,
      emailedTo: owner?.email || null,
    });
  } catch (error: any) {
    console.error("POST /api/admin/tenants/[id]/activate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
