import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm 24-hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const company = body.company ? String(body.company).trim() : null;
    const businessType = body.businessType ? String(body.businessType).trim() : null;
    const contactNo = body.contactNo ? String(body.contactNo).trim() : null;
    const whatsappNo = body.whatsappNo ? String(body.whatsappNo).trim() : null;
    const message = body.message ? String(body.message).trim() : "";
    const demoDateRaw = body.demoDate ? String(body.demoDate).trim() : null;
    const demoTimeRaw = body.demoTime ? String(body.demoTime).trim() : null;
    const source = body.source ? String(body.source).slice(0, 60) : "contact_form";

    // Validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid work email is required" }, { status: 400 });
    }
    if (!company) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }
    if (!businessType) {
      return NextResponse.json({ error: "Business type is required" }, { status: 400 });
    }
    if (!contactNo || contactNo.length < 6) {
      return NextResponse.json({ error: "Valid contact number is required" }, { status: 400 });
    }
    if (!demoDateRaw) {
      return NextResponse.json({ error: "Demo date is required" }, { status: 400 });
    }
    if (!demoTimeRaw || !TIME_RE.test(demoTimeRaw)) {
      return NextResponse.json({ error: "Valid demo time (HH:mm) is required" }, { status: 400 });
    }

    // Parse date and ensure not in the past
    const demoDate = new Date(demoDateRaw);
    if (Number.isNaN(demoDate.getTime())) {
      return NextResponse.json({ error: "Invalid demo date" }, { status: 400 });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (demoDate < today) {
      return NextResponse.json({ error: "Demo date cannot be in the past" }, { status: 400 });
    }

    // Basic abuse protection: same email within 60s
    const recent = await db.demoEnquiry.findFirst({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json(
        { error: "Please wait a minute before submitting again." },
        { status: 429 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const enquiry = await db.demoEnquiry.create({
      data: {
        name,
        email,
        company,
        businessType,
        contactNo,
        whatsappNo,
        message: message || `Demo requested for ${demoDateRaw} at ${demoTimeRaw}`,
        demoDate,
        demoTime: demoTimeRaw,
        source,
        ipAddress,
        userAgent,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ success: true, id: enquiry.id, createdAt: enquiry.createdAt });
  } catch (error) {
    console.error("POST /api/demo-enquiry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
