import { toDateKey } from "./dates";

/**
 * Extracts a normalized "YYYY-MM-DD" date key from a task's scheduledDate or dueDate.
 * Returns null if no date is set.
 */
export function getTaskScheduleDateKey(task: {
  scheduledDate?: Date | string | null;
  dueDate?: Date | string | null;
}): string | null {
  if (task.scheduledDate) {
    try {
      return toDateKey(task.scheduledDate);
    } catch {
      return String(task.scheduledDate).slice(0, 10);
    }
  }
  if (task.dueDate) {
    try {
      return toDateKey(task.dueDate);
    } catch {
      return String(task.dueDate).slice(0, 10);
    }
  }
  return null;
}

/**
 * Section Ordering:
 * - By default sorted by custom orderIndex (0, 1, 2, ...).
 * - Fallback to creation time, oldest first.
 * - Stable deterministic tie-breaker by id.
 */
export function sortSections<T extends {
  id?: string;
  orderIndex?: number | null;
  createdAt?: Date | string | null;
}>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    const orderA = typeof a.orderIndex === "number" ? a.orderIndex : Infinity;
    const orderB = typeof b.orderIndex === "number" ? b.orderIndex : Infinity;
    if (orderA !== orderB) return orderA - orderB;

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;

    return (a.id || "").localeCompare(b.id || "");
  });
}

/**
 * Goal Ordering:
 * - Chronological creation order, oldest first.
 * - No manual reordering permitted.
 * - Stable deterministic tie-breaker by id.
 */
export function sortGoals<T extends {
  id?: string;
  createdAt?: Date | string | null;
}>(goals: T[]): T[] {
  return [...goals].sort((a, b) => {
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;

    return (a.id || "").localeCompare(b.id || "");
  });
}

/**
 * Target (SubGoal) Ordering:
 * - Chronological creation order within each Goal, oldest first.
 * - No manual reordering permitted.
 * - Stable deterministic tie-breaker by id.
 */
export function sortTargets<T extends {
  id?: string;
  createdAt?: Date | string | null;
}>(targets: T[]): T[] {
  return [...targets].sort((a, b) => {
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;

    return (a.id || "").localeCompare(b.id || "");
  });
}

/**
 * Task Ordering:
 * - Earliest scheduled Task at the top, latest at the bottom.
 * - Tasks without a scheduled date or time appear after all scheduled Tasks.
 * - Unscheduled Tasks are sorted by creation time, oldest first.
 * - Same scheduled date tasks are sorted by startTime (earliest time first, no time after timed).
 * - Stable deterministic tie-breaker by id.
 */
export function sortTasks<T extends {
  id?: string;
  scheduledDate?: Date | string | null;
  dueDate?: Date | string | null;
  startTime?: string | null;
  createdAt?: Date | string | null;
}>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const dateKeyA = getTaskScheduleDateKey(a);
    const dateKeyB = getTaskScheduleDateKey(b);

    const isScheduledA = Boolean(dateKeyA);
    const isScheduledB = Boolean(dateKeyB);

    // Scheduled tasks appear before unscheduled tasks
    if (isScheduledA && !isScheduledB) return -1;
    if (!isScheduledA && isScheduledB) return 1;

    // Both are unscheduled: sort by creation time, oldest first
    if (!isScheduledA && !isScheduledB) {
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (createdA !== createdB) return createdA - createdB;
      return (a.id || "").localeCompare(b.id || "");
    }

    // Both are scheduled: compare date keys
    if (dateKeyA !== dateKeyB) {
      return (dateKeyA as string).localeCompare(dateKeyB as string);
    }

    // Identical scheduled date: compare startTime
    const timeA = (a.startTime || "").trim();
    const timeB = (b.startTime || "").trim();

    const hasTimeA = Boolean(timeA);
    const hasTimeB = Boolean(timeB);

    if (hasTimeA && !hasTimeB) return -1;
    if (!hasTimeA && hasTimeB) return 1;

    if (hasTimeA && hasTimeB && timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    // Identical date and time: sort by creation time, oldest first
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdA !== createdB) return createdA - createdB;

    return (a.id || "").localeCompare(b.id || "");
  });
}

/**
 * Dispatches items to Goal ordering or Task ordering depending on section type.
 */
export function sortSectionItems<T extends {
  id?: string;
  itemType?: string;
  subGoalId?: string | null;
  subGoals?: unknown[];
  scheduledDate?: Date | string | null;
  dueDate?: Date | string | null;
  startTime?: string | null;
  createdAt?: Date | string | null;
}>(items: T[], isGoalSection: boolean): T[] {
  if (isGoalSection) {
    return sortGoals(items);
  }
  return sortTasks(items);
}
