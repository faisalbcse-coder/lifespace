import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateTime(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isPastDue(dueDate?: Date | string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

export const PRIORITY_STYLES: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    dotClass: "bg-blue-500",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    dotClass: "bg-amber-500",
  },
  URGENT: {
    label: "Urgent",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    dotClass: "bg-rose-500",
  },
};

export const SECTION_ACCENTS: Record<
  string,
  { border: string; bg: string; text: string; headerBg: string; glow: string; barBg: string; dotBg: string }
> = {
  indigo: {
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    bg: "bg-indigo-50/30 dark:bg-indigo-950/10",
    text: "text-indigo-600 dark:text-indigo-400",
    headerBg: "bg-indigo-500/5 dark:bg-indigo-500/10",
    glow: "#6366f1",
    barBg: "bg-indigo-500",
    dotBg: "bg-indigo-500",
  },
  blue: {
    border: "border-sky-500/20 hover:border-sky-500/40",
    bg: "bg-sky-50/30 dark:bg-sky-950/10",
    text: "text-sky-600 dark:text-sky-400",
    headerBg: "bg-sky-500/5 dark:bg-sky-500/10",
    glow: "#0ea5e9",
    barBg: "bg-sky-500",
    dotBg: "bg-sky-500",
  },
  emerald: {
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/10",
    text: "text-emerald-600 dark:text-emerald-400",
    headerBg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    glow: "#10b981",
    barBg: "bg-emerald-500",
    dotBg: "bg-emerald-500",
  },
  amber: {
    border: "border-amber-500/20 hover:border-amber-500/40",
    bg: "bg-amber-50/30 dark:bg-amber-950/10",
    text: "text-amber-600 dark:text-amber-400",
    headerBg: "bg-amber-500/5 dark:bg-amber-500/10",
    glow: "#f59e0b",
    barBg: "bg-amber-500",
    dotBg: "bg-amber-500",
  },
  rose: {
    border: "border-rose-500/20 hover:border-rose-500/40",
    bg: "bg-rose-50/30 dark:bg-rose-950/10",
    text: "text-rose-600 dark:text-rose-400",
    headerBg: "bg-rose-500/5 dark:bg-rose-500/10",
    glow: "#f43f5e",
    barBg: "bg-rose-500",
    dotBg: "bg-rose-500",
  },
  violet: {
    border: "border-purple-500/20 hover:border-purple-500/40",
    bg: "bg-purple-50/30 dark:bg-purple-950/10",
    text: "text-purple-600 dark:text-purple-400",
    headerBg: "bg-purple-500/5 dark:bg-purple-500/10",
    glow: "#8b5cf6",
    barBg: "bg-purple-500",
    dotBg: "bg-purple-500",
  },
  cyan: {
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    bg: "bg-cyan-50/30 dark:bg-cyan-950/10",
    text: "text-cyan-600 dark:text-cyan-400",
    headerBg: "bg-cyan-500/5 dark:bg-cyan-500/10",
    glow: "#06b6d4",
    barBg: "bg-cyan-500",
    dotBg: "bg-cyan-500",
  },
  gray: {
    border: "border-slate-500/20 hover:border-slate-500/40",
    bg: "bg-slate-50/30 dark:bg-slate-900/20",
    text: "text-slate-600 dark:text-slate-400",
    headerBg: "bg-slate-500/5 dark:bg-slate-500/10",
    glow: "#64748b",
    barBg: "bg-slate-500",
    dotBg: "bg-slate-500",
  },
};
