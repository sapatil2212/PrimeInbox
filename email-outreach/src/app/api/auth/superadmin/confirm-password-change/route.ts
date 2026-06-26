import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const confirmChangeSchema = z.object({
  email: z.string().email("Invalid email address"),
  securityKey: z.string().min(1, "Security key is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  token: z.string().length(6, "Verification code must be exactly 6 digits"),
});

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = confirmChangeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, securityKey, newPassword, token } = result.data;

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "contact.primeinbox@gmail.com";
    const superAdminSecurityKey = process.env.SUPER_ADMIN_SECURITY_KEY || "primeinbox@2026";

    // 1. Verify email matches super admin email from env
    if (email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid email or security key." },
        { status: 401 }
      );
    }

    // 2. Verify security key
    if (securityKey !== superAdminSecurityKey) {
      return NextResponse.json(
        { error: "Invalid security key." },
        { status: 401 }
      );
    }

    // 3. Find Super Admin user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Super Admin account not found." },
        { status: 404 }
      );
    }

    // 4. Retrieve the latest token
    const activeToken = await db.verificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { expiresAt: "desc" },
    });

    const isOtpExpired = !activeToken || activeToken.expiresAt < getIstDate();

    if (isOtpExpired) {
      if (activeToken) {
        db.verificationToken.delete({ where: { id: activeToken.id } }).catch(console.error);
      }
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 5. Verify the token matches
    if (activeToken.token !== token) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    // 6. Update user's password in transaction
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.$transaction(async (tx) => {
      // Update Password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Clear tokens
      await tx.verificationToken.deleteMany({
        where: { userId: user.id },
      });

      // Log Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "SUPERADMIN_PASSWORD_CHANGED",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Super admin password has been changed successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Super Admin confirm password change API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
