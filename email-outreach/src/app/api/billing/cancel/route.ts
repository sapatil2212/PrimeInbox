import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { sendSubscriptionCancelledEmail } from "@/lib/mail";

/**
 * POST /api/billing/cancel
 * 
 * Self-service subscription cancellation for workspace owners.
 * Sets company to CANCELLING status with a grace period until the current
 * billing period ends. The cron job will then deactivate the account.
 * Also cancels the auto-pay mandate to prevent future charges.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = session;

    // 1. Get current company and subscription details
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        workspaceSlug: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Don't allow cancellation if already cancelling, cancelled, or free plan
    if (company.subscriptionStatus === "CANCELLING") {
      return NextResponse.json(
        { error: "Subscription is already being cancelled." },
        { status: 400 }
      );
    }

    if (company.subscriptionStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Subscription is already cancelled." },
        { status: 400 }
      );
    }

    if (company.subscriptionPlan === "BRONZE" || company.subscriptionPlan === "FREE") {
      return NextResponse.json(
        { error: "Free plans cannot be cancelled." },
        { status: 400 }
      );
    }

    // 2. Get subscription end date (current billing period end)
    const subscription = await db.subscription.findUnique({
      where: { companyId },
      select: { currentPeriodEnd: true },
    });

    const subscriptionEndDate = subscription?.currentPeriodEnd || new Date();

    // 3. Perform cancellation in a single transaction
    await db.$transaction(async (tx) => {
      // Mark company as CANCELLING with end date
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: "CANCELLING",
          subscriptionEndDate,
        },
      });

      // Cancel the mandate to prevent future auto-charges
      await tx.mandate.updateMany({
        where: { companyId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });

      // Update subscription status
      await tx.subscription.updateMany({
        where: { companyId },
        data: { status: "CANCELLING" },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "SUBSCRIPTION_CANCELLED",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    });

    // 4. Send cancellation confirmation email to owner
    try {
      const owner = await db.user.findFirst({
        where: { companyId, role: { in: ["OWNER", "ADMIN"] } },
        orderBy: { role: "asc" },
        select: { email: true, name: true },
      });

      if (owner) {
        await sendSubscriptionCancelledEmail(
          owner.email,
          owner.name,
          company.subscriptionPlan,
          subscriptionEndDate
        );
      }
    } catch (emailErr: any) {
      console.warn("[Cancel] Failed to send cancellation email:", emailErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/billing/cancel error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
