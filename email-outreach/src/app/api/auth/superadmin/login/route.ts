import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setAdminSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  securityKey: z.string().min(1, "Security key is required"),
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
    
    const { email, password, securityKey, rememberMe } = result.data;
    
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "contact.primeinbox@gmail.com";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "primeinbox@2026";
    const superAdminSecurityKey = process.env.SUPER_ADMIN_SECURITY_KEY || "primeinbox@2026";

    // 1. Verify email matches super admin email from env
    if (email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid email, password, or security key." },
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
      // Lazy seed super admin
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

    // 4. Verify password against database hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      // Failed audit log attempt
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "SUPERADMIN_FAILED_LOGIN_ATTEMPT",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });

      return NextResponse.json(
        { error: "Invalid email, password, or security key." },
        { status: 401 }
      );
    }

    // 5. Update last login details
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastIp: ipAddress,
      },
    });

    // 6. Create Audit Log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "SUPERADMIN_LOGIN",
        ipAddress,
        userAgent: req.headers.get("user-agent"),
      },
    });

    // 7. Establish a DEDICATED admin session (isolated from regular user sessions).
    // This cookie is the ONLY thing that grants access to /admin.
    await setAdminSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      rememberMe
    );

    return NextResponse.json({
      success: true,
      message: "Super admin logged in successfully",
    });
  } catch (error) {
    console.error("Super Admin login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
