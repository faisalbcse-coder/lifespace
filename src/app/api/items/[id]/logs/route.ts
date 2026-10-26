import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { CreateLogSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const logs = await db.progressLog.findMany({
      where: { itemId: id },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ logs });
  } catch (error) {
    logger.error("Failed to list progress logs", error);
    return apiError("Internal server error while listing logs", 500);
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    const item = await getOwnedItem(id, user.id);
    if (!item) return apiError("Item not found or access denied", 404);

    const parsed = CreateLogSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const log = await db.progressLog.create({
      data: {
        itemId: id,
        note: parsed.data.note,
        // Default the snapshot to the item's current progress
        progressSnapshot: parsed.data.progressSnapshot ?? item.progress,
      },
    });
    logger.info("Progress log created", { itemId: id, logId: log.id, userId: user.id });
    return apiSuccess({ log }, 201);
  } catch (error) {
    logger.error("Failed to create progress log", error);
    return apiError("Internal server error while creating log", 500);
  }
}
