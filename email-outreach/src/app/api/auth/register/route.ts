import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5 hours 30 mins
const getIstDate = (offsetMs = 0) => new Date(Date.now() + IST_OFFSET + offsetMs);

const registerSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().min(6, "Contact number must be at least 6 characters"),
  whatsappNo: z.string().optional(),
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
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { companyName, businessType, name, email, contactNo, whatsappNo, password } = result.data;
    
    // Check if user already exists
    let existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "Email address already registered" },
          { status: 400 }
        );
      }
      
      // Check if the OTP is expired (5 minutes window has passed)
      const activeToken = await db.verificationToken.findFirst({
        where: { userId: existingUser.id },
        orderBy: { expiresAt: "desc" },
      });
      
      const isOtpExpired = !activeToken || activeToken.expiresAt < getIstDate();
      
      if (isOtpExpired) {
        // If expired, clean up unverified user & company, then treat as fresh registration
        const companyId = existingUser.companyId;
        
        await db.$transaction(async (tx) => {
          // Delete user first (cascades verification tokens)
          await tx.user.delete({
            where: { id: existingUser!.id },
          });
          
          // Delete company if no other users are associated with it
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
        
        existingUser = null;
      }
    }
    
    if (existingUser) {
      // If OTP is still valid (within 5 minutes), we allow them to re-register.
      // We will update their profile, generate a new OTP code, send it, and open the modal again.
      const passwordHash = await bcrypt.hash(password, 10);
      
      const { token } = await db.$transaction(async (tx) => {
        // 1. Update company details if it exists
        if (existingUser!.companyId) {
          await tx.company.update({
            where: { id: existingUser!.companyId },
            data: {
              name: companyName,
              businessType,
            },
          });
        }
        
        // 2. Update user profile details and password hash
        await tx.user.update({
          where: { id: existingUser!.id },
          data: {
            name,
            passwordHash,
            contactNo,
            whatsappNo: whatsappNo || null,
          },
        });
        
        // 3. Clean up old tokens
        await tx.verificationToken.deleteMany({
          where: { userId: existingUser!.id },
        });
        
        // 4. Create new 6-digit OTP code valid for 5 minutes
        const tokenString = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = getIstDate(5 * 60 * 1000); // 5 minutes in IST
        
        const verificationToken = await tx.verificationToken.create({
          data: {
            userId: existingUser!.id,
            token: tokenString,
            expiresAt,
          },
        });
        
        // 5. Log Audit
        await tx.auditLog.create({
          data: {
            userId: existingUser!.id,
            action: "REGISTER_RETRY",
            ipAddress: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent"),
          },
        });
        
        return { token: verificationToken };
      });
      
      // Send email (async)
      sendVerificationEmail(existingUser.email, name, token.token).catch((err) => {
        console.error("Failed to send verification email:", err);
      });
      
      return NextResponse.json({
        success: true,
        message: "Account created successfully! Please verify your email.",
      });
    }
    
    // Generate unique workspace slug
    let workspaceSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
      
    // Handle edge case where slug is empty (e.g. only special characters)
    if (!workspaceSlug) {
      workspaceSlug = "workspace-" + Math.floor(Math.random() * 1000);
    }
    
    // Check slug collision
    const existingSlug = await db.company.findUnique({
      where: { workspaceSlug },
    });
    
    if (existingSlug) {
      workspaceSlug = `${workspaceSlug}-${Math.floor(Math.random() * 10000)}`;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Perform transaction
    const { user, token } = await db.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          workspaceSlug,
          businessType,
        },
      });
      
      // 2. Create User
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name,
          email: email.toLowerCase(),
          passwordHash,
          contactNo,
          whatsappNo,
          role: "OWNER",
          status: "PENDING_VERIFICATION",
        },
      });
      
      // 3. Create Verification Token (6-digit OTP code valid for 5 minutes in IST)
      const tokenString = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = getIstDate(5 * 60 * 1000); // 5 minutes in IST
      
      const verificationToken = await tx.verificationToken.create({
        data: {
          userId: user.id,
          token: tokenString,
          expiresAt,
        },
      });
      
      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER",
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent"),
        },
      });
      
      return { user, token: verificationToken };
    });
    
    // Send email (async, don't await to block client response)
    sendVerificationEmail(user.email, user.name, token.token).catch((err) => {
      console.error("Failed to send verification email:", err);
    });
    
    return NextResponse.json({
      success: true,
      message: "Account registered successfully. Please verify your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
