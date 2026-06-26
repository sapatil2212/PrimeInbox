import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Creates a Razorpay order for the selected plan. The amount is derived
 * server-side from the plan config (never trusted from the client).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: "INR",
        receipt: `rcpt_${session.companyId.slice(0, 8)}_${Date.now()}`,
        notes: { companyId: session.companyId, planId: plan.id },
      }),
    });

    if (!orderRes.ok) {
      const detail = await orderRes.text();
      console.error("Razorpay order creation failed:", detail);
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 502 });
    }

    const order = await orderRes.json();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      planId: plan.id,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
