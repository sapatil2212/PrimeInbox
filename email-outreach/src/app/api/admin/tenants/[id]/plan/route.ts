import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Admin-only: manually set a tenant's subscription plan (for payments made
 * outside Razorpay — bank transfer, UPI, cash, etc.). Records an invoice and
 * a payment with the chosen provider/reference for an audit trail.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { id: companyId } = await params;
    const body = await req.json();
    const {
      planId,
      method = "manual",
      reference = "",
      amount,
      durationDays = 30,
      note = "",
    } = body;

    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // FREE = downgrade/remove paid access; otherwise must be a known plan.
    const isFree = planId === "FREE";
    const plan = isFree ? null : getPlan(planId);
    if (!isFree && !plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + Number(durationDays || 30));

    const finalAmount = amount != null ? Number(amount) : plan ? plan.price : 0;

    await db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: isFree ? "FREE" : plan!.id,
          subscriptionStatus: isFree ? "ACTIVE" : "ACTIVE",
        },
      });

      await tx.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripePriceId: isFree ? "free_tier" : `${plan!.id.toLowerCase()}_manual`,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripePriceId: isFree ? "free_tier" : `${plan!.id.toLowerCase()}_manual`,
        },
      });

      // Record an invoice + payment for paid manual upgrades.
      if (!isFree && finalAmount > 0) {
        const invoice = await tx.invoice.create({
          data: {
            companyId,
            invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${plan!.id}-MAN`,
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
            transactionId: reference?.trim()
              ? `${method}:${reference.trim()}`
              : `MANUAL-${Date.now().toString().slice(-10)}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.userId,
          action: "ADMIN_MANUAL_PLAN_UPGRADE",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: `plan=${isFree ? "FREE" : plan!.id};method=${method};ref=${reference};note=${note}`.slice(0, 250),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: isFree
        ? "Tenant downgraded to FREE."
        : `Tenant upgraded to ${plan!.name} (${durationDays} days) via ${method}.`,
      plan: isFree ? "FREE" : plan!.id,
    });
  } catch (error: any) {
    console.error("POST /api/admin/tenants/[id]/plan error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
