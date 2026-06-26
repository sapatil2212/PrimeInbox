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

    const template = await db.emailTemplate.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("GET /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      subject,
      bodyHtml,
      bodyText,
      categoryId,
      variables,
      isDragDrop,
      dragDropData,
    } = body;

    const existing = await db.emailTemplate.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updated = await db.emailTemplate.update({
      where: { id },
      data: {
        name: name || undefined,
        subject: subject || undefined,
        bodyHtml: bodyHtml || undefined,
        bodyText: bodyText !== undefined ? bodyText : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        variables: variables || undefined,
        isDragDrop: isDragDrop !== undefined ? isDragDrop : undefined,
        dragDropData: dragDropData || undefined,
      },
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    console.error("PUT /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const existing = await db.emailTemplate.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if template is used by any campaign steps
    const campaignStepsCount = await db.campaignStep.count({
      where: { templateId: id },
    });

    if (campaignStepsCount > 0) {
      return NextResponse.json(
        { error: "This template is in use by one or more campaigns. Please remove it from the campaign steps first." },
        { status: 400 }
      );
    }

    await db.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/templates/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
