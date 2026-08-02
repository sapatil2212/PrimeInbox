import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/admin/invoices
 * Paginated, filterable invoice list across all tenants.
 *
 * Query params:
 *   ?page=1&limit=25&companyId=&status=&from=&to=
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "25"));
    const companyId = searchParams.get("companyId") || undefined;
    const status = searchParams.get("status") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [total, invoices] = await Promise.all([
      db.invoice.count({ where }),
      db.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          company: {
            select: { name: true, workspaceSlug: true, subscriptionPlan: true },
          },
          payments: {
            select: {
              id: true,
              transactionId: true,
              status: true,
              provider: true,
              amount: true,
              currency: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      companyId: inv.companyId,
      companyName: inv.company?.name ?? "Unknown",
      slug: inv.company?.workspaceSlug ?? "",
      plan: inv.company?.subscriptionPlan ?? "UNKNOWN",
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      payments: inv.payments.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        status: p.status,
        provider: p.provider,
        amount: p.amount,
        currency: p.currency,
        createdAt: p.createdAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      invoices: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/invoices error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
