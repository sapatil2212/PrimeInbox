import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { candidateDiskPaths, MEDIA_ROOTS } from "@/lib/media";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".json": "application/json",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Serves uploaded media from local storage (used when files are not served by
 * an external web server). Reads from the configured storage path first, then
 * the public/uploads fallback. Includes path-traversal protection.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relPath = (segments || []).join("/");

  if (!relPath || relPath.includes("..") || relPath.includes("\0")) {
    return new NextResponse("Bad request", { status: 400 });
  }

  for (const candidate of candidateDiskPaths(relPath)) {
    const resolved = path.resolve(candidate);
    // Defense in depth: ensure resolved path stays within an allowed root.
    const insideAllowedRoot =
      resolved.startsWith(path.resolve(MEDIA_ROOTS.UPLOAD_PATH)) ||
      resolved.startsWith(path.resolve(MEDIA_ROOTS.PUBLIC_FALLBACK_DIR));
    if (!insideAllowedRoot) continue;

    try {
      const s = await stat(resolved);
      if (!s.isFile()) continue;
      const buffer = await readFile(resolved);
      const ext = path.extname(resolved).toLowerCase();
      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try next candidate
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
