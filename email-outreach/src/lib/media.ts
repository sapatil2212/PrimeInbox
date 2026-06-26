import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Centralized media storage.
 *
 * Driven by environment variables:
 *   MEDIA_DRIVER       = local
 *   MEDIA_UPLOAD_PATH  = /var/www/storage
 *   MEDIA_PUBLIC_URL   = https://primeinbox.online/uploads
 *
 * Files are organized per workspace:
 *   {MEDIA_UPLOAD_PATH}/workspaces/{workspaceId}/{category}/{filename}
 * and served from:
 *   {MEDIA_PUBLIC_URL}/workspaces/{workspaceId}/{category}/{filename}
 *
 * If the configured path isn't writable (e.g. local dev on Windows where
 * /var/www/storage doesn't exist), it transparently falls back to
 * `public/uploads` so uploads keep working and remain viewable locally.
 */

export type MediaCategory =
  | "images"
  | "pdfs"
  | "avatars"
  | "email-assets"
  | "campaigns"
  | "documents"
  | "exports"
  | "temp";

export const MEDIA_CATEGORIES: MediaCategory[] = [
  "images",
  "pdfs",
  "avatars",
  "email-assets",
  "campaigns",
  "documents",
  "exports",
  "temp",
];

const UPLOAD_PATH = process.env.MEDIA_UPLOAD_PATH || path.join(process.cwd(), "public", "uploads");
const PUBLIC_URL = (process.env.MEDIA_PUBLIC_URL || "").replace(/\/+$/, "");
const PUBLIC_FALLBACK_DIR = path.join(process.cwd(), "public", "uploads");

// Only use an absolute public base (e.g. nginx serving /var/www/storage) in
// production. In dev we always serve through the /api/files route handler so
// runtime-uploaded files are reachable (Next.js does not serve files added to
// public/ after start).
const isAbsolutePublic = /^https?:\/\//i.test(PUBLIC_URL);
const useAbsolute = isAbsolutePublic && process.env.NODE_ENV === "production";

function publicUrlFor(relPath: string): string {
  return useAbsolute ? `${PUBLIC_URL}/${relPath}` : `/api/files/${relPath}`;
}

/**
 * Returns the candidate on-disk locations for a stored relative path,
 * used by the file-serving route. Order matters (configured path first).
 */
export function candidateDiskPaths(relPath: string): string[] {
  const clean = relPath.replace(/^\/+/, "").replace(/\\/g, "/");
  return [path.join(UPLOAD_PATH, clean), path.join(PUBLIC_FALLBACK_DIR, clean)];
}

export const MEDIA_ROOTS = { UPLOAD_PATH, PUBLIC_FALLBACK_DIR };

export interface StoredFile {
  url: string;
  path: string;
  filename: string;
  size: number;
  type: string;
}

function buildFilename(originalName: string): string {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeName = (originalName || "file").replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${uniqueSuffix}-${safeName}`;
}

export async function storeFile(params: {
  companyId: string;
  category: MediaCategory;
  file: File;
}): Promise<StoredFile> {
  const { companyId, category, file } = params;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = buildFilename(file.name);
  const relPath = path.posix.join("workspaces", companyId, category, filename);

  // Primary: configured storage location
  try {
    const absDir = path.join(UPLOAD_PATH, "workspaces", companyId, category);
    await mkdir(absDir, { recursive: true });
    const absPath = path.join(absDir, filename);
    await writeFile(absPath, buffer);
    return {
      url: publicUrlFor(relPath),
      path: absPath,
      filename,
      size: file.size,
      type: file.type,
    };
  } catch (primaryErr) {
    // Fallback: public/uploads (keeps local dev functional)
    console.warn(
      `[media] Could not write to ${UPLOAD_PATH} (${(primaryErr as Error).message}). Falling back to public/uploads.`
    );
    const fallbackDir = path.join(process.cwd(), "public", "uploads", "workspaces", companyId, category);
    await mkdir(fallbackDir, { recursive: true });
    const absPath = path.join(fallbackDir, filename);
    await writeFile(absPath, buffer);
    return {
      url: `/api/files/${relPath}`,
      path: absPath,
      filename,
      size: file.size,
      type: file.type,
    };
  }
}
