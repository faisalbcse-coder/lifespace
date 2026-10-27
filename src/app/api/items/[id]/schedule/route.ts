import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getOwnedItem } from "@/lib/ownership";
import { ScheduleItemSchema } from "@/lib/validators";
import { addDaysToKey, parseDateKey, todayKey } from "@/lib/dates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/items/[id]/schedule
 * Body: { scheduledDate: "YYYY-MM-DD" | null } or { preset: "today" | "tomorrow" | "nextWeek" }
 * Rescheduling resets the rollover streak. Completed items keep their DONE status.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const { id } = await params;
    if (!(await getOwnedItem(id, user.id))) return apiError("Item not found or access denied", 404);

    const parsed = ScheduleItemSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    let key: string | null;
    if (parsed.data.preset) {
      const today = todayKey();
      key =
        parsed.data.preset === "today"
          ? today
          : addDaysToKey(today, parsed.data.preset === "tomorrow" ? 1 : 7);
    } else {
      key = parsed.data.scheduledDate ?? null;
    }

    const existingItem = await db.sectionItem.findUnique({
      where: { id },
      select: { scheduledDate: true, metadata: true },
    });

    const dataToUpdate: Record<string, unknown> = {
      scheduledDate: key ? parseDateKey(key) : null,
      rolloverCount: 0,
    };

    if (parsed.data.startTime !== undefined) {
      dataToUpdate.startTime = parsed.data.startTime;
    }
    if (parsed.data.endTime !== undefined) {
      dataToUpdate.endTime = parsed.data.endTime;
    }

    if (parsed.data.reason) {
      let metaObj: Record<string, unknown> = {};
      try {
        if (existingItem?.metadata) metaObj = JSON.parse(existingItem.metadata);
      } catch {
        // ignore
      }
      metaObj.delayReason = parsed.data.reason;
      metaObj.lastRescheduledAt = new Date().toISOString();
      if (!Array.isArray(metaObj.rescheduleHistory)) {
        metaObj.rescheduleHistory = [];
      }
      (metaObj.rescheduleHistory as Array<{ from: string | null; to: string | null; reason: string; timestamp: string }>).push({
        from: existingItem?.scheduledDate ? existingItem.scheduledDate.toISOString().slice(0, 10) : null,
        to: key,
        reason: parsed.data.reason,
        timestamp: new Date().toISOString(),
      });
      dataToUpdate.metadata = JSON.stringify(metaObj);

      await db.progressLog.create({
        data: {
          itemId: id,
          note: `Rescheduled to ${key || "unscheduled"}. Reason: ${parsed.data.reason}`,
        },
      });
    }

    const item = await db.sectionItem.update({
      where: { id },
      data: dataToUpdate,
      include: {
        section: { select: { id: true, name: true, color: true } },
        subTasks: { select: { id: true, isCompleted: true } },
        _count: { select: { attachments: true, logs: true } },
      },
    });

    logger.info("Item rescheduled", { itemId: id, scheduledDate: key, userId: user.id });
    return apiSuccess({ item });
  } catch (error) {
    logger.error("Failed to schedule item", error);
    return apiError("Internal server error while scheduling item", 500);
  }
}
