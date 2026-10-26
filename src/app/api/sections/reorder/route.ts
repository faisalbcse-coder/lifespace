import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReorderSectionsSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const result = ReorderSectionsSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid reorder payload", 400, result.error.flatten().fieldErrors);
    }

    const { sectionIds } = result.data;

    // Verify all provided section IDs belong strictly to this user
    const userSections = await db.section.findMany({
      where: {
        id: { in: sectionIds },
        userId: user.id,
      },
      select: { id: true },
    });

    if (userSections.length !== sectionIds.length) {
      return apiError("One or more sections not found or not owned by user", 403);
    }

    // Execute atomic transactional updates for orderIndex
    await db.$transaction(
      sectionIds.map((id, index) =>
        db.section.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    logger.info("Sections reordered transactionally", {
      userId: user.id,
      count: sectionIds.length,
    });

    return apiSuccess({ message: "Sections reordered successfully", sectionIds });
  } catch (error) {
    logger.error("Failed to reorder sections", error);
    return apiError("Database transaction failed during section reordering", 500);
  }
}
