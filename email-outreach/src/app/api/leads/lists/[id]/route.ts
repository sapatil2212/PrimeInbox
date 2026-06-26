import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const list = await db.leadList.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!list) {
      return NextResponse.json({ error: "Lead list not found" }, { status: 404 });
    }

    // Query leads belonging to this list, with search filter (email, first name, last name, company)
    const whereClause: any = {
      listId: id,
      companyId: session.companyId,
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { companyName: { contains: search } },
      ],
    };

    const [leads, totalCount] = await Promise.all([
      db.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      }),
      db.lead.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      list,
      leads,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/leads/lists/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const list = await db.leadList.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!list) {
      return NextResponse.json({ error: "Lead list not found" }, { status: 404 });
    }

    // Cascade deletes leads via Prisma Cascade Delete
    await db.leadList.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lead list and all its leads deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/leads/lists/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
