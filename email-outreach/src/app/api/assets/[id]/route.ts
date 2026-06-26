import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";

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

    const file = await db.file.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Try deleting from local storage first
    try {
      await unlink(file.path);
    } catch (err: any) {
      console.warn(`[AssetsDelete] Could not delete physical file at ${file.path}:`, err.message);
      // Continue deletion from database even if file is missing from disk
    }

    await db.file.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Asset deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/assets/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 550 });
  }
}
