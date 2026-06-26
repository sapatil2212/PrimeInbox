import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access Denied. Super Admin only." }, { status: 403 });
    }

    const admin = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        timezone: true,
        language: true,
      },
    });

    // Report which integrations are configured (presence only — never expose values)
    const integrations = [
      { key: "Database", configured: !!process.env.DATABASE_URL },
      { key: "Redis", configured: !!process.env.REDIS_URL },
      { key: "SMTP / Mail", configured: !!process.env.SMTP_HOST || !!process.env.EMAIL_HOST },
      { key: "Stripe Billing", configured: !!process.env.STRIPE_SECRET_KEY },
      { key: "AI (Gemini)", configured: !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY },
      { key: "Encryption Key", configured: !!process.env.ENCRYPTION_KEY },
    ];

    return NextResponse.json({
      success: true,
      admin,
      platform: {
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: process.platform,
      },
      integrations,
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
