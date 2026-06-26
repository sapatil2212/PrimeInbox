import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await db.templateCategory.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("GET /api/templates/categories error:", error);
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const category = await db.templateCategory.create({
      data: {
        companyId: session.companyId,
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates/categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
