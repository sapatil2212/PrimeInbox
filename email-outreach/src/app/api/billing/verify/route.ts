import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Verifies a Razorpay payment signature and, on success, activates the
 * subscription: marks the company ACTIVE, sets the plan, extends the period,
 * and records an invoice + payment.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, paymentId, signature, planId } = await req.json();
    const plan = getPlan(planId);

    if (!orderId || !paymentId || !signature || !plan) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });
    }

    // Verify signature: HMAC_SHA256(orderId|paymentId, keySecret)
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    const companyId = session.companyId;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: plan.id,
          subscriptionStatus: "ACTIVE",
        },
      });

      await tx.subscription.upsert({
        where: { companyId },
        create: {
          companyId,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripePriceId: `${plan.id.toLowerCase()}_inr`,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripePriceId: `${plan.id.toLowerCase()}_inr`,
        },
      });

      const invoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${plan.id}`,
          amount: plan.price,
          currency: "inr",
          status: "PAID",
        },
      });

      await tx.payment.create({
        data: {
          companyId,
          invoiceId: invoice.id,
          amount: plan.price,
          currency: "inr",
          status: "SUCCESS",
          provider: "razorpay",
          transactionId: paymentId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${plan.name} successfully`,
      plan: plan.id,
    });
  } catch (error: any) {
    console.error("POST /api/billing/verify error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
