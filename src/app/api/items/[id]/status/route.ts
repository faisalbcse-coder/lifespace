import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionItemStatusEnum } from "@/lib/validators";
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
    let newStatus = body.status;

    if (!newStatus) {
      // Toggle logic if no explicit status is provided
      newStatus = item.status === "DONE" ? "TODO" : "DONE";
    }

    const parseResult = SectionItemStatusEnum.safeParse(newStatus);
    if (!parseResult.success) {
      return apiError("Invalid status value", 400);
    }

    const isNowDone = newStatus === "DONE";

    const updatedItem = await db.sectionItem.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: isNowDone ? new Date() : null,
      },
      include: {
        subGoal: {
          select: {
            id: true,
            title: true,
            goal: { select: { id: true, title: true } },
          },
        },
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

    logger.info("Item status changed", {
      itemId: id,
      newStatus,
      completed: isNowDone,
    });

    return apiSuccess({ item: updatedItem });
  } catch (error) {
    logger.error("Failed to toggle item status", error);
    return apiError("Internal server error while updating item status", 500);
  }
}
