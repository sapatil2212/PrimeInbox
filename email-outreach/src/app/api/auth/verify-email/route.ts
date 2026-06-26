import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(6, "OTP code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifySchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, token } = result.data;
    
    // 1. Find the user first
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "No pending registration found for this email." },
        { status: 404 }
      );
    }
    
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. You can log in." },
        { status: 400 }
      );
    }
    
    // 2. Find the active token for this user
    const activeToken = await db.verificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { expiresAt: "desc" },
    });
    
    const isOtpExpired = !activeToken || activeToken.expiresAt < getIstDate();
    
    if (isOtpExpired) {
      // Clean up unverified user & company (treat as fresh registration)
      const companyId = user.companyId;
      await db.$transaction(async (tx) => {
        await tx.user.delete({
          where: { id: user.id },
        });
        if (companyId) {
          const remainingUsers = await tx.user.count({
            where: { companyId },
          });
          if (remainingUsers === 0) {
            await tx.company.delete({
              where: { id: companyId },
            });
          }
        }
      });
      
      return NextResponse.json(
        { error: "Verification code has expired. Your pending registration has been cleared. Please register again." },
        { status: 400 }
      );
    }
    
    // 3. Verify the token matches
    if (activeToken.token !== token) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }
    
    // Verify email and update status in transaction
    await db.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          status: "ACTIVE",
        },
      });
      
      // 2. Delete Token
      await tx.verificationToken.delete({
        where: { id: activeToken.id },
      });
      
      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "EMAIL_VERIFIED",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: "Email address verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Email verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
