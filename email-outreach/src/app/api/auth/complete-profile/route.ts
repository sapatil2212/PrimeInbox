import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const completeProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  timezone: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  theme: z.string().min(1, "Theme is required"),
  profileImage: z.string().nullable().optional(),
  contactNo: z.string().nullable().optional(),
  whatsappNo: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const result = completeProfileSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, timezone, language, theme, profileImage, contactNo, whatsappNo } = result.data;
    
    // Check if email is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        email,
        NOT: { id: session.userId },
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use by another account" },
        { status: 400 }
      );
    }
    
    // Update User Profile
    await db.user.update({
      where: { id: session.userId },
      data: {
        name,
        email,
        timezone: timezone !== undefined ? timezone : undefined,
        language,
        theme,
        profileImage,
        contactNo,
        whatsappNo,
      },
    });
    
    // Log Audit
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: "COMPLETE_PROFILE",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent"),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Complete profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
