import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;

    const item = await db.sectionItem.findUnique({
      where: { id },
    });

    if (!item || item.userId !== user.id) {
      return apiError("Item not found or access denied", 404);
    }

    const body = await req.json().catch(() => ({}));
    const newArchivedState =
      typeof body.isArchived === "boolean" ? body.isArchived : !item.isArchived;

    const updatedItem = await db.sectionItem.update({
      where: { id },
      data: {
        isArchived: newArchivedState,
      },
    });

    logger.info("Item archive state toggled", {
      itemId: id,
      isArchived: newArchivedState,
    });

    return apiSuccess({ item: updatedItem });
  } catch (error) {
    logger.error("Failed to toggle item archive state", error);
    return apiError("Internal server error while archiving/restoring item", 500);
  }
}
