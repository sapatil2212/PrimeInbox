/**
 * Structured billing event logger.
 * Outputs JSON-formatted log lines for payment lifecycle events.
 * Never logs secrets, keys, or full request bodies.
 */

interface BillingLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  event: string;
  companyId?: string;
  planId?: string;
  paymentId?: string;
  sessionId?: string;
  eventId?: string;
  eventType?: string;
  message?: string;
}

function emit(entry: BillingLogEntry): void {
  const method =
    entry.level === "error"
      ? console.error
      : entry.level === "warn"
      ? console.warn
      : console.log;

  method(JSON.stringify(entry));
}

export const log = {
  /** Logged when a checkout session is created with Zoho. */
  checkoutCreated(companyId: string, planId: string, sessionId: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "checkout.created",
      companyId,
      planId,
      sessionId,
    });
  },

  /** Logged when a payment is successfully verified and subscription activated. */
  paymentSuccess(companyId: string, planId: string, paymentId: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "payment.success",
      companyId,
      planId,
      paymentId,
    });
  },

  /** Logged when a payment fails or is rejected. */
  paymentFailure(companyId: string, planId: string, message: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "payment.failure",
      companyId,
      planId,
      message,
    });
  },

  /** Logged when payment verification fails (bad signature, invalid status). */
  verificationFailure(message: string, paymentId?: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "verification.failure",
      paymentId,
      message,
    });
  },

  /** Logged when a webhook event is received from Zoho. */
  webhookReceived(eventType: string, eventId: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "webhook.received",
      eventType,
      eventId,
    });
  },

  /** Logged when a webhook event is skipped (duplicate/already processed). */
  webhookDuplicate(eventType: string, eventId: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "webhook.duplicate",
      eventType,
      eventId,
      message: "Event already processed — skipping",
    });
  },

  /** Logged when a database operation fails during billing. */
  databaseFailure(operation: string, message: string): void {
    emit({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "database.failure",
      message: `${operation}: ${message}`,
    });
  },
};
