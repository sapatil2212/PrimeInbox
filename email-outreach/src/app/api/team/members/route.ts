import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await db.user.findMany({
      where: { companyId: session.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("GET /api/team/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Verify requesting user is OWNER or ADMIN
    if (session.role !== "OWNER" && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    // Protect owner from deletion
    const target = await db.user.findUnique({ where: { id: memberId } });
    if (target?.role === "OWNER") {
      return NextResponse.json({ error: "Cannot delete workspace Owner" }, { status: 400 });
    }

    // Remove user from the company by resetting companyId
    await db.user.updateMany({
      where: {
        id: memberId,
        companyId: session.companyId,
      },
      data: {
        companyId: null,
      },
    });

    return NextResponse.json({ success: true, message: "Member removed from workspace" });
  } catch (error) {
    console.error("DELETE /api/team/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
