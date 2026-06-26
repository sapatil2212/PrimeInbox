import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().uuid("Invalid token format"),
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
    
    const { token, password } = result.data;
    
    // Find reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
    
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid password reset link or link has already been used." },
        { status: 400 }
      );
    }
    
    // Check expiration
    if (resetToken.expiresAt < new Date()) {
      // Expiration clean up (async)
      db.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(console.error);
      
      return NextResponse.json(
        { error: "Password reset link has expired. Please request a new link." },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Perform transaction
    await db.$transaction(async (tx) => {
      // 1. Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
        },
      });
      
      // 2. Delete token
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          userId: resetToken.userId,
          action: "PASSWORD_RESET_SUCCESS",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
