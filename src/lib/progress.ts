/**
 * Computes progress percentage from sub-task completion.
 * Returns null if there are no sub-tasks (progress is then manual).
 * Pure & client-safe.
 */
export function computeSubTaskProgress(
  subTasks: { isCompleted: boolean }[]
): number | null {
  if (subTasks.length === 0) return null;
  const done = subTasks.filter((s) => s.isCompleted).length;
  return Math.round((done / subTasks.length) * 100);
}
