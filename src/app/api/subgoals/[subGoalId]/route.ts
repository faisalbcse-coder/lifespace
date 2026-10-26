import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateSubGoalSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";

interface Params {
  params: Promise<{ subGoalId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { subGoalId } = await params;

    const subGoal = await db.subGoal.findUnique({
      where: { id: subGoalId },
      include: {
        goal: { select: { userId: true } },
      },
    });

    if (!subGoal || subGoal.goal.userId !== user.id) {
      return apiError("Sub-Goal not found", 404);
    }

    const body = await req.json();
    const result = UpdateSubGoalSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const { startDate, endDate, ...restData } = result.data;
    const dataToUpdate: Record<string, unknown> = { ...restData };
    if (startDate !== undefined) {
      dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      dataToUpdate.endDate = endDate ? new Date(endDate) : null;
    }

    const updated = await db.subGoal.update({
      where: { id: subGoalId },
      data: dataToUpdate,
      include: {
        tasks: {
          where: { isArchived: false },
          orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    logger.info("Sub-Goal updated", { subGoalId, userId: user.id });

    return apiSuccess({ subGoal: updated });
  } catch (error) {
    logger.error("Failed to update sub-goal", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { subGoalId } = await params;

    const subGoal = await db.subGoal.findUnique({
      where: { id: subGoalId },
      include: {
        goal: { select: { userId: true, id: true } },
      },
    });

    if (!subGoal || subGoal.goal.userId !== user.id) {
      return apiError("Sub-Goal not found", 404);
    }

    await db.subGoal.delete({
      where: { id: subGoalId },
    });

    logger.info("Sub-Goal deleted", { subGoalId, goalId: subGoal.goal.id, userId: user.id });

    return apiSuccess({ deletedId: subGoalId });
  } catch (error) {
    logger.error("Failed to delete sub-goal", error);
    return apiError("Internal server error", 500);
  }
}
