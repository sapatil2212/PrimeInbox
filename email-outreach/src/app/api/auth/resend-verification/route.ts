import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resendSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { verificationTokens: true },
    });
    
    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If the email matches a pending registration, a new verification link has been sent.",
      });
    }
    
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. You can log in." },
        { status: 400 }
      );
    }
    
    // Check if OTP/registration is expired
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
    
    // Check rate limit: If a token was generated in the last 60 seconds, reject
    const recentToken = user.verificationTokens.find(
      (tok) => Date.now() - tok.createdAt.getTime() < 60 * 1000
    );
    
    if (recentToken) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new verification code." },
        { status: 429 }
      );
    }
    
    const tokenString = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = getIstDate(5 * 60 * 1000); // 5 minutes in IST
    
    // Save in transaction: clean up old and save new
    const token = await db.$transaction(async (tx) => {
      // 1. Delete old tokens
      await tx.verificationToken.deleteMany({
        where: { userId: user.id },
      });
      
      // 2. Create new
      return await tx.verificationToken.create({
        data: {
          userId: user.id,
          token: tokenString,
          expiresAt,
        },
      });
    });
    
    // Send email (async)
    sendVerificationEmail(user.email, user.name, token.token).catch((err) => {
      console.error("Failed to send verification email:", err);
    });
    
    return NextResponse.json({
      success: true,
      message: "If the email matches a pending registration, a new verification code has been sent.",
    });
  } catch (error) {
    console.error("Resend verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
