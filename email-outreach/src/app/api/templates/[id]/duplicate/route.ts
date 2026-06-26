import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const original = await db.emailTemplate.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!original) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const duplicate = await db.emailTemplate.create({
      data: {
        companyId: session.companyId,
        categoryId: original.categoryId,
        name: `${original.name} (Copy)`,
        subject: original.subject,
        bodyHtml: original.bodyHtml,
        bodyText: original.bodyText,
        isDragDrop: original.isDragDrop,
        dragDropData: original.dragDropData || undefined,
        variables: original.variables || undefined,
      },
    });

    return NextResponse.json({ success: true, template: duplicate });
  } catch (error: any) {
    console.error("POST /api/templates/[id]/duplicate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
