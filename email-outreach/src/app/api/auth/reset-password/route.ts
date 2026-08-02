import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, otp, password } = result.data;

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }
    
    // Find reset token matching the 6-digit OTP for this user
    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: otp,
      },
    });
    
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check the code sent to your email." },
        { status: 400 }
      );
    }
    
    // Check expiration
    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      db.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(console.error);
      
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }
    
    // Check if new password is the same as the existing password
    const isSamePassword = await bcrypt.compare(password, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password cannot be the same as your old password. Please choose a different password." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Perform transaction
    await db.$transaction(async (tx) => {
      // 1. Update user password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
        },
      });
      
      // 2. Delete used reset token
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_SUCCESS",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
