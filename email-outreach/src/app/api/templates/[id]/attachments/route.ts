import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { storeFile } from "@/lib/media";

export const runtime = "nodejs";

/** GET: list attachments for a template */
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

    const attachments = await db.attachment.findMany({
      where: { templateId: id },
      include: { file: { select: { id: true, name: true, size: true, type: true, url: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, attachments });
  } catch (error) {
    console.error("GET /api/templates/[id]/attachments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST: upload and attach a file (PDF, etc.) to a template */
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

    const template = await db.emailTemplate.findUnique({
      where: { id, companyId: session.companyId },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Max 10MB per file
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    // Determine storage category
    const mime = (file.type || "").toLowerCase();
    const category = mime === "application/pdf" ? "pdfs" : "documents";

    const stored = await storeFile({
      companyId: session.companyId,
      category,
      file,
    });

    // Create File record + Attachment link in a transaction
    const attachment = await db.$transaction(async (tx) => {
      const fileRecord = await tx.file.create({
        data: {
          companyId: session.companyId!,
          name: file.name,
          size: stored.size,
          type: stored.type,
          path: stored.path,
          url: stored.url,
        },
      });

      return tx.attachment.create({
        data: {
          fileId: fileRecord.id,
          templateId: id,
        },
        include: { file: { select: { id: true, name: true, size: true, type: true, url: true } } },
      });
    });

    return NextResponse.json({ success: true, attachment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates/[id]/attachments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE: remove an attachment from a template (deletes the Attachment record, keeps the File) */
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
    const attachmentId = req.nextUrl.searchParams.get("attachmentId");
    if (!attachmentId) {
      return NextResponse.json({ error: "attachmentId query param required" }, { status: 400 });
    }

    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, templateId: id },
    });
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    await db.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true, message: "Attachment removed" });
  } catch (error) {
    console.error("DELETE /api/templates/[id]/attachments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
