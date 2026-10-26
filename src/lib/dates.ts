/**
 * Date-only helpers for the daily planner.
 *
 * `scheduledDate` is always stored as UTC midnight of the *calendar day* the user
 * sees (e.g. "2026-10-20" -> 2026-10-20T00:00:00.000Z). These helpers are pure and
 * safe to import from both server and client code.
 */

export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a "YYYY-MM-DD" string into a Date at UTC midnight. Returns null if invalid. */
export function parseDateKey(key: string): Date | null {
  if (!DATE_KEY_REGEX.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow dates such as 2026-02-31
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Formats a Date as "YYYY-MM-DD" using its UTC components. */
export function toDateKey(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

/** UTC midnight for the local calendar day of `now`. */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Local "YYYY-MM-DD" key for today. */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(startOfToday(now));
}

/** Adds whole days to a date key and returns a new date key. */
export function addDaysToKey(key: string, days: number): string {
  const base = parseDateKey(key);
  if (!base) throw new Error(`Invalid date key: ${key}`);
  base.setUTCDate(base.getUTCDate() + days);
  return toDateKey(base);
}

/** Human readable label for a date key (e.g. "Tue, Oct 20"). */
export function formatDateKey(key: string): string {
  const d = parseDateKey(key);
  if (!d) return key;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
