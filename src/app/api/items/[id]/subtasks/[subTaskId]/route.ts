import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { UpdateSubTaskSchema } from "@/lib/validators";
import { recalculateItemProgress } from "@/lib/planner";

interface RouteParams {
  params: Promise<{ id: string; subTaskId: string }>;
}

async function loadSubTask(itemId: string, subTaskId: string) {
  const sub = await db.subTask.findUnique({ where: { id: subTaskId } });
  return sub && sub.itemId === itemId ? sub : null;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id, subTaskId } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);
    if (!(await loadSubTask(id, subTaskId))) return apiError("Sub-task not found", 404);

    const parsed = UpdateSubTaskSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const subTask = await db.subTask.update({ where: { id: subTaskId }, data: parsed.data });
    const progress = await recalculateItemProgress(id);
    return apiSuccess({ subTask, progress });
  } catch (error) {
    logger.error("Failed to update sub-task", error);
    return apiError("Internal server error while updating sub-task", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id, subTaskId } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);
    if (!(await loadSubTask(id, subTaskId))) return apiError("Sub-task not found", 404);

    await db.subTask.delete({ where: { id: subTaskId } });
    // With no sub-tasks left, manual progress is preserved as-is.
    const progress = await recalculateItemProgress(id);
    return apiSuccess({ id: subTaskId, progress });
  } catch (error) {
    logger.error("Failed to delete sub-task", error);
    return apiError("Internal server error while deleting sub-task", 500);
  }
}
