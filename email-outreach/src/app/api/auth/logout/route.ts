import { NextRequest, NextResponse } from "next/server";
import { destroySessionCookie, getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (session) {
      // Create Audit Log
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: "LOGOUT",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    }
    
    // Clear cookie
    await destroySessionCookie();
    
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
