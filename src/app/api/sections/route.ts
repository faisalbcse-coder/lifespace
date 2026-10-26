import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateSectionSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { ensureWorkspaceInitialized } from "@/lib/workspace";
import { logger } from "@/lib/logger";
import { rolloverOverdueDailyTasks } from "@/lib/planner";
import { getSectionKind } from "@/lib/goals";
import { sortSections, sortSectionItems, sortTargets, sortTasks } from "@/lib/ordering";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const includeHidden = searchParams.get("includeHidden") === "true";

    // Ensure user's workspace default sections are present
    await ensureWorkspaceInitialized(user.id);

    // Carry unfinished tasks from previous days over to today
    await rolloverOverdueDailyTasks(user.id);

    const sections = await db.section.findMany({
      where: {
        userId: user.id,
        isArchived: includeArchived ? undefined : false,
        isHidden: includeHidden ? undefined : false,
      },
      orderBy: [
        { orderIndex: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        items: {
          where: {
            isArchived: includeArchived ? undefined : false,
          },
          include: {
            subGoal: {
              select: {
                id: true,
                title: true,
                goal: { select: { id: true, title: true } },
              },
            },
            subGoals: {
              include: {
                tasks: {
                  where: { isArchived: false },
                  select: { id: true, status: true, scheduledDate: true, startTime: true, createdAt: true },
                },
              },
            },
            subTasks: { select: { id: true, isCompleted: true } },
            logs: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            _count: { select: { attachments: true, logs: true } },
          },
        },
      },
    });

    const sortedSections = sortSections(sections).map((section) => {
      const isGoal = getSectionKind(section) === "GOAL";
      const sortedItems = sortSectionItems(section.items, isGoal).map((item) => {
        if (item.subGoals && item.subGoals.length > 0) {
          const sortedSubGoals = sortTargets(item.subGoals).map((sg) => ({
            ...sg,
            tasks: sg.tasks ? sortTasks(sg.tasks) : [],
          }));
          return { ...item, subGoals: sortedSubGoals };
        }
        return item;
      });
      return { ...section, items: sortedItems };
    });

    return apiSuccess({ sections: sortedSections });
  } catch (error) {
    logger.error("Failed to fetch sections", error);
    return apiError("Internal server error while fetching sections", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const result = CreateSectionSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const { name, color, type } = result.data;
    const finalColor = type ? `${color.split(":")[0]}:${type}` : color;

    const highestSection = await db.section.findFirst({
      where: { userId: user.id },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = (highestSection?.orderIndex ?? -1) + 1;

    const newSection = await db.section.create({
      data: {
        userId: user.id,
        name,
        color: finalColor,
        orderIndex: nextOrder,
        collapsed: false,
        isArchived: false,
        isHidden: false,
      },
      include: {
        items: true,
      },
    });

    logger.info("Section created", { sectionId: newSection.id, userId: user.id });

    return apiSuccess({ section: newSection }, 201);
  } catch (error) {
    logger.error("Failed to create section", error);
    return apiError("Internal server error while creating section", 500);
  }
}
