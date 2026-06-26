import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await db.leadList.findMany({
      where: { companyId: session.companyId },
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remap counts to match expected outputs
    const formattedLists = lists.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      createdAt: l.createdAt,
      count: l._count.leads,
    }));

    return NextResponse.json({ success: true, lists: formattedLists });
  } catch (error) {
    console.error("GET /api/leads/lists error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Lead list name is required" }, { status: 400 });
    }

    const list = await db.leadList.create({
      data: {
        companyId: session.companyId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error) {
    console.error("POST /api/leads/lists error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
