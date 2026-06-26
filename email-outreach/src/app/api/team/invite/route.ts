import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role security check
    if (session.role !== "OWNER" && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = "USER" } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();

    // Check if user already has an active workspace
    const existingUser = await db.user.findUnique({
      where: { email: targetEmail },
    });

    if (existingUser) {
      if (existingUser.companyId === session.companyId) {
        return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 400 });
      }

      // Add existing user to the workspace
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          companyId: session.companyId,
          role: role as UserRole,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Existing user ${targetEmail} added to the workspace.`,
      });
    }

    // If user does not exist, create a placeholder invited user account
    const dummyPasswordHash = await bcrypt.hash("pi_invited_temp_pwd_2026", 10);

    const invitedUser = await db.user.create({
      data: {
        companyId: session.companyId,
        email: targetEmail,
        name: "Invited Collaborator",
        passwordHash: dummyPasswordHash,
        role: role as UserRole,
        status: "PENDING_VERIFICATION",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Collaborator invite record created for ${targetEmail}.`,
      invitedUser: {
        id: invitedUser.id,
        email: invitedUser.email,
        role: invitedUser.role,
      },
    });

  } catch (error) {
    console.error("POST /api/team/invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
