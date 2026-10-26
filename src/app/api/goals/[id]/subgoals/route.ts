import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateSubGoalSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { calculateSubGoalProgress, calculateGoalProgress } from "@/lib/goals";
import { sortTargets, sortTasks } from "@/lib/ordering";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { id: goalId } = await params;

    const goal = await db.sectionItem.findFirst({
      where: { id: goalId, userId: user.id },
      select: { id: true, title: true },
    });

    if (!goal) return apiError("Goal not found", 404);

    const subGoals = await db.subGoal.findMany({
      where: { goalId },
      orderBy: { createdAt: "asc" },
      include: {
        tasks: {
          where: { isArchived: false },
        },
      },
    });

    const sortedSubGoals = sortTargets(subGoals).map((sg) => {
      const sortedTasks = sortTasks(sg.tasks || []);
      const progress = calculateSubGoalProgress(sortedTasks);
      return {
        ...sg,
        tasks: sortedTasks,
        progress: progress.percentage,
        totalTasks: progress.totalTasks,
        completedTasks: progress.completedTasks,
      };
    });

    const goalProgress = calculateGoalProgress(sortedSubGoals);

    // Keep goal item progress column in sync
    if (goalProgress.percentage !== null) {
      await db.sectionItem.update({
        where: { id: goalId },
        data: { progress: goalProgress.percentage },
      });
    }

    return apiSuccess({
      subGoals: sortedSubGoals,
      goalProgress,
    });
  } catch (error) {
    logger.error("Failed to fetch sub-goals", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { id: goalId } = await params;

    const goal = await db.sectionItem.findFirst({
      where: { id: goalId, userId: user.id },
      select: { id: true },
    });

    if (!goal) return apiError("Goal not found", 404);

    const body = await req.json();
    const result = CreateSubGoalSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const { title, startDate, endDate } = result.data;

    const lastSubGoal = await db.subGoal.findFirst({
      where: { goalId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = (lastSubGoal?.orderIndex ?? -1) + 1;

    const subGoal = await db.subGoal.create({
      data: {
        goalId,
        title,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        orderIndex: nextOrder,
      },
      include: {
        tasks: true,
      },
    });

    logger.info("Sub-Goal created", { subGoalId: subGoal.id, goalId, userId: user.id });

    return apiSuccess({
      subGoal: {
        ...subGoal,
        progress: null,
        totalTasks: 0,
        completedTasks: 0,
      },
    }, 201);
  } catch (error) {
    logger.error("Failed to create sub-goal", error);
    return apiError("Internal server error", 500);
  }
}
