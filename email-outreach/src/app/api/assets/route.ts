import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { storeFile } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";

    const files = await db.file.findMany({
      where: {
        companyId: session.companyId,
        name: {
          contains: query,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return NextResponse.json({ success: true, files, totalSize });
  } catch (error: any) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Pick the right media category from the mime type so the upload lands in
    // a sensible workspace bucket on the VPS (e.g. images, pdfs, documents).
    const mime = (file.type || "").toLowerCase();
    const category = mime.startsWith("image/")
      ? "email-assets"
      : mime === "application/pdf"
      ? "pdfs"
      : "documents";

    const stored = await storeFile({
      companyId: session.companyId,
      category,
      file,
    });

    const fileRecord = await db.file.create({
      data: {
        companyId: session.companyId,
        name: file.name,
        size: stored.size,
        type: stored.type,
        path: stored.path,
        url: stored.url,
      },
    });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error: any) {
    console.error("POST /api/assets error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
