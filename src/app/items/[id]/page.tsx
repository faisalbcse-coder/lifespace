"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  RotateCw,
  Trash2,
  Sun,
  Edit2,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  ListTodo,
  Check,
  FileText,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { NotesEditor } from "@/components/workspace/NotesEditor";
import { SubTaskChecklist } from "@/components/workspace/SubTaskChecklist";
import { AttachmentHub } from "@/components/workspace/AttachmentHub";
import { ProgressTimeline } from "@/components/workspace/ProgressTimeline";
import { ItemAttachment, ItemDetail, ItemPriority, ItemStatus, ProgressLog, Section, SubTask } from "@/types";
import { computeSubTaskProgress } from "@/lib/progress";
import { toDateKey, formatDateKey } from "@/lib/dates";
import { cn, SECTION_ACCENTS } from "@/lib/utils";
import { getSectionKind, getCleanColor, getItemGoalDates, calculateDurationDays, isGoalItem } from "@/lib/goals";
import { GoalHierarchyView } from "@/components/workspace/GoalHierarchyView";
import { notesToHtml } from "@/lib/richtext";

const selectClass =
  "w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1";

/** Converts a stored ISO date to the local YYYY-MM-DD for <input type="date"> */
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ItemWorkspacePage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [manualProgress, setManualProgress] = useState(0);
  const [attachmentToDelete, setAttachmentToDelete] = useState<ItemAttachment | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.status === 401) {
        window.location.replace("/login");
        return;
      }
      const me = await meRes.json();
      const theme = me?.data?.preference?.theme;
      const root = document.documentElement;
      if (theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      const [itemRes, secRes] = await Promise.all([
        fetch(`/api/items/${itemId}`),
        fetch("/api/sections"),
      ]);
      if (itemRes.status === 404) {
        setNotFound(true);
        return;
      }
      const itemData = await itemRes.json();
      if (!itemRes.ok || !itemData.success) throw new Error(itemData.error);
      const secData = await secRes.json();
      setItem(itemData.data.item);
      setTitle(itemData.data.item.title);
      setManualProgress(itemData.data.item.progress);
      if (secData.success) setSections(secData.data.sections);
    } catch {
      toastRef.current.error("Failed to load task workspace.");
    } finally {
      setLoading(false);
    }
  }, [itemId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  /** PATCH core fields and merge the response without clobbering nested collections. */
  const patchItem = useCallback(
    async (partial: Record<string, unknown>) => {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update task");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { subTasks: _s, _count: _c, ...fresh } = data.data.item;
      setItem((prev) => (prev ? { ...prev, ...fresh } : prev));
    },
    [itemId]
  );

  const safePatch = async (partial: Record<string, unknown>, okMessage?: string) => {
    try {
      await patchItem(partial);
      if (okMessage) toast.success(okMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const schedule = async (body: { scheduledDate?: string | null; preset?: string }) => {
    try {
      const res = await fetch(`/api/items/${itemId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to reschedule");
      const updated = data.data.item;
      setItem((prev) =>
        prev ? { ...prev, scheduledDate: updated.scheduledDate, rolloverCount: updated.rolloverCount } : prev
      );
      toast.success(updated.scheduledDate ? "Rescheduled" : "Removed from planner");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    }
  };

  const commitTitle = () => {
    const next = title.trim();
    if (!item) return;
    if (!next) {
      setTitle(item.title);
      return;
    }
    if (next !== item.title) void safePatch({ title: next }, "Title updated");
  };

  const onManualProgress = (value: number) => {
    setManualProgress(value);
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => void safePatch({ progress: value }), 500);
  };

  const deleteAttachment = async () => {
    const target = attachmentToDelete;
    setAttachmentToDelete(null);
    if (!target || !item) return;
    try {
      const res = await fetch(`/api/items/${itemId}/attachments/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItem({ ...item, attachments: item.attachments.filter((a) => a.id !== target.id) });
      toast.success("Attachment deleted");
    } catch {
      toast.error("Failed to delete attachment");
    }
  };

  const deleteItem = async () => {
    setConfirmDeleteItem(false);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300">
        <h1 className="text-lg font-semibold">Task not found</h1>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const isGoal = isGoalItem(item);

  if (isGoal) {
    const dates = getItemGoalDates(item);
    return (
      <GoalHierarchyView
        goalId={item.id}
        initialTitle={item.title}
        initialStartDate={dates.startDate}
        initialEndDate={dates.endDate}
        initialSubGoals={item.subGoals || []}
        onDeleteGoal={deleteItem}
      />
    );
  }

  const hasSubTasks = item.subTasks.length > 0;
  const progress = computeSubTaskProgress(item.subTasks) ?? (hasSubTasks ? item.progress : manualProgress);
  const cleanColor = getCleanColor(item.section.color);
  const accent = SECTION_ACCENTS[cleanColor] || SECTION_ACCENTS.indigo;

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-30 glass-nav">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            id="back-to-dashboard"
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          {/* Section badge + Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs min-w-0">
            <span
              className={cn(
                "px-2 sm:px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 sm:gap-1.5 text-xs shrink-0 max-w-[110px] sm:max-w-none truncate",
                accent.headerBg,
                accent.text
              )}
            >
              <ListTodo className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">{item.section.name}</span>
            </span>

            {item.subGoal && (
              <Link
                href={`/items/${item.subGoal.goal?.id}`}
                className="hidden md:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:underline items-center gap-1 truncate max-w-[180px]"
                title={`Belongs to Sub-Goal "${item.subGoal.title}" under Goal "${item.subGoal.goal?.title}"`}
              >
                <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{item.subGoal.goal?.title} › {item.subGoal.title}</span>
              </Link>
            )}

            {/* Edit / Done Toggle Button */}
            {isEditing ? (
              <button
                type="button"
                onClick={() => {
                  commitTitle();
                  setIsEditing(false);
                  toast.success("Task details saved");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-btn text-white font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                title="Edit task details, title, and dates"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setConfirmDeleteItem(true)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 p-1.5 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 min-w-0">
        {/* ======================================================== */}
        {/* MODE 1: DETAILS VIEW MODE (Read / Presentation Mode)     */}
        {/* ======================================================== */}
        {!isEditing ? (
          <section className="rounded-2xl glass-surface ring-1 ring-white/10 p-5 sm:p-6 space-y-6 shadow-sm">
            {/* Title & Quick Status Checkbox */}
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={() =>
                  void safePatch(
                    { status: item.status === "DONE" ? "TODO" : "DONE" },
                    item.status === "DONE" ? "Marked to-do" : "Task completed! 🎉"
                  )
                }
                className="mt-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
                title={item.status === "DONE" ? "Mark as in-progress" : "Mark as done"}
                aria-label="Toggle task status"
              >
                {item.status === "DONE" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400 hover:text-indigo-500" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1
                    className={cn(
                      "text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight",
                      item.status === "DONE"
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    {item.title}
                  </h1>
                </div>

                {item.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Information Pills Grid (Status, Priority, Dates, Progress) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {/* Status */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className={labelClass}>Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.status === "DONE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  ) : item.status === "IN_PROGRESS" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      <Clock className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Circle className="w-3 h-3" /> To Do
                    </span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className={labelClass}>Priority</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                      item.priority === "URGENT"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : item.priority === "HIGH"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        : item.priority === "MEDIUM"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.priority}
                  </span>
                </div>
              </div>

              {/* Section */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className={labelClass}>Section</span>
                <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                  <span className={cn("w-2 h-2 rounded-full", accent.barBg || "bg-indigo-500")} />
                  <span className="truncate">{item.section.name}</span>
                </div>
              </div>

              {/* Dates: Due Date & Scheduled Date */}
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className={labelClass}>Due Date</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.dueDate ? formatDateKey(toDateKey(item.dueDate)) : "No due date"}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className={labelClass}>Scheduled For</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Sun className="w-3.5 h-3.5 text-rose-500" />
                  <span>{item.scheduledDate ? formatDateKey(toDateKey(item.scheduledDate)) : "Unscheduled"}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar Display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={labelClass + " mb-0"}>
                  Progress {hasSubTasks && <span className="normal-case font-normal">(auto from sub-tasks)</span>}
                </span>
                <span id="progress-value" className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                  {progress}%
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    progress >= 100
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>
        ) : (
          /* ======================================================== */
          /* MODE 2: EDIT MODE (Interactive Inputs & Forms)          */
          /* ======================================================== */
          <section className="rounded-2xl glass-surface ring-2 ring-indigo-500/50 p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Editing Task Details
              </span>
              <button
                type="button"
                onClick={() => {
                  setTitle(item.title);
                  setIsEditing(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>

            {/* Title Input */}
            <div>
              <label htmlFor="item-title-input" className={labelClass}>Task Title</label>
              <input
                id="item-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") setTitle(item.title);
                }}
                maxLength={255}
                aria-label="Task title"
                className="w-full text-xl sm:text-2xl font-bold tracking-tight bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 transition outline-hidden"
              />
            </div>

            {/* Form grid: Section, Status, Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="item-section" className={labelClass}>Section</label>
                <select
                  id="item-section"
                  value={item.sectionId}
                  onChange={(e) => {
                    const target = sections.find((s) => s.id === e.target.value);
                    void patchItem({ sectionId: e.target.value })
                      .then(() => {
                        if (target) {
                          setItem((prev) =>
                            prev ? { ...prev, section: { id: target.id, name: target.name, color: target.color } } : prev
                          );
                        }
                        toast.success("Moved to " + (target?.name ?? "section"));
                      })
                      .catch((err) => toast.error(err.message));
                  }}
                  className={selectClass}
                >
                  {(sections.length ? sections : [{ id: item.sectionId, name: item.section.name } as Section]).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="item-status" className={labelClass}>Status</label>
                <select
                  id="item-status"
                  value={item.status}
                  onChange={(e) => void safePatch({ status: e.target.value as ItemStatus })}
                  className={selectClass}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label htmlFor="item-priority" className={labelClass}>Priority</label>
                <select
                  id="item-priority"
                  value={item.priority}
                  onChange={(e) => void safePatch({ priority: e.target.value as ItemPriority })}
                  className={selectClass}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Dates: Due Date & Scheduled Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-due" className={labelClass}>
                  <Calendar className="inline w-3 h-3 mr-1 -mt-0.5" />Due date
                </label>
                <input
                  id="item-due"
                  type="date"
                  value={toLocalInputValue(item.dueDate)}
                  onChange={(e) =>
                    void safePatch({
                      dueDate: e.target.value ? new Date(`${e.target.value}T00:00:00`).toISOString() : null,
                    })
                  }
                  className={selectClass}
                />
              </div>

              <div>
                <label htmlFor="item-scheduled" className={labelClass}>
                  <Sun className="inline w-3 h-3 mr-1 -mt-0.5" />Scheduled for (Daily Planner)
                </label>
                <input
                  id="item-scheduled"
                  type="date"
                  value={item.scheduledDate ? toDateKey(item.scheduledDate) : ""}
                  onChange={(e) => void schedule({ scheduledDate: e.target.value || null })}
                  className={selectClass}
                />
              </div>
            </div>

            {/* Quick Reschedule Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quick Plan</span>
              <button
                type="button"
                onClick={() => void schedule({ preset: "today" })}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Sun className="w-3.5 h-3.5 text-rose-500" /> Today
              </button>
              <button
                id="move-tomorrow"
                type="button"
                onClick={() => void schedule({ preset: "tomorrow" })}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <CalendarClock className="w-3.5 h-3.5 text-amber-500" /> Move to Tomorrow
              </button>
              <button
                type="button"
                onClick={() => void schedule({ preset: "nextWeek" })}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-sky-500" /> Next Week
              </button>
              {item.scheduledDate && (
                <button
                  type="button"
                  onClick={() => void schedule({ scheduledDate: null })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:text-rose-600 transition"
                >
                  <CalendarX className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Progress Slider (when no subtasks) */}
            {!hasSubTasks && (
              <div>
                <label className={labelClass}>Manual Progress: {manualProgress}%</label>
                <input
                  id="progress-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={manualProgress}
                  onChange={(e) => onManualProgress(Number(e.target.value))}
                  aria-label="Manual progress"
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            )}
          </section>
        )}

        {/* Content columns (Notes / Details, Subtasks, Attachments, Timeline) */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            {/* Notes / Documentation View vs Edit */}
            {isEditing ? (
              <NotesEditor
                key={item.id}
                initialValue={item.content ?? ""}
                onSave={async (value) => {
                  await patchItem({ content: value });
                }}
              />
            ) : (
              <section className="rounded-2xl glass-surface ring-1 ring-white/10 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60 dark:border-white/10">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Notes & Requirements</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit Notes
                  </button>
                </div>

                {item.content ? (
                  <div
                    className="rich-content text-slate-800 dark:text-slate-200 font-sans"
                    dangerouslySetInnerHTML={{ __html: notesToHtml(item.content) }}
                  />
                ) : (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-medium">No notes or documentation added yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Click here to write notes
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* SubTask Checklist (Always interactive) */}
            <SubTaskChecklist
              itemId={item.id}
              subTasks={item.subTasks}
              onChange={(subTasks: SubTask[], serverProgress) =>
                setItem((prev) =>
                  prev
                    ? {
                        ...prev,
                        subTasks,
                        progress: serverProgress ?? computeSubTaskProgress(subTasks) ?? prev.progress,
                      }
                    : prev
                )
              }
              onError={(m) => toast.error(m)}
            />
          </div>

          <div className="space-y-6 min-w-0">
            <AttachmentHub
              itemId={item.id}
              attachments={item.attachments}
              onChange={(attachments) => setItem((prev) => (prev ? { ...prev, attachments } : prev))}
              onSuccess={(m) => toast.success(m)}
              onError={(m) => toast.error(m)}
              onRequestDelete={setAttachmentToDelete}
            />
            <ProgressTimeline
              itemId={item.id}
              logs={item.logs}
              currentProgress={progress}
              onChange={(logs: ProgressLog[]) => setItem((prev) => (prev ? { ...prev, logs } : prev))}
              onError={(m) => toast.error(m)}
            />
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={!!attachmentToDelete}
        title={`Delete "${attachmentToDelete?.title ?? ""}"?`}
        message="This attachment will be removed permanently."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => void deleteAttachment()}
        onCancel={() => setAttachmentToDelete(null)}
      />
      <ConfirmDialog
        isOpen={confirmDeleteItem}
        title={`Delete "${item.title}"?`}
        message="This task, its notes, sub-tasks, attachments and logs will be permanently deleted."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => void deleteItem()}
        onCancel={() => setConfirmDeleteItem(false)}
      />
    </div>
  );
}
