import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { storeFile, MEDIA_CATEGORIES, MediaCategory } from "@/lib/media";

export const runtime = "nodejs";

// Per-category limits (bytes) and allowed mime prefixes.
const RULES: Record<string, { maxSize: number; allow?: string[] }> = {
  avatars: { maxSize: 5 * 1024 * 1024, allow: ["image/"] },
  images: { maxSize: 10 * 1024 * 1024, allow: ["image/"] },
  pdfs: { maxSize: 20 * 1024 * 1024, allow: ["application/pdf"] },
  documents: { maxSize: 25 * 1024 * 1024 },
  "email-assets": { maxSize: 10 * 1024 * 1024 },
  campaigns: { maxSize: 25 * 1024 * 1024 },
  exports: { maxSize: 50 * 1024 * 1024 },
  temp: { maxSize: 50 * 1024 * 1024 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const categoryRaw = (form.get("category") as string) || "images";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!MEDIA_CATEGORIES.includes(categoryRaw as MediaCategory)) {
      return NextResponse.json({ error: "Invalid storage category" }, { status: 400 });
    }
    const category = categoryRaw as MediaCategory;
    const rule = RULES[category] || { maxSize: 10 * 1024 * 1024 };

    if (file.size > rule.maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(rule.maxSize / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    if (rule.allow && !rule.allow.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json({ error: "Unsupported file type for this category" }, { status: 400 });
    }

    const stored = await storeFile({ companyId: session.companyId, category, file });

    // Track the upload in the File table.
    await db.file.create({
      data: {
        companyId: session.companyId,
        name: file.name,
        size: stored.size,
        type: stored.type,
        path: stored.path,
        url: stored.url,
      },
    });

    return NextResponse.json({
      success: true,
      url: stored.url,
      name: file.name,
      size: stored.size,
      type: stored.type,
    });
  } catch (error: any) {
    console.error("POST /api/media/upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
