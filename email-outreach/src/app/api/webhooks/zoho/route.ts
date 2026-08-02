import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/zoho-payments";
import { log } from "@/lib/billing-logger";

export const runtime = "nodejs";

function parseMetadata(meta: any): Record<string, string> {
  if (Array.isArray(meta)) {
    const result: Record<string, string> = {};
    for (const item of meta) {
      if (item && item.key) {
        result[item.key] = String(item.value || "");
      }
    }
    return result;
  }
  return meta && typeof meta === "object" ? meta : {};
}

/**
 * Zoho Payments webhook handler.
 *
 * Handles events: payment.succeeded, payment.failed, refund.*
 * Verifies HMAC-SHA256 signature using ZOHO_SIGNING_KEY.
 * Processing is idempotent — duplicate events are detected via WebhookLog.
 *
 * Must respond within 15 seconds with HTTP 200.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body (must be unparsed for signature verification)
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-zoho-webhook-signature") || "";

    // 2. Verify webhook signature
    if (!signatureHeader || !verifyWebhookSignature(rawBody, signatureHeader)) {
      log.verificationFailure("Webhook signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const eventType: string = payload.event_type || "";
    const eventId: string =
      payload.event_id || payload.data?.payment?.payment_id || `evt_${Date.now()}`;

    log.webhookReceived(eventType, eventId);

    // 4. Idempotency check — skip duplicate events
    const existing = await db.webhookLog.findUnique({
      where: { eventId },
    });

    if (existing) {
      log.webhookDuplicate(eventType, eventId);
      return NextResponse.json({ status: "already_processed" });
    }

    // 5. Store webhook log immediately (before processing)
    await db.webhookLog.create({
      data: {
        eventId,
        eventType,
        payload: rawBody,
        status: "processing",
      },
    });

    // 6. Handle event types
    switch (eventType) {
      case "payment.succeeded":
        await handlePaymentSucceeded(payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload);
        break;

      case "mandate.authorized":
        await handleMandateAuthorized(payload);
        break;

      case "mandate.revoked":
      case "mandate.cancelled":
        await handleMandateRevoked(payload);
        break;

      default:
        // Log unknown events but don't fail — Zoho may add new event types
        console.warn(`Unhandled webhook event type: ${eventType}`);
        break;
    }

    // 7. Mark webhook as processed
    await db.webhookLog.update({
      where: { eventId },
      data: { status: "processed" },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("POST /api/webhooks/zoho error:", error);
    // Still return 200 to prevent Zoho from retrying indefinitely
    // The error is logged for manual investigation
    return NextResponse.json({ status: "error_logged" });
  }
}

/**
 * Handles payment.succeeded webhook events.
 * Acts as a backup to the client-side verify flow.
 * Idempotent: skips activation if the payment is already recorded.
 */
async function handlePaymentSucceeded(payload: any): Promise<void> {
  const payment = payload.data?.payment;
  if (!payment) return;

  const paymentId: string = payment.payment_id;
  const metaObj = parseMetadata(payment.meta_data);
  const companyId: string | undefined = metaObj.companyId;
  const planId: string | undefined = metaObj.planId;

  if (!companyId || !planId) {
    console.warn("Webhook payment.succeeded missing companyId/planId in metadata");
    return;
  }

  // Check if payment is already recorded (client-side verify already ran)
  const existingPayment = await db.payment.findUnique({
    where: { transactionId: paymentId },
  });

  if (existingPayment) {
    // Already processed via client-side verify — nothing to do
    return;
  }

  // Activate subscription (same logic as verify route)
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const amount = payment.amount || 0;

  try {
    await db.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: {
          subscriptionPlan: planId,
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
          gatewayPriceId: `${planId.toLowerCase()}_inr`,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gatewayPriceId: `${planId.toLowerCase()}_inr`,
        },
      });

      const invoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber: `INV-${Date.now().toString().slice(-8)}-${planId}-WH`,
          amount,
          currency: "inr",
          status: "PAID",
        },
      });

      await tx.payment.create({
        data: {
          companyId,
          invoiceId: invoice.id,
          amount,
          currency: "inr",
          status: "SUCCESS",
          provider: "zoho",
          transactionId: paymentId,
        },
      });
    });

    log.paymentSuccess(companyId, planId, paymentId);
  } catch (error: any) {
    log.databaseFailure("webhook-payment-succeeded", error.message);
  }
}

/**
 * Handles payment.failed webhook events.
 * Logs the failure for monitoring. Does not change subscription status
 * because the session may allow retries.
 */
async function handlePaymentFailed(payload: any): Promise<void> {
  const payment = payload.data?.payment;
  if (!payment) return;

  const metadata = parseMetadata(payment.meta_data);
  const companyId = metadata.companyId || "unknown";
  const planId = metadata.planId || "unknown";
  const paymentsSessionId = payment.payments_session_id || "unknown";

  console.log(`[Webhook] payment.failed attempt recorded for Payment ID: ${payment.payment_id || "no id"} | Session: ${paymentsSessionId}`);

  // Per Zoho Developer Guidelines:
  // Webhooks trigger for each attempt while session is active. We log the attempt
  // without blocking the user, as the session may succeed in a subsequent retry.
  log.paymentFailure(
    companyId,
    planId,
    `Webhook: payment.failed attempt for payment_id: ${payment.payment_id || "no id"}, session_id: ${paymentsSessionId}`
  );
}

/**
 * Handles mandate.authorized webhook events.
 * Updates the mandate status in the database to ACTIVE.
 */
async function handleMandateAuthorized(payload: any): Promise<void> {
  const mandateData = payload.data?.mandate || payload.data;
  if (!mandateData) return;

  const mandateId: string = mandateData.mandate_id;
  if (!mandateId) return;

  try {
    await db.mandate.updateMany({
      where: { zohoMandateId: mandateId },
      data: { status: "ACTIVE" },
    });
    console.log(`[Webhook] Mandate ${mandateId} marked ACTIVE`);
  } catch (error: any) {
    console.error(`[Webhook] Error updating mandate.authorized: ${error.message}`);
  }
}

/**
 * Handles mandate.revoked / mandate.cancelled webhook events.
 * Updates mandate status to REVOKED and downgrades company subscription.
 */
async function handleMandateRevoked(payload: any): Promise<void> {
  const mandateData = payload.data?.mandate || payload.data;
  if (!mandateData) return;

  const mandateId: string = mandateData.mandate_id;
  if (!mandateId) return;

  try {
    const mandate = await db.mandate.findUnique({
      where: { zohoMandateId: mandateId },
    });

    if (mandate) {
      await db.$transaction([
        db.mandate.update({
          where: { id: mandate.id },
          data: { status: "REVOKED" },
        }),
        db.company.update({
          where: { id: mandate.companyId },
          data: {
            subscriptionPlan: "BRONZE",
            subscriptionStatus: "ACTIVE", // Bronze is free active plan
          },
        }),
      ]);
      console.log(`[Webhook] Mandate ${mandateId} revoked for company ${mandate.companyId}. Plan reset to BRONZE.`);
    }
  } catch (error: any) {
    console.error(`[Webhook] Error processing mandate.revoked: ${error.message}`);
  }
}
