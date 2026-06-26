import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await db.emailTemplate.findMany({
      where: { companyId: session.companyId },
      include: {
        category: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("GET /api/templates error:", error);
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
    const {
      name,
      subject,
      bodyHtml,
      bodyText = null,
      categoryId = null,
      isDragDrop = false,
      dragDropData = {},
      variables = ["firstName", "lastName", "companyName", "email"],
    } = body;

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json({ error: "Name, subject, and bodyHtml are required" }, { status: 400 });
    }

    const template = await db.emailTemplate.create({
      data: {
        companyId: session.companyId,
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        bodyText,
        categoryId: categoryId || null,
        isDragDrop,
        dragDropData,
        variables,
      },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
