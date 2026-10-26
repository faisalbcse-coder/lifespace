import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";

interface RouteParams {
  params: Promise<{ id: string; logId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id, logId } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const log = await db.progressLog.findUnique({ where: { id: logId } });
    if (!log || log.itemId !== id) return apiError("Log entry not found", 404);

    await db.progressLog.delete({ where: { id: logId } });
    return apiSuccess({ id: logId });
  } catch (error) {
    logger.error("Failed to delete progress log", error);
    return apiError("Internal server error while deleting log", 500);
  }
}
