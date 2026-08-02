import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { db } from "@/lib/db";
import {
  createPaymentSession,
  createZohoCustomer,
  createMandateEnrollmentSession,
  isZohoConfigured,
} from "@/lib/zoho-payments";

export const runtime = "nodejs";

/**
 * Creates a Zoho Payments session for the selected plan.
 * Initiates mandate enrollment for recurring subscriptions (supporting Cards SI, UPI AutoPay, Netbanking eNACH).
 * Falls back to standard single payment session if mandate enrollment is unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (plan.free || plan.price <= 0) {
      return NextResponse.json(
        { error: "This plan is free and does not require checkout." },
        { status: 400 }
      );
    }

    if (!isZohoConfigured()) {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const accountId = process.env.ZOHO_ACCOUNT_ID!;
    const apiKey = process.env.ZOHO_API_KEY!;

    // 1. Fetch user & existing mandate details
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true, contactNo: true },
    });

    const existingMandate = await db.mandate.findUnique({
      where: { companyId: session.companyId },
    });

    let customerId = existingMandate?.zohoCustomerId;

    // 2. Create customer on Zoho if not present
    if (!customerId) {
      try {
        const customer = await createZohoCustomer(
          user?.name || "PrimeInbox User",
          user?.email || `user-${session.userId}@primeinbox.online`,
          user?.contactNo || undefined
        );
        customerId = customer.customerId;
      } catch (custErr: any) {
        console.warn("[Checkout] Zoho customer creation warning:", custErr.message);
      }
    }

    // 3. Try creating a mandate enrollment session (recurring subscription)
    let result;
    if (customerId) {
      try {
        result = await createMandateEnrollmentSession(customerId, plan.price, "INR", {
          companyId: session.companyId,
          planId: plan.id,
        });
      } catch (mandateErr: any) {
        console.warn("[Checkout] Mandate session failed, falling back to standard session:", mandateErr.message);
      }
    }

    // Fall back to standard session if mandate enrollment session failed or customer couldn't be created
    if (!result) {
      result = await createPaymentSession(plan.price, "INR", {
        companyId: session.companyId,
        planId: plan.id,
      });
    }

    return NextResponse.json({
      success: true,
      paymentsSessionId: result.paymentsSessionId,
      amount: plan.price,
      currency: "INR",
      accountId,
      apiKey,
      planId: plan.id,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
