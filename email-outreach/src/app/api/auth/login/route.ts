import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie } from "@/lib/session";

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, password, rememberMe } = result.data;
    
    // Find user in DB
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      // Create failed audit log attempt
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "FAILED_LOGIN_ATTEMPT",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }
    
    // If not verified, prevent login
    if (!user.emailVerified) {
      // Check if OTP/registration is expired (5 minutes window has passed)
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
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Please verify your email address before logging in.",
          unverified: true,
          email: user.email,
        },
        { status: 403 }
      );
    }
    
    // Update user details
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastIp: ipAddress,
        status: "ACTIVE", // Force active state upon login
      },
    });
    
    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        ipAddress,
        userAgent: req.headers.get("user-agent"),
      },
    });
    
    // Establish Session
    await setSessionCookie({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
      name: user.name,
    }, rememberMe);
    
    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
