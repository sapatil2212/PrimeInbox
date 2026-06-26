import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        profileImage: true,
        lastLogin: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            workspaceSlug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Role distribution summary
    const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      currentUserId: admin.userId,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        emailVerified: u.emailVerified,
        profileImage: u.profileImage,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        company: u.company?.name || "—",
        companySlug: u.company?.workspaceSlug || null,
      })),
      summary: {
        total: users.length,
        verified: users.filter((u) => u.emailVerified).length,
        active: users.filter((u) => u.status === "ACTIVE").length,
        roleCounts,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const VALID_ROLES = ["SUPER_ADMIN", "OWNER", "ADMIN", "MANAGER", "USER"] as const;
const VALID_USER_STATUS = ["ACTIVE", "INACTIVE", "PENDING_VERIFICATION"] as const;

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await req.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2) return NextResponse.json({ error: "Name too short" }, { status: 400 });
      data.name = name;
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      data.email = email;
    }
    if (body.role !== undefined) {
      const role = String(body.role).trim();
      if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = role;
    }
    if (body.status !== undefined) {
      const status = String(body.status).trim();
      if (!VALID_USER_STATUS.includes(status as (typeof VALID_USER_STATUS)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = status;
    }
    if (body.emailVerified !== undefined) {
      data.emailVerified = Boolean(body.emailVerified);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Prevent demoting/locking yourself out
    if (id === admin.userId && (data.role && data.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }

    try {
      const updated = await db.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          profileImage: true,
          lastLogin: true,
          createdAt: true,
          company: { select: { name: true, workspaceSlug: true } },
        },
      });
      return NextResponse.json({
        success: true,
        user: {
          ...updated,
          company: updated.company?.name || "—",
          companySlug: updated.company?.workspaceSlug || null,
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    let ids: string[] = [];
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.ids)) ids = body.ids.map((x: unknown) => String(x));
    }
    if (ids.length === 0) {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
      if (id) ids = [id];
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    }

    // Never allow deleting your own account
    if (ids.includes(admin.userId)) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const result = await db.user.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
