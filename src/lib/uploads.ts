import fs from "fs";
import path from "path";
import crypto from "crypto";

export const UPLOADS_ROOT = path.resolve(process.cwd(), "data", "uploads");
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export type AttachmentType = "PDF" | "IMAGE" | "LINK" | "FILE";

const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const FILE_EXT_MIME: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};
const IMAGE_EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export interface ClassifiedUpload {
  type: AttachmentType;
  mimeType: string;
  ext: string;
}

/**
 * Classifies an uploaded file by extension (primary) and declared MIME type.
 * Returns null when the file type is not on the allow-list.
 */
export function classifyUpload(filename: string, declaredMime: string): ClassifiedUpload | null {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") {
    return { type: "PDF", mimeType: "application/pdf", ext };
  }
  if (IMAGE_EXT.has(ext)) {
    if (declaredMime && !IMAGE_MIME.has(declaredMime)) return null;
    return { type: "IMAGE", mimeType: IMAGE_EXT_MIME[ext], ext };
  }
  if (FILE_EXT_MIME[ext]) {
    return { type: "FILE", mimeType: FILE_EXT_MIME[ext], ext };
  }
  return null;
}

/** Strips directory parts and unsafe characters from a user supplied filename. */
export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_");
  return base.replace(/^\.+/, "").slice(0, 120) || "file";
}

export function itemUploadDir(itemId: string): string {
  return path.join(UPLOADS_ROOT, itemId);
}

/** Persists a file buffer to ./data/uploads/<itemId>/ and returns stored name + served URL. */
export async function saveUploadedFile(
  itemId: string,
  originalName: string,
  buffer: Buffer
): Promise<{ storedName: string; url: string }> {
  const dir = itemUploadDir(itemId);
  await fs.promises.mkdir(dir, { recursive: true });
  const storedName = `${crypto.randomBytes(8).toString("hex")}-${sanitizeFilename(originalName)}`;
  await fs.promises.writeFile(path.join(dir, storedName), buffer);
  return { storedName, url: `/api/uploads/${itemId}/${storedName}` };
}

/**
 * Resolves a served URL segment pair to an absolute path, guaranteeing the result
 * stays inside UPLOADS_ROOT. Returns null on traversal attempts.
 */
export function resolveUploadPath(segments: string[]): string | null {
  if (segments.length !== 2) return null;
  if (segments.some((s) => !s || s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return null;
  }
  const resolved = path.resolve(UPLOADS_ROOT, ...segments);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return resolved;
}

/** Deletes a stored upload given its served URL. Silent if already gone. */
export async function deleteUploadByUrl(url: string): Promise<void> {
  const prefix = "/api/uploads/";
  if (!url.startsWith(prefix)) return;
  const filePath = resolveUploadPath(url.slice(prefix.length).split("/"));
  if (!filePath) return;
  await fs.promises.rm(filePath, { force: true });
}

/** Removes the whole upload directory of an item. */
export async function deleteItemUploads(itemId: string): Promise<void> {
  const dir = itemUploadDir(itemId);
  if (!dir.startsWith(UPLOADS_ROOT + path.sep)) return;
  await fs.promises.rm(dir, { recursive: true, force: true });
}
