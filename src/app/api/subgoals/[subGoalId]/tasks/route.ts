import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateSubGoalTaskSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { parseDateKey, startOfToday } from "@/lib/dates";

interface Params {
  params: Promise<{ subGoalId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);

    const { subGoalId } = await params;

    const subGoal = await db.subGoal.findUnique({
      where: { id: subGoalId },
      include: {
        goal: { select: { id: true, userId: true, sectionId: true } },
      },
    });

    if (!subGoal || subGoal.goal.userId !== user.id) {
      return apiError("Sub-Goal not found", 404);
    }

    const body = await req.json();
    const result = CreateSubGoalTaskSchema.safeParse(body);
    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const { title, scheduledDate, startTime, endTime, progress } = result.data;

    // Use assigned date if provided; otherwise default to today so it appears in the Daily Section
    const taskDate = scheduledDate ? parseDateKey(scheduledDate) : startOfToday();

    // Prefer Daily section so it aligns with daily tasks
    const dailySection = await db.section.findFirst({
      where: {
        userId: user.id,
        name: { in: ["Daily", "Daily Task"] },
      },
    });

    const targetSectionId = dailySection ? dailySection.id : subGoal.goal.sectionId;

    const lastTask = await db.sectionItem.findFirst({
      where: { subGoalId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = (lastTask?.orderIndex ?? -1) + 1;
    const initialProgress = progress ?? 0;

    const task = await db.sectionItem.create({
      data: {
        userId: user.id,
        sectionId: targetSectionId,
        subGoalId,
        title,
        scheduledDate: taskDate,
        startTime: startTime || null,
        endTime: endTime || null,
        progress: initialProgress,
        status: initialProgress === 100 ? "DONE" : "TODO",
        priority: "MEDIUM",
        itemType: "TASK",
        orderIndex: nextOrder,
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

    logger.info("Sub-Goal task created and integrated with Daily section", {
      taskId: task.id,
      subGoalId,
      goalId: subGoal.goal.id,
      scheduledDate: taskDate?.toISOString(),
      userId: user.id,
    });

    return apiSuccess({ task }, 201);
  } catch (error) {
    logger.error("Failed to create sub-goal task", error);
    return apiError("Internal server error", 500);
  }
}
