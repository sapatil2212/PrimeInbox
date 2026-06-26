import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendSuperAdminOtpEmail } from "@/lib/mail";

const requestChangeSchema = z.object({
  email: z.string().email("Invalid email address"),
  securityKey: z.string().min(1, "Security key is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = requestChangeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, securityKey, newPassword } = result.data;

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "contact.primeinbox@gmail.com";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "primeinbox@2026";
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

    // 3. Find or seed Super Admin in the database
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(superAdminPassword, 10);
      user = await db.user.create({
        data: {
          name: "Super Admin",
          email: email.toLowerCase(),
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          emailVerified: true,
        },
      });
    }

    // 4. Generate 6-digit verification code
    const tokenString = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = getIstDate(5 * 60 * 1000); // 5 minutes in IST

    // 5. Clean up old tokens and save new token in a transaction
    await db.$transaction(async (tx) => {
      await tx.verificationToken.deleteMany({
        where: { userId: user.id },
      });

      await tx.verificationToken.create({
        data: {
          userId: user.id,
          token: tokenString,
          expiresAt,
        },
      });
    });

    // 6. Dispatch the email to saptechnoeditors@gmail.com
    sendSuperAdminOtpEmail("saptechnoeditors@gmail.com", tokenString).catch((err) => {
      console.error("Failed to send super admin password modification OTP email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "A verification code has been sent to saptechnoeditors@gmail.com. Please check your inbox.",
    });
  } catch (error) {
    console.error("Super Admin request password change API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
