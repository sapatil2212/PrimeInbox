import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CLOSED"] as const;
type Status = (typeof VALID_STATUSES)[number];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(_req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const enquiries = await db.demoEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const summary = {
      total: enquiries.length,
      new: enquiries.filter((e) => e.status === "NEW").length,
      contacted: enquiries.filter((e) => e.status === "CONTACTED").length,
      scheduled: enquiries.filter((e) => e.status === "SCHEDULED").length,
      completed: enquiries.filter((e) => e.status === "COMPLETED").length,
      closed: enquiries.filter((e) => e.status === "CLOSED").length,
    };

    return NextResponse.json({ success: true, enquiries, summary });
  } catch (error) {
    console.error("GET /api/admin/demo-enquiry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: Record<string, unknown> = {};

    // Status
    if (body.status !== undefined) {
      const status = String(body.status).trim() as Status;
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
      if (status === "CONTACTED") data.contactedAt = new Date();
    }

    // Editable contact fields
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 });
      data.name = name;
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      data.email = email;
    }
    if (body.company !== undefined) data.company = String(body.company || "").trim() || null;
    if (body.businessType !== undefined) data.businessType = String(body.businessType || "").trim() || null;
    if (body.contactNo !== undefined) data.contactNo = String(body.contactNo || "").trim() || null;
    if (body.whatsappNo !== undefined) data.whatsappNo = String(body.whatsappNo || "").trim() || null;
    if (body.message !== undefined) data.message = String(body.message || "");
    if (body.notes !== undefined) data.notes = String(body.notes || "");

    // Demo slot
    if (body.demoDate !== undefined) {
      if (body.demoDate === null || body.demoDate === "") {
        data.demoDate = null;
      } else {
        const d = new Date(String(body.demoDate));
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: "Invalid demo date" }, { status: 400 });
        }
        data.demoDate = d;
      }
    }
    if (body.demoTime !== undefined) {
      const t = String(body.demoTime || "").trim();
      if (t && !TIME_RE.test(t)) {
        return NextResponse.json({ error: "Invalid demo time" }, { status: 400 });
      }
      data.demoTime = t || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db.demoEnquiry.update({ where: { id }, data });
    return NextResponse.json({ success: true, enquiry: updated });
  } catch (error) {
    console.error("PATCH /api/admin/demo-enquiry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    // Bulk delete via JSON body
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.ids) && body.ids.length > 0) {
        const ids = body.ids.map((x: unknown) => String(x));
        const result = await db.demoEnquiry.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ success: true, count: result.count });
      }
    }

    // Single delete via query
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    }
    await db.demoEnquiry.delete({ where: { id } });
    return NextResponse.json({ success: true, count: 1 });
  } catch (error) {
    console.error("DELETE /api/admin/demo-enquiry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
