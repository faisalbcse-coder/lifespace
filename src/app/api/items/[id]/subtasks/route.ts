import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { CreateSubTaskSchema } from "@/lib/validators";
import { recalculateItemProgress } from "@/lib/planner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const subTasks = await db.subTask.findMany({
      where: { itemId: id },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    });
    return apiSuccess({ subTasks });
  } catch (error) {
    logger.error("Failed to list sub-tasks", error);
    return apiError("Internal server error while listing sub-tasks", 500);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const parsed = CreateSubTaskSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const last = await db.subTask.findFirst({
      where: { itemId: id },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const subTask = await db.subTask.create({
      data: { itemId: id, title: parsed.data.title, orderIndex: (last?.orderIndex ?? -1) + 1 },
    });
    const progress = await recalculateItemProgress(id);

    logger.info("Sub-task created", { itemId: id, subTaskId: subTask.id, userId: user.id });
    return apiSuccess({ subTask, progress }, 201);
  } catch (error) {
    logger.error("Failed to create sub-task", error);
    return apiError("Internal server error while creating sub-task", 500);
  }
}
