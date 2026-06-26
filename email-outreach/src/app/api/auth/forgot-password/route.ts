import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

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
      // Return success anyway to protect user privacy
      return NextResponse.json({
        success: true,
        message: "If the email is linked to an account, a password reset link has been sent.",
      });
    }
    
    // Check rate limit: 1 reset link per 60 seconds
    const recentReset = user.passwordResets.find(
      (tok) => Date.now() - tok.createdAt.getTime() < 60 * 1000
    );
    
    if (recentReset) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new password reset link." },
        { status: 429 }
      );
    }
    
    const tokenString = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    
    // Save token in transaction
    const token = await db.$transaction(async (tx) => {
      // 1. Delete old password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      
      // 2. Create new token
      return await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenString,
          expiresAt,
        },
      });
    });
    
    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "REQUEST_PASSWORD_RESET",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent"),
      },
    });
    
    // Send email (async)
    sendPasswordResetEmail(user.email, user.name, token.token).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });
    
    return NextResponse.json({
      success: true,
      message: "If the email is linked to an account, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
