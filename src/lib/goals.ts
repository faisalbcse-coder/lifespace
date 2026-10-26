import { SectionKind } from "@/types";
import { formatDateKey, toDateKey } from "./dates";

/**
 * Returns whether a section is Task-based ("TASK") or Goal-centric ("GOAL").
 * Task-based sections (e.g. Daily, Current, Next) use a single date.
 * Goal-centric sections (e.g. Skill, Project Parking, Goals) use Start and End dates.
 */
export function getSectionKind(section?: {
  name?: string;
  color?: string | null;
  type?: SectionKind;
} | null): SectionKind {
  if (!section) return "TASK";
  if (section.type === "GOAL" || section.type === "TASK") {
    return section.type;
  }
  if (section.color && section.color.includes(":")) {
    const part = section.color.split(":")[1];
    if (part === "GOAL" || part === "TASK") return part;
  }
  const name = (section.name || "").trim().toLowerCase();
  if (
    name === "skill" ||
    name === "project parking" ||
    name.includes("goal") ||
    name.includes("target") ||
    name.includes("project")
  ) {
    return "GOAL";
  }
  return "TASK";
}

/**
 * Returns true if an item is a top-level Goal in the hierarchy:
 * Section -> Goal -> Target -> Task
 */
export function isGoalItem(item?: {
  itemType?: string;
  subGoalId?: string | null;
  subGoals?: unknown[];
  section?: { name?: string; color?: string | null; type?: SectionKind } | null;
} | null): boolean {
  if (!item) return false;
  // Child tasks under a Target (subGoalId) are always tasks, not goals
  if (item.subGoalId) return false;
  if (item.itemType === "GOAL") return true;
  if (item.subGoals && item.subGoals.length > 0) return true;
  if (item.section && getSectionKind(item.section) === "GOAL") return true;
  return false;
}

/**
 * Strips any `:GOAL` or `:TASK` suffix from section.color, returning a valid accent key.
 */
export function getCleanColor(color?: string | null): string {
  if (!color) return "indigo";
  return color.split(":")[0] || "indigo";
}

/**
 * Encodes color and kind together into a single string (e.g. "emerald:GOAL")
 * safely persistable in the Section.color column without breaking existing schemas.
 */
export function encodeSectionColor(baseColor: string, kind: SectionKind): string {
  const clean = getCleanColor(baseColor);
  return `${clean}:${kind}`;
}

/**
 * Extracts Start and End dates for an item.
 * For Goal-centric items:
 * - Start date: item.startDate, or parsed from item.metadata, or item.scheduledDate
 * - End date: item.dueDate
 */
export function getItemGoalDates(item: {
  scheduledDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dueDate?: string | null;
  metadata?: string | null;
}): { startDate: string | null; endDate: string | null } {
  let startDate: string | null = null;

  if (item.startDate) {
    startDate = toDateKey(item.startDate);
  } else if (item.metadata) {
    try {
      const parsed = JSON.parse(item.metadata);
      if (parsed.startDate) {
        startDate = toDateKey(parsed.startDate);
      }
    } catch {
      // ignore
    }
  }

  // Fallback: If scheduledDate is present, treat as startDate for goals
  if (!startDate && item.scheduledDate) {
    startDate = toDateKey(item.scheduledDate);
  }

  let endDate: string | null = null;
  if (item.endDate) {
    endDate = toDateKey(item.endDate);
  } else if (item.dueDate) {
    endDate = toDateKey(item.dueDate);
  }

  return { startDate, endDate };
}

/**
 * Formats a clean date range for display (e.g. "Oct 20 – Nov 15")
 */
export function formatGoalRange(
  startDateKey: string | null | undefined,
  endDateKey: string | null | undefined
): string | null {
  if (!startDateKey && !endDateKey) return null;
  if (startDateKey && endDateKey) {
    return `${formatDateKey(startDateKey)} – ${formatDateKey(endDateKey)}`;
  }
  if (startDateKey) return `Starts ${formatDateKey(startDateKey)}`;
  return `Due ${formatDateKey(endDateKey!)}`;
}

/**
 * Calculates duration in days between two YYYY-MM-DD date keys.
 */
export function calculateDurationDays(
  startDateKey: string | null | undefined,
  endDateKey: string | null | undefined
): number | null {
  if (!startDateKey || !endDateKey) return null;
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  if (isNaN(start.getTime()) || end.getTime() < start.getTime()) return null;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculates remaining days from today until an end date (e.g. for goals / targets).
 */
export function calculateDaysLeft(endDateKey: string | null | undefined): {
  daysLeft: number;
  label: string;
  isOverdue: boolean;
  isWarning: boolean;
} | null {
  if (!endDateKey) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(`${endDateKey}T00:00:00`);
  if (isNaN(end.getTime())) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((end.getTime() - today.getTime()) / msPerDay);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      daysLeft: diffDays,
      label: overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`,
      isOverdue: true,
      isWarning: true,
    };
  }

  if (diffDays === 0) {
    return {
      daysLeft: 0,
      label: "Ends today",
      isOverdue: false,
      isWarning: true,
    };
  }

  return {
    daysLeft: diffDays,
    label: diffDays === 1 ? "1 day left" : `${diffDays} days left`,
    isOverdue: false,
    isWarning: diffDays <= 7,
  };
}

/**
 * Calculates progress metrics for a Sub-Goal from its tasks.
 * Returns null percentage if there are no tasks (neutral empty state).
 */
export function calculateSubGoalProgress(tasks?: Array<{ status?: string }> | null): {
  totalTasks: number;
  completedTasks: number;
  percentage: number | null;
} {
  const all = tasks || [];
  const totalTasks = all.length;
  if (totalTasks === 0) {
    return { totalTasks: 0, completedTasks: 0, percentage: null };
  }
  const completedTasks = all.filter((t) => t.status === "DONE").length;
  const percentage = Math.round((completedTasks / totalTasks) * 100);
  return { totalTasks, completedTasks, percentage };
}

/**
 * Calculates progress metrics for a Goal from all tasks across all its Sub-Goals.
 * Returns null percentage if there are no descendant tasks.
 */
export function calculateGoalProgress(
  subGoals?: Array<{ tasks?: Array<{ status?: string }> }> | null
): {
  totalTasks: number;
  completedTasks: number;
  percentage: number | null;
} {
  const allSubGoals = subGoals || [];
  const allTasks = allSubGoals.flatMap((sg) => sg.tasks || []);
  return calculateSubGoalProgress(allTasks);
}
