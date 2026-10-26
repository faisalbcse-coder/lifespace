import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { deleteAttachment } from "@/lib/attachments";

interface RouteParams {
  params: Promise<{ id: string; attachmentId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id, attachmentId } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const existing = await db.itemAttachment.findUnique({ where: { id: attachmentId } });
    if (!existing || existing.itemId !== id) return apiError("Attachment not found", 404);

    await deleteAttachment(attachmentId);
    logger.info("Attachment deleted", { itemId: id, attachmentId, userId: user.id });
    return apiSuccess({ id: attachmentId });
  } catch (error) {
    logger.error("Failed to delete attachment", error);
    return apiError("Internal server error while deleting attachment", 500);
  }
}
