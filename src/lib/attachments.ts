import { db } from "./db";
import {
  classifyUpload,
  deleteUploadByUrl,
  MAX_UPLOAD_BYTES,
  saveUploadedFile,
} from "./uploads";

export class AttachmentError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Validates, stores to disk, and records a file attachment (PDF / IMAGE / FILE). */
export async function createFileAttachment(params: {
  itemId: string;
  filename: string;
  declaredMime: string;
  buffer: Buffer;
  title?: string;
}) {
  const { itemId, filename, declaredMime, buffer } = params;
  if (buffer.length === 0) throw new AttachmentError("Uploaded file is empty");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AttachmentError(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`, 413);
  }
  const classified = classifyUpload(filename, declaredMime);
  if (!classified) {
    throw new AttachmentError(
      "Unsupported file type. Allowed: PDF, PNG/JPG/WebP images, and common documents."
    );
  }

  const { url } = await saveUploadedFile(itemId, filename, buffer);
  return db.itemAttachment.create({
    data: {
      itemId,
      type: classified.type,
      title: (params.title?.trim() || filename).slice(0, 255),
      url,
      mimeType: classified.mimeType,
      fileSize: buffer.length,
    },
  });
}

export async function createLinkAttachment(params: {
  itemId: string;
  title: string;
  url: string;
}) {
  return db.itemAttachment.create({
    data: {
      itemId: params.itemId,
      type: "LINK",
      title: params.title,
      url: params.url,
    },
  });
}

/** Removes the DB row and, for uploaded files, the file on disk. */
export async function deleteAttachment(attachmentId: string) {
  const attachment = await db.itemAttachment.delete({ where: { id: attachmentId } });
  if (attachment.type !== "LINK") {
    await deleteUploadByUrl(attachment.url);
  }
  return attachment;
}
