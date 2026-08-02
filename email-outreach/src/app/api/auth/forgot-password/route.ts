import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendPasswordResetOtpEmail } from "@/lib/mail";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { passwordResets: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please check your email or sign up." },
        { status: 404 }
      );
    }
    
    // Check rate limit: 1 reset request per 60 seconds
    const recentReset = user.passwordResets.find(
      (tok) => Date.now() - tok.createdAt.getTime() < 60 * 1000
    );
    
    if (recentReset) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new password reset code." },
        { status: 429 }
      );
    }
    
    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Save OTP token in database
    const token = await db.$transaction(async (tx) => {
      // 1. Delete old password reset tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      
      // 2. Create new token with 6-digit OTP code
      return await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          token: otpCode,
          expiresAt,
        },
      });
    });
    
    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REQUEST_PASSWORD_RESET_OTP",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent"),
      },
    });
    
    // Send email with 6-digit OTP code
    sendPasswordResetOtpEmail(user.email, user.name, otpCode).catch((err) => {
      console.error("Failed to send password reset OTP email:", err);
    });
    
    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been sent to your email address.",
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
