import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { retrievePayment } from "@/lib/zoho-payments";
import { log } from "@/lib/billing-logger";

export const runtime = "nodejs";

/**
 * Verifies a Zoho payment by retrieving its status server-side, then activates
 * the subscription: marks the company ACTIVE, sets the plan, extends the period,
 * and records an invoice + payment.
 *
 * Prevents replay attacks by checking for duplicate transactionId before inserting.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId, paymentsSessionId, planId } = await req.json();
    const plan = getPlan(planId);

    if (!paymentId || !planId || !plan) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    // 1. Verify payment status with Zoho API (server-side)
    const paymentDetails = await retrievePayment(paymentId);

    if (paymentDetails.status !== "succeeded") {
      log.verificationFailure(
        `Payment status is "${paymentDetails.status}", expected "succeeded"`,
        paymentId
      );
      return NextResponse.json(
        { error: `Payment not completed. Status: ${paymentDetails.status}` },
        { status: 400 }
      );
    }

    // 2. Prevent duplicate transactions (replay attacks)
    const existingPayment = await db.payment.findUnique({
      where: { transactionId: paymentId },
    });

    if (existingPayment) {
      log.verificationFailure("Duplicate transaction ID", paymentId);
      return NextResponse.json(
        { error: "This payment has already been processed" },
        { status: 409 }
      );
    }

    // 3. Activate subscription in a single atomic transaction
    const companyId = session.companyId;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    try {
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
            gatewayPriceId: `${plan.id.toLowerCase()}_inr`,
          },
          update: {
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            gatewayPriceId: `${plan.id.toLowerCase()}_inr`,
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
            provider: "zoho",
            transactionId: paymentId,
          },
        });

        // 4. Save/update Mandate for automatic recurring billing if mandate details exist
        const rawObj: any = paymentDetails.rawResponse?.payment || paymentDetails.rawResponse;
        const mandateId = rawObj?.mandate_id || rawObj?.mandate?.mandate_id || paymentId;
        const customerId = rawObj?.customer_id || rawObj?.customer?.customer_id;

        if (mandateId && customerId) {
          await tx.mandate.upsert({
            where: { companyId },
            create: {
              companyId,
              zohoCustomerId: customerId,
              zohoMandateId: mandateId,
              planId: plan.id,
              amount: plan.price,
              paymentMode: paymentDetails.paymentMethod || "RECURRING",
              status: "ACTIVE",
              lastChargedAt: now,
              nextChargeAt: periodEnd,
            },
            update: {
              zohoCustomerId: customerId,
              zohoMandateId: mandateId,
              planId: plan.id,
              amount: plan.price,
              paymentMode: paymentDetails.paymentMethod || "RECURRING",
              status: "ACTIVE",
              lastChargedAt: now,
              nextChargeAt: periodEnd,
              notifiedAt: null,
            },
          });
        }
      });
    } catch (dbError: any) {
      log.databaseFailure("verify-subscription-activate", dbError.message);
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }

    log.paymentSuccess(companyId, plan.id, paymentId);

    return NextResponse.json({
      success: true,
      message: `Subscribed to ${plan.name} successfully`,
      plan: plan.id,
    });
  } catch (error: any) {
    console.error("POST /api/billing/verify error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
