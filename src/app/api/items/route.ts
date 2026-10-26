import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateItemSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { parseDateKey } from "@/lib/dates";
import { sortTasks } from "@/lib/ordering";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const sectionId = searchParams.get("sectionId") || undefined;
    const isArchived = searchParams.get("isArchived") === "true";

    const items = await db.sectionItem.findMany({
      where: {
        userId: user.id,
        isArchived,
        sectionId: sectionId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        OR: q
          ? [
              { title: { contains: q } },
              { description: { contains: q } },
            ]
          : undefined,
      },
      include: {
        section: {
          select: { id: true, name: true, color: true },
        },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: [
        { dueDate: "asc" },
        { orderIndex: "asc" },
        { createdAt: "desc" },
      ],
    });

    return apiSuccess({ items: sortTasks(items) });
  } catch (error) {
    logger.error("Failed to query items", error);
    return apiError("Internal server error while searching items", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const result = CreateItemSchema.safeParse(body);

    if (!result.success) {
      return apiError("Validation failed", 400, result.error.flatten().fieldErrors);
    }

    const {
      sectionId,
      title,
      description,
      status,
      priority,
      itemType,
      dueDate,
      startDate,
      endDate,
      startTime,
      endTime,
      progress,
      metadata,
      scheduledDate,
    } = result.data;

    // Verify section ownership
    const section = await db.section.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.userId !== user.id) {
      return apiError("Section not found or not owned by user", 404);
    }

    const highestItem = await db.sectionItem.findFirst({
      where: { sectionId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });

    const nextOrder = (highestItem?.orderIndex ?? -1) + 1;

    const effectiveStartDate = startDate || scheduledDate;
    let finalMetadata = metadata || null;
    if (startDate) {
      let metaObj: Record<string, unknown> = {};
      try {
        if (metadata) metaObj = JSON.parse(metadata);
      } catch {
        // ignore
      }
      metaObj.startDate = startDate;
      finalMetadata = JSON.stringify(metaObj);
    }

    const finalStartDate = effectiveStartDate ? parseDateKey(effectiveStartDate) : null;
    const finalEndDate = endDate ? parseDateKey(endDate) : (dueDate ? new Date(dueDate) : null);
    const initialProgress = progress ?? (status === "DONE" ? 100 : 0);
    const initialStatus = status ? status : (initialProgress === 100 ? "DONE" : "TODO");

    const newItem = await db.sectionItem.create({
      data: {
        userId: user.id,
        sectionId,
        title,
        description: description || null,
        status: initialStatus,
        priority: priority || "MEDIUM",
        itemType: itemType || "TASK",
        progress: initialProgress,
        startTime: startTime || null,
        endTime: endTime || null,
        metadata: finalMetadata,
        dueDate: finalEndDate,
        startDate: finalStartDate,
        endDate: finalEndDate,
        scheduledDate: finalStartDate,
        completedAt: initialStatus === "DONE" ? new Date() : null,
        orderIndex: nextOrder,
      },
      include: {
        section: {
          select: { id: true, name: true, color: true },
        },
        logs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    logger.info("Item created", { itemId: newItem.id, sectionId, userId: user.id });

    return apiSuccess({ item: newItem }, 201);
  } catch (error) {
    logger.error("Failed to create item", error);
    return apiError("Internal server error while creating item", 500);
  }
}
