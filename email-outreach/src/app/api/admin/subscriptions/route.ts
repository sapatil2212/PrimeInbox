import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PLAN_MAP } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * GET /api/admin/subscriptions
 * List all company subscriptions with mandate info, plan, renewal dates.
 *
 * PATCH /api/admin/subscriptions
 * Admin override: change plan, cancel, or reactivate a subscription.
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        workspaceSlug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        billingSub: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            gatewayCustomerId: true,
            gatewaySubscriptionId: true,
          },
        },
        mandate: {
          select: {
            id: true,
            zohoMandateId: true,
            zohoCustomerId: true,
            planId: true,
            amount: true,
            paymentMode: true,
            status: true,
            lastChargedAt: true,
            nextChargeAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            transactionId: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            pdfUrl: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const subscriptions = companies.map((c) => {
      const planInfo = PLAN_MAP[c.subscriptionPlan] || null;
      return {
        companyId: c.id,
        companyName: c.name,
        slug: c.workspaceSlug,
        plan: c.subscriptionPlan,
        planPrice: planInfo?.price ?? 0,
        planName: planInfo?.name ?? c.subscriptionPlan,
        subscriptionStatus: c.subscriptionStatus,
        subscription: c.billingSub
          ? {
              id: c.billingSub.id,
              status: c.billingSub.status,
              periodStart: c.billingSub.currentPeriodStart,
              periodEnd: c.billingSub.currentPeriodEnd,
              zohoCustomerId: c.billingSub.gatewayCustomerId,
              zohoSubscriptionId: c.billingSub.gatewaySubscriptionId,
            }
          : null,
        mandate: c.mandate
          ? {
              id: c.mandate.id,
              zohoMandateId: c.mandate.zohoMandateId,
              zohoCustomerId: c.mandate.zohoCustomerId,
              planId: c.mandate.planId,
              amount: c.mandate.amount,
              paymentMode: c.mandate.paymentMode,
              status: c.mandate.status,
              lastChargedAt: c.mandate.lastChargedAt,
              nextChargeAt: c.mandate.nextChargeAt,
            }
          : null,
        lastPayment: c.payments[0] ?? null,
        latestInvoice: c.invoices[0] ?? null,
        userCount: c._count.users,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    console.error("GET /api/admin/subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const {
      companyId,
      action, // "change_plan" | "cancel" | "reactivate"
      newPlan,
      reason,
      effective, // "immediate" | "period_end"
    } = await req.json();

    if (!companyId || !action) {
      return NextResponse.json({ error: "companyId and action required" }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { billingSub: true, mandate: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (action === "change_plan") {
      if (!newPlan || !PLAN_MAP[newPlan]) {
        return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
      }

      await db.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: { subscriptionPlan: newPlan, subscriptionStatus: "ACTIVE" },
        });

        if (company.billingSub) {
          await tx.subscription.update({
            where: { companyId },
            data: {
              status: "ACTIVE",
              gatewayPriceId: `${newPlan.toLowerCase()}_inr`,
            },
          });
        }

        if (company.mandate) {
          await tx.mandate.update({
            where: { companyId },
            data: {
              planId: newPlan,
              amount: PLAN_MAP[newPlan].price,
            },
          });
        }

        // Log to system
        await tx.systemLog.create({
          data: {
            level: "INFO",
            service: "admin",
            message: `Admin changed plan for ${company.name} (${companyId}) to ${newPlan}. Reason: ${reason || "none"}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: `Plan changed to ${newPlan}` });
    }

    if (action === "cancel") {
      const now = new Date();
      await db.$transaction(async (tx) => {
        const downgradeNow = effective === "immediate";

        await tx.company.update({
          where: { id: companyId },
          data: {
            subscriptionStatus: downgradeNow ? "CANCELLED" : "CANCELLING",
            subscriptionPlan: downgradeNow ? "BRONZE" : company.subscriptionPlan,
          },
        });

        if (company.billingSub) {
          await tx.subscription.update({
            where: { companyId },
            data: { status: downgradeNow ? "CANCELLED" : "PENDING_CANCEL" },
          });
        }

        if (company.mandate) {
          await tx.mandate.update({
            where: { companyId },
            data: { status: "REVOKED" },
          });
        }

        await tx.systemLog.create({
          data: {
            level: "WARN",
            service: "admin",
            message: `Admin cancelled subscription for ${company.name} (${companyId}). Effective: ${effective || "immediate"}. Reason: ${reason || "none"}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Subscription cancelled" });
    }

    if (action === "reactivate") {
      await db.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: companyId },
          data: { subscriptionStatus: "ACTIVE" },
        });

        if (company.billingSub) {
          await tx.subscription.update({
            where: { companyId },
            data: { status: "ACTIVE" },
          });
        }

        if (company.mandate && company.mandate.status === "REVOKED") {
          // Cannot reactivate a Zoho mandate automatically — flag for manual renewal
          await tx.mandate.update({
            where: { companyId },
            data: { status: "PENDING_REAUTH" },
          });
        }

        await tx.systemLog.create({
          data: {
            level: "INFO",
            service: "admin",
            message: `Admin reactivated subscription for ${company.name} (${companyId}). Reason: ${reason || "none"}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Subscription reactivated" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/subscriptions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
