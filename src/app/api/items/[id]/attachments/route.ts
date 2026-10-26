import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { CreateLinkAttachmentSchema } from "@/lib/validators";
import { AttachmentError, createFileAttachment, createLinkAttachment } from "@/lib/attachments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const attachments = await db.itemAttachment.findMany({
      where: { itemId: id },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ attachments });
  } catch (error) {
    logger.error("Failed to list attachments", error);
    return apiError("Internal server error while listing attachments", 500);
  }
}

/**
 * POST /api/items/[id]/attachments
 *  - multipart/form-data with `file` (+ optional `title`) -> PDF / IMAGE / FILE upload
 *  - application/json { type: "LINK", title, url }        -> external link
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return apiError("Validation failed", 400, { file: ["A file is required"] });
      }
      const titleRaw = form.get("title");
      const attachment = await createFileAttachment({
        itemId: id,
        filename: file.name,
        declaredMime: file.type,
        buffer: Buffer.from(await file.arrayBuffer()),
        title: typeof titleRaw === "string" ? titleRaw : undefined,
      });
      logger.info("Attachment uploaded", { itemId: id, attachmentId: attachment.id, type: attachment.type });
      return apiSuccess({ attachment }, 201);
    }

    const parsed = CreateLinkAttachmentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const attachment = await createLinkAttachment({
      itemId: id,
      title: parsed.data.title,
      url: parsed.data.url,
    });
    return apiSuccess({ attachment }, 201);
  } catch (error) {
    if (error instanceof AttachmentError) return apiError(error.message, error.status);
    logger.error("Failed to create attachment", error);
    return apiError("Internal server error while creating attachment", 500);
  }
}
