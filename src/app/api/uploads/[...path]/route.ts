import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { resolveUploadPath } from "@/lib/uploads";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

const INLINE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

/**
 * GET /api/uploads/[itemId]/[storedName]
 * Streams an uploaded file after verifying that the signed-in user owns the item
 * and that the file is registered as an attachment of that item.
 * Append ?download=1 to force a download.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { path: segments } = await params;
    const filePath = resolveUploadPath(segments);
    if (!filePath) return apiError("Invalid file path", 400);

    const [itemId] = segments;
    const item = await db.sectionItem.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item || item.userId !== user.id) return apiError("File not found", 404);

    const attachment = await db.itemAttachment.findFirst({
      where: { itemId, url: `/api/uploads/${segments.join("/")}` },
    });
    if (!attachment) return apiError("File not found", 404);

    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
    } catch {
      return apiError("File not found", 404);
    }

    const mimeType = attachment.mimeType || "application/octet-stream";
    const forceDownload = new URL(req.url).searchParams.get("download") === "1";
    const inline = !forceDownload && INLINE_TYPES.has(mimeType);
    const safeName = attachment.title.replace(/[^\w.\- ]+/g, "_");

    const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(stat.size),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    logger.error("Failed to serve upload", error);
    return apiError("Internal server error while serving file", 500);
  }
}
