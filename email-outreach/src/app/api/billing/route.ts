import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getTrialState } from "@/lib/access";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = session;

    // 1. Fetch or initialize subscription
    let subscription = await db.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      const monthFromNow = new Date();
      monthFromNow.setDate(monthFromNow.getDate() + 30);

      subscription = await db.subscription.create({
        data: {
          companyId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: monthFromNow,
          stripePriceId: "free_tier",
        },
      });
      // Note: do NOT reset company.subscriptionPlan here — it would wipe the
      // plan the user selected at registration.
    }

    // 2. Fetch invoices and payments
    let invoices = await db.invoice.findMany({
      where: { companyId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });

    // Populate mock invoices & payments if they have none (e.g., initial setup)
    if (invoices.length === 0) {
      const firstInvoice = await db.invoice.create({
        data: {
          companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-1`,
          amount: 0.0,
          currency: "usd",
          status: "PAID",
        },
      });

      await db.payment.create({
        data: {
          companyId,
          invoiceId: firstInvoice.id,
          amount: 0.0,
          currency: "usd",
          status: "SUCCESS",
          provider: "system",
          transactionId: `TXN-FREE-${Date.now().toString().slice(-8)}`,
        },
      });

      // Refetch
      invoices = await db.invoice.findMany({
        where: { companyId },
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { subscriptionPlan: true, name: true, subscriptionStatus: true, trialEndsAt: true },
    });

    const trial = company
      ? getTrialState({
          subscriptionStatus: company.subscriptionStatus,
          subscriptionPlan: company.subscriptionPlan,
          trialEndsAt: company.trialEndsAt,
        })
      : null;

    return NextResponse.json({
      success: true,
      subscription,
      invoices,
      plan: company?.subscriptionPlan || "FREE",
      trial,
    });
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = session;
    const body = await req.json();
    const { plan, amount = 0 } = body; // plan can be FREE, STARTER, PRO, ENTERPRISE

    if (!plan) {
      return NextResponse.json({ error: "Plan parameter is required" }, { status: 450 });
    }

    // 1. Calculate next period end
    const nextPeriodEnd = new Date();
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);

    // 2. Perform transactional update of company and subscription
    const result = await db.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: plan,
        },
      });

      const updatedSub = await tx.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriodEnd,
          stripePriceId: `${plan.toLowerCase()}_tier`,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriodEnd,
          stripePriceId: `${plan.toLowerCase()}_tier`,
        },
      });

      // Create a paid invoice for premium plans
      if (amount > 0) {
        const invoice = await tx.invoice.create({
          data: {
            companyId,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${plan.toUpperCase()}`,
            amount: Number(amount),
            currency: "usd",
            status: "PAID",
          },
        });

        await tx.payment.create({
          data: {
            companyId,
            invoiceId: invoice.id,
            amount: Number(amount),
            currency: "usd",
            status: "SUCCESS",
            provider: "stripe",
            transactionId: `TXN-${plan.toUpperCase()}-${Date.now().toString().slice(-8)}`,
          },
        });
      }

      return { company: updatedCompany, subscription: updatedSub };
    });

    return NextResponse.json({
      success: true,
      message: `Plan updated successfully to ${plan}`,
      plan: result.company.subscriptionPlan,
      subscription: result.subscription,
    });
  } catch (error: any) {
    console.error("POST /api/billing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
