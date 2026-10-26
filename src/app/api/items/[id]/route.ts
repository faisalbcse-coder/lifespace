import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateItemSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { parseDateKey } from "@/lib/dates";
import { deleteItemUploads } from "@/lib/uploads";
import { sortTargets, sortTasks } from "@/lib/ordering";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;

    const item = await db.sectionItem.findUnique({
      where: { id },
      include: {
        section: { select: { id: true, name: true, color: true } },
        subGoals: {
          orderBy: { createdAt: "asc" },
          include: {
            tasks: {
              where: { isArchived: false },
            },
          },
        },
        subGoal: {
          select: {
            id: true,
            title: true,
            goal: { select: { id: true, title: true } },
          },
        },
        subTasks: { orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] },
        attachments: { orderBy: { createdAt: "desc" } },
        logs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!item || item.userId !== user.id) {
      return apiError("Item not found or access denied", 404);
    }

    const { calculateSubGoalProgress, calculateGoalProgress } = await import("@/lib/goals");

    const sortedSubGoals = sortTargets(item.subGoals || []).map((sg) => {
      const sortedTasks = sortTasks(sg.tasks || []);
      const metrics = calculateSubGoalProgress(sortedTasks);
      return {
        ...sg,
        tasks: sortedTasks,
        progress: metrics.percentage,
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
      };
    });

    const goalProgress = calculateGoalProgress(sortedSubGoals);

    return apiSuccess({
      item: {
        ...item,
        subGoals: sortedSubGoals,
        goalProgress,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch item", error);
    return apiError("Internal server error while fetching item", 500);
  }
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

    const body = await req.json();
    const result = UpdateItemSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const updateData: Record<string, unknown> = {};

    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.priority !== undefined) updateData.priority = result.data.priority;
    if (result.data.itemType !== undefined) updateData.itemType = result.data.itemType;
    if (result.data.metadata !== undefined) updateData.metadata = result.data.metadata;
    if (result.data.isArchived !== undefined) updateData.isArchived = result.data.isArchived;

    if (result.data.dueDate !== undefined) {
      updateData.dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
    }

    if (result.data.startDate !== undefined) {
      const nextStart = result.data.startDate ? parseDateKey(result.data.startDate) : null;
      updateData.scheduledDate = nextStart;
      updateData.startDate = nextStart;
      let metaObj: Record<string, unknown> = {};
      try {
        if (item.metadata) metaObj = JSON.parse(item.metadata);
      } catch {
        // ignore
      }
      metaObj.startDate = result.data.startDate;
      updateData.metadata = JSON.stringify(metaObj);
    }

    if (result.data.endDate !== undefined) {
      const nextEnd = result.data.endDate ? parseDateKey(result.data.endDate) : null;
      updateData.endDate = nextEnd;
      updateData.dueDate = nextEnd;
    }

    if (result.data.startTime !== undefined) updateData.startTime = result.data.startTime;
    if (result.data.endTime !== undefined) updateData.endTime = result.data.endTime;

    if (result.data.content !== undefined) updateData.content = result.data.content;

    if (result.data.scheduledDate !== undefined && result.data.startDate === undefined) {
      const next = result.data.scheduledDate ? parseDateKey(result.data.scheduledDate) : null;
      const changed = (next?.getTime() ?? null) !== (item.scheduledDate?.getTime() ?? null);
      updateData.scheduledDate = next;
      // A manual reschedule starts a fresh schedule, so the rollover streak resets.
      if (changed) updateData.rolloverCount = 0;
    }

    if (result.data.progress !== undefined) {
      const subTaskCount = await db.subTask.count({ where: { itemId: id } });
      if (subTaskCount > 0) {
        return apiError(
          "Progress is computed automatically from sub-tasks for this item",
          400
        );
      }
      updateData.progress = result.data.progress;
      if (result.data.status === undefined) {
        if (result.data.progress === 100 && item.status !== "DONE") {
          updateData.status = "DONE";
          updateData.completedAt = new Date();
        } else if (result.data.progress < 100 && item.status === "DONE") {
          updateData.status = "TODO";
          updateData.completedAt = null;
        }
      }
    }

    if (result.data.status !== undefined) {
      updateData.status = result.data.status;
      if (result.data.status === "DONE" && item.status !== "DONE") {
        updateData.completedAt = new Date();
        if (result.data.progress === undefined) updateData.progress = 100;
      } else if (result.data.status !== "DONE" && item.status === "DONE") {
        updateData.completedAt = null;
      }
    }

    // Moving item to a new section
    if (result.data.sectionId && result.data.sectionId !== item.sectionId) {
      const targetSection = await db.section.findUnique({
        where: { id: result.data.sectionId },
      });
      if (!targetSection || targetSection.userId !== user.id) {
        return apiError("Target section not found or access denied", 400);
      }
      updateData.sectionId = result.data.sectionId;
    }

    const updatedItem = await db.sectionItem.update({
      where: { id },
      data: updateData,
      include: {
        section: {
          select: { id: true, name: true, color: true },
        },
        subGoal: {
          select: {
            id: true,
            title: true,
            goal: { select: { id: true, title: true } },
          },
        },
        subTasks: { select: { id: true, isCompleted: true } },
        logs: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { attachments: true, logs: true } },
      },
    });

    // Synchronize parent Goal's progress if this item is a sub-goal task
    if (item.subGoalId) {
      const subGoal = await db.subGoal.findUnique({
        where: { id: item.subGoalId },
        select: { goalId: true },
      });
      if (subGoal) {
        const subGoals = await db.subGoal.findMany({
          where: { goalId: subGoal.goalId },
          include: { tasks: { where: { isArchived: false }, select: { status: true } } },
        });
        const { calculateGoalProgress } = await import("@/lib/goals");
        const metrics = calculateGoalProgress(subGoals);
        if (metrics.percentage !== null) {
          await db.sectionItem.update({
            where: { id: subGoal.goalId },
            data: { progress: metrics.percentage },
          });
        }
      }
    }

    logger.info("Item updated", { itemId: id, userId: user.id });

    return apiSuccess({ item: updatedItem });
  } catch (error) {
    logger.error("Failed to update item", error);
    return apiError("Internal server error while updating item", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;

    const item = await db.sectionItem.findUnique({
      where: { id },
      select: { id: true, userId: true, subGoalId: true },
    });

    if (!item || item.userId !== user.id) {
      return apiError("Item not found or access denied", 404);
    }

    await db.sectionItem.delete({
      where: { id },
    });

    // Synchronize parent Goal's progress if a sub-goal task was deleted
    if (item.subGoalId) {
      const subGoal = await db.subGoal.findUnique({
        where: { id: item.subGoalId },
        select: { goalId: true },
      });
      if (subGoal) {
        const subGoals = await db.subGoal.findMany({
          where: { goalId: subGoal.goalId },
          include: { tasks: { where: { isArchived: false }, select: { status: true } } },
        });
        const { calculateGoalProgress } = await import("@/lib/goals");
        const metrics = calculateGoalProgress(subGoals);
        await db.sectionItem.update({
          where: { id: subGoal.goalId },
          data: { progress: metrics.percentage ?? 0 },
        });
      }
    }

    await deleteItemUploads(id).catch((err) =>
      logger.error("Failed to remove item uploads", err, { itemId: id })
    );

    logger.info("Item deleted", { itemId: id, userId: user.id });

    return apiSuccess({ message: "Item deleted successfully", id });
  } catch (error) {
    logger.error("Failed to delete item", error);
    return apiError("Internal server error while deleting item", 500);
  }
}
