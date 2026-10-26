import { db } from "./db";
import { logger } from "./logger";
import { startOfToday } from "./dates";
import { computeSubTaskProgress } from "./progress";

export { computeSubTaskProgress };

/**
 * Recalculates and persists `progress` for an item from its sub-tasks.
 * If the item has no sub-tasks the stored (manual) progress is left untouched.
 */
export async function recalculateItemProgress(itemId: string): Promise<number | null> {
  const subTasks = await db.subTask.findMany({
    where: { itemId },
    select: { isCompleted: true },
  });
  const progress = computeSubTaskProgress(subTasks);
  if (progress !== null) {
    await db.sectionItem.update({ where: { id: itemId }, data: { progress } });
  }
  return progress;
}

/**
 * Transactionally moves every incomplete, non-archived item scheduled before the
 * start of today onto today, incrementing `rolloverCount`. Completed items stay
 * on their original date. Returns the number of rolled-over items.
 */
export async function rolloverOverdueDailyTasks(
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const today = startOfToday(now);
  try {
    const count = await db.$transaction(async (tx) => {
      const result = await tx.sectionItem.updateMany({
        where: {
          userId,
          isArchived: false,
          status: { not: "DONE" },
          scheduledDate: { lt: today },
        },
        data: {
          scheduledDate: today,
          rolloverCount: { increment: 1 },
        },
      });
      return result.count;
    });
    if (count > 0) {
      logger.info("Rolled over overdue daily tasks", { userId, count });
    }
    return count;
  } catch (error) {
    logger.error("Failed to roll over daily tasks", error, { userId });
    throw error;
  }
}
