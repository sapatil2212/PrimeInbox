import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { generateInvoicePdf, InvoiceData } from "@/lib/invoice-pdf";
import { PLAN_MAP } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * GET /api/billing/invoices/[invoiceId]/pdf
 * Tenant endpoint to generate and download PDF for their own company invoice.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            workspaceSlug: true,
            subscriptionPlan: true,
            users: {
              where: { role: "OWNER" },
              take: 1,
              select: { email: true },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            transactionId: true,
            provider: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Security check: Ensure the invoice belongs to the tenant's company (unless super admin)
    if (invoice.companyId !== session.companyId && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: You cannot access this invoice" }, { status: 403 });
    }

    // Fetch mandate details if available
    const mandate = await db.mandate.findUnique({
      where: { companyId: invoice.companyId },
      select: {
        zohoMandateId: true,
        zohoCustomerId: true,
        paymentMode: true,
      },
    });

    // Fetch subscription period
    const subscription = await db.subscription.findUnique({
      where: { companyId: invoice.companyId },
      select: { currentPeriodStart: true, currentPeriodEnd: true },
    });

    const plan = PLAN_MAP[invoice.company?.subscriptionPlan ?? ""] || null;
    const lastPayment = invoice.payments[0];
    const companyEmail = invoice.company?.users?.[0]?.email;

    const subtotal   = invoice.amount;
    const gstPercent = 0;
    const gstAmount  = 0;
    const grandTotal = subtotal;

    const invoiceDate = new Date(invoice.createdAt);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 7);

    const data: InvoiceData = {
      internalInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      zohoTransactionId: lastPayment?.transactionId,
      zohoMandateId: mandate?.zohoMandateId,
      zohoCustomerId: mandate?.zohoCustomerId,
      invoiceDate,
      dueDate,
      periodStart: subscription?.currentPeriodStart,
      periodEnd: subscription?.currentPeriodEnd,
      companyName: invoice.company?.name ?? "Unknown",
      companySlug: invoice.company?.workspaceSlug ?? "",
      companyEmail,
      planId: plan?.id ?? invoice.company?.subscriptionPlan ?? "",
      planName: plan?.name ?? invoice.company?.subscriptionPlan ?? "",
      paymentMode: mandate?.paymentMode ?? lastPayment?.provider ?? "Online",
      lineItems: [
        {
          description: `PrimeInbox ${plan?.name ?? "Subscription"} Plan`,
          period: subscription
            ? `${new Date(subscription.currentPeriodStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
            : "Monthly",
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal,
        },
      ],
      subtotal,
      gstPercent,
      gstAmount,
      grandTotal,
      currency: (invoice.currency || "inr").toUpperCase(),
      status:
        invoice.status === "PAID"
          ? "PAID"
          : invoice.status === "FAILED"
          ? "FAILED"
          : invoice.status === "CANCELLED"
          ? "CANCELLED"
          : "PENDING",
    };

    const pdfBytes = await generateInvoicePdf(data);

    // Flag PDF generation in database if not set
    if (!invoice.pdfUrl) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl: `/api/billing/invoices/${invoiceId}/pdf` },
      });
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GET /api/billing/invoices/[invoiceId]/pdf error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
