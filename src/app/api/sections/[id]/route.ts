import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UpdateSectionSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { sortSectionItems } from "@/lib/ordering";
import { getSectionKind } from "@/lib/goals";

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

    // Verify ownership
    const section = await db.section.findUnique({
      where: { id },
    });

    if (!section || section.userId !== user.id) {
      return apiError("Section not found", 404);
    }

    const body = await req.json();
    const result = UpdateSectionSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid update data", 400, result.error.flatten().fieldErrors);
    }

    const { type, color, ...restData } = result.data;
    let finalColor = color;
    if (type || color) {
      const baseColor = color ? color.split(":")[0] : (section.color?.split(":")[0] || "indigo");
      const kind = type || (section.color?.includes(":") ? section.color.split(":")[1] : "TASK");
      finalColor = `${baseColor}:${kind}`;
    }

    const updatedSection = await db.section.update({
      where: { id },
      data: {
        ...restData,
        ...(finalColor !== undefined ? { color: finalColor } : {}),
      },
      include: {
        items: true,
      },
    });

    const isGoal = getSectionKind(updatedSection) === "GOAL";
    const formattedSection = {
      ...updatedSection,
      items: sortSectionItems(updatedSection.items || [], isGoal),
    };

    logger.info("Section updated", { sectionId: id, userId: user.id });

    return apiSuccess({ section: formattedSection });
  } catch (error) {
    logger.error("Failed to update section", error);
    return apiError("Internal server error while updating section", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;

    const section = await db.section.findUnique({
      where: { id },
    });

    if (!section || section.userId !== user.id) {
      return apiError("Section not found", 404);
    }

    await db.$transaction(async (tx) => {
      // Find all item IDs belonging to this section
      const items = await tx.sectionItem.findMany({
        where: { sectionId: id },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        // Find all subgoals belonging to any goals in this section
        const subGoals = await tx.subGoal.findMany({
          where: { goalId: { in: itemIds } },
          select: { id: true },
        });
        const subGoalIds = subGoals.map((sg) => sg.id);

        // Delete any descendant tasks and subgoals cleanly
        if (subGoalIds.length > 0) {
          await tx.sectionItem.deleteMany({
            where: { subGoalId: { in: subGoalIds } },
          });
          await tx.subGoal.deleteMany({
            where: { id: { in: subGoalIds } },
          });
        }

        await tx.progressLog.deleteMany({ where: { itemId: { in: itemIds } } });
        await tx.itemAttachment.deleteMany({ where: { itemId: { in: itemIds } } });
        await tx.subTask.deleteMany({ where: { itemId: { in: itemIds } } });
        await tx.sectionItem.deleteMany({ where: { id: { in: itemIds } } });
      }

      await tx.section.delete({
        where: { id },
      });
    });

    logger.info("Section deleted", { sectionId: id, userId: user.id });

    return apiSuccess({ message: "Section deleted successfully", id });
  } catch (error) {
    logger.error("Failed to delete section", error);
    return apiError("Internal server error while deleting section", 500);
  }
}
