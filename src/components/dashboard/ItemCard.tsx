"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Calendar,
  Paperclip,
  RotateCw,
  ExternalLink,
  CalendarClock,
  CalendarPlus,
  Crosshair,
  Check,
  Target,
  Percent,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Item, ProgressLog } from "@/types";
import { cn, formatDate, isPastDue, PRIORITY_STYLES } from "@/lib/utils";
import { computeSubTaskProgress } from "@/lib/progress";
import { useFocus } from "@/components/focus/FocusProvider";
import { toDateKey, todayKey, formatDateKey } from "@/lib/dates";
import { getItemGoalDates, formatGoalRange, getSectionKind, calculateGoalProgress, isGoalItem, calculateDaysLeft } from "@/lib/goals";

export type ReschedulePreset = "today" | "tomorrow" | "nextWeek";

interface ItemCardProps {
  item: Item;
  density?: "compact" | "comfortable";
  /** Name of the item's home section, shown when the card is displayed outside it (Daily view) */
  sectionLabel?: string;
  onToggleStatus: (item: Item) => void;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
  onDelete: (item: Item) => void;
  onReschedule?: (item: Item, target: ReschedulePreset | { date: string }) => void;
}

export function ItemCard({
  item,
  density = "compact",
  sectionLabel,
  onToggleStatus,
  onEdit,
  onArchive,
  onDelete,
  onReschedule,
}: ItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(item.progress ?? 0);
  const [showProgressAdjuster, setShowProgressAdjuster] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState(false);
  const [updates, setUpdates] = useState<ProgressLog[]>(item.logs || []);
  const [newUpdateNote, setNewUpdateNote] = useState("");
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  const focus = useFocus();

  const isDone = item.status === "DONE";
  const priorityInfo = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.MEDIUM;
  const overdue = !isDone && isPastDue(item.dueDate);

  const isGoal = isGoalItem(item);
  const goalProgress = isGoal ? calculateGoalProgress(item.subGoals) : null;
  const goalDates = isGoal ? getItemGoalDates(item) : null;
  const goalDateRange = goalDates ? formatGoalRange(goalDates.startDate, goalDates.endDate) : null;
  const goalDaysLeft = goalDates?.endDate ? calculateDaysLeft(goalDates.endDate) : null;

  const subTasks = item.subTasks ?? [];
  const subDone = subTasks.filter((s) => s.isCompleted).length;
  const computedProgress = subTasks.length > 0 ? computeSubTaskProgress(subTasks) ?? currentProgress : currentProgress;
  const attachmentCount = item._count?.attachments ?? 0;
  const showProgressBar = subTasks.length > 0 || computedProgress > 0;

  // Keep progress in sync with item prop changes
  useEffect(() => {
    setCurrentProgress(item.progress ?? 0);
  }, [item.progress]);

  useEffect(() => {
    if (item.logs) {
      setUpdates(item.logs);
    }
  }, [item.logs]);

  // Check if this task is actively focused
  const isFocusedTask = focus.taskId === item.id;
  const isFocusPulsing = isFocusedTask && focus.isFocusActive;

  const handleStatusToggle = () => {
    if (!isDone) {
      setJustCompleted(true);
      setCurrentProgress(100);
      setTimeout(() => setJustCompleted(false), 1200);
    } else {
      setCurrentProgress(0);
    }
    onToggleStatus(item);
  };

  const handleUpdateProgress = async (newVal: number) => {
    const clamped = Math.max(0, Math.min(100, newVal));
    setCurrentProgress(clamped);
    setShowProgressAdjuster(false);

    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: clamped }),
      });

      if (clamped === 100 && !isDone) {
        onToggleStatus(item);
      } else if (clamped < 100 && isDone) {
        onToggleStatus(item);
      }
    } catch {
      // optimistic fallback
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = newUpdateNote.trim();
    if (!note || isPostingUpdate) return;

    setIsPostingUpdate(true);
    try {
      const res = await fetch(`/api/items/${item.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, progressSnapshot: computedProgress }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.log) {
        setUpdates((prev) => [data.data.log, ...prev]);
        setNewUpdateNote("");
      }
    } catch {
      // ignore
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const reschedule = (target: ReschedulePreset | { date: string }) => {
    setMenuOpen(false);
    onReschedule?.(item, target);
  };

  const handleFocusOnTask = () => {
    setMenuOpen(false);
    focus.start({ id: item.id, title: item.title });
  };

  const isScheduledToday = item.scheduledDate && toDateKey(item.scheduledDate) === todayKey();

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-all duration-200 overflow-hidden",
        "bg-white/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08]",
        "border-slate-200/70 dark:border-white/10 hover:border-[#00eaff]/40 dark:hover:border-[#00eaff]/30",
        "shadow-xs hover:shadow-md hover:shadow-[#00eaff]/5 backdrop-blur-md",
        !isGoal && isDone && "opacity-65 bg-slate-50/40 dark:bg-white/[0.02]",
        justCompleted && "ring-1 ring-[#00ffaa] border-[#00ffaa] shadow-[0_0_15px_rgba(0,255,170,0.3)]",
        isFocusPulsing && "focus-ring-pulse ring-1 ring-[#00eaff] border-[#00eaff]",
        density === "compact" ? "p-2.5" : "p-3"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Toggle Status Checkbox with dopamine animation OR Goal Target Icon */}
        {isGoal ? (
          <div className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 p-0.5" title="Goal">
            <Target className="w-4 h-4" />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStatusToggle}
            className={cn(
              "mt-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0 focus:outline-hidden rounded-full cursor-pointer",
              justCompleted && "check-pop"
            )}
            title={isDone ? "Mark as in-progress" : "Mark as done (100%)"}
            aria-label={isDone ? "Reopen item" : "Complete item"}
          >
            {isDone ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Item Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <Link
              href={`/items/${item.id}`}
              className={cn(
                "text-xs sm:text-sm font-medium leading-snug cursor-pointer truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition min-w-0",
                !isGoal && isDone
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-900 dark:text-slate-100"
              )}
              title={item.title}
            >
              {item.title}
            </Link>

            {/* Quick action menu trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                aria-label="Item options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 max-w-[calc(100vw-32px)] glass-panel ring-1 ring-white/10 rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in">
                    <Link
                      href={`/items/${item.id}`}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                      Open Workspace
                    </Link>
                    <button
                      type="button"
                      onClick={handleFocusOnTask}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      Focus on Task (25m)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(item);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      Quick Edit
                    </button>
                    {onReschedule && (
                      <>
                        <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                        <button
                          type="button"
                          onClick={() => reschedule("today")}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => reschedule("tomorrow")}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                          Move to Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => reschedule("nextWeek")}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-sky-500" />
                          Next Week
                        </button>
                        <label className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="shrink-0">Pick Date</span>
                          <input
                            type="date"
                            aria-label="Pick schedule date"
                            className="min-w-0 flex-1 bg-transparent text-[10px] focus:outline-hidden"
                            onChange={(e) => e.target.value && reschedule({ date: e.target.value })}
                          />
                        </label>
                        <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive(item);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-500" />
                      {item.isArchived ? "Restore" : "Archive"}
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(item);
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Optional Description / Note */}
          {item.description && !expandedUpdates && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          )}

          {/* Badges / Micro-Indicators row */}
          {isGoal ? (
            <div className="w-full mt-2 space-y-1.5">
              {goalDateRange && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-medium shrink-0">
                    <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{goalDateRange}</span>
                  </span>
                  {goalDaysLeft && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 border whitespace-nowrap",
                        goalDaysLeft.isOverdue
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50"
                          : goalDaysLeft.isWarning
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                          : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50"
                      )}
                      title={`Due ${goalDates?.endDate} (${goalDaysLeft.label})`}
                    >
                      <Clock className="w-2.5 h-2.5 shrink-0 opacity-80" />
                      <span>{goalDaysLeft.label}</span>
                    </span>
                  )}
                </div>
              )}

              {goalProgress && goalProgress.totalTasks > 0 ? (
                <>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <Target className="w-3 h-3" />
                      <span>Goal Progress</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {goalProgress.completedTasks}/{goalProgress.totalTasks} ({goalProgress.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        goalProgress.percentage === 100
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500"
                      )}
                      style={{ width: `${goalProgress.percentage}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 py-0.5">
                  <Target className="w-3 h-3 text-slate-400" />
                  <span>No tasks yet</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {/* Target parent badge when shown in Daily planner or anywhere */}
              {item.subGoal && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  title={`Goal: ${item.subGoal.goal?.title || "Goal"} › Target: ${item.subGoal.title}`}
                >
                  <Target className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[140px]">
                    {item.subGoal.goal?.title ? `${item.subGoal.goal.title} › ` : ""}{item.subGoal.title}
                  </span>
                </span>
              )}

              {/* Priority Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border",
                  priorityInfo.badgeClass
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", priorityInfo.dotClass)} />
                {priorityInfo.label}
              </span>

              {/* Scheduled Date Pill */}
              {item.scheduledDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
                    isScheduledToday
                      ? "bg-rose-50/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-900"
                      : "bg-slate-100/70 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border-slate-200/80 dark:border-white/10"
                  )}
                  title={`Scheduled for ${toDateKey(item.scheduledDate)}`}
                >
                  <Calendar className="w-2.5 h-2.5" />
                  {isScheduledToday ? "Today" : formatDateKey(toDateKey(item.scheduledDate))}
                </span>
              )}

              {/* Start & End Time Badge */}
              {(item.startTime || item.endTime) && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-indigo-50/80 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                  title={`Time: ${item.startTime || ""} ${item.startTime && item.endTime ? "–" : ""} ${item.endTime || ""}`}
                >
                  <Clock className="w-2.5 h-2.5 text-indigo-500" />
                  <span>
                    {item.startTime}
                    {item.startTime && item.endTime ? " – " : ""}
                    {item.endTime}
                  </span>
                </span>
              )}

              {/* Progress (%) interactive badge */}
              <button
                type="button"
                onClick={() => setShowProgressAdjuster(!showProgressAdjuster)}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer",
                  computedProgress === 100
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : computedProgress > 0
                    ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800"
                    : "bg-slate-100/70 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/10 hover:text-indigo-600"
                )}
                title="Click to adjust progress percentage (%)"
              >
                <Percent className="w-2.5 h-2.5" />
                <span>{computedProgress}%</span>
              </button>

              {/* Note / Updates toggle button */}
              <button
                type="button"
                onClick={() => setExpandedUpdates(!expandedUpdates)}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition cursor-pointer",
                  updates.length > 0
                    ? "bg-amber-50/80 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                    : "bg-slate-100/60 text-slate-500 border-slate-200/70 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/10 hover:text-indigo-600"
                )}
                title={expandedUpdates ? "Hide updates and notes" : "View notes and add updates"}
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{updates.length > 0 ? `${updates.length} update${updates.length > 1 ? "s" : ""}` : "Note / Update"}</span>
                {expandedUpdates ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>

              {/* Due date if provided and different */}
              {item.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
                    overdue
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 animate-pulse"
                      : "bg-slate-100/70 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/10"
                  )}
                  title={overdue ? "Overdue item!" : `Due ${formatDate(item.dueDate)}`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(item.dueDate)}
                </span>
              )}

              {/* Section label (when shown in Daily planner outside home section) */}
              {sectionLabel && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-slate-100/80 text-slate-600 border-slate-200/80 dark:bg-white/[0.04] dark:text-slate-300 dark:border-white/10">
                  {sectionLabel}
                </span>
              )}

              {/* Sub-task counter (✓ 2/4) */}
              {subTasks.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-indigo-50/70 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60"
                  title="Sub-tasks completed"
                >
                  <Check className="w-2.5 h-2.5 text-indigo-500" />
                  {subDone}/{subTasks.length}
                </span>
              )}

              {/* Attachment count (📎 3) */}
              {attachmentCount > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-slate-100/70 text-slate-600 border-slate-200/70 dark:bg-white/[0.04] dark:text-slate-300 dark:border-white/10"
                  title={`${attachmentCount} attachment(s)`}
                >
                  <Paperclip className="w-2.5 h-2.5" />
                  {attachmentCount}
                </span>
              )}

              {/* Rollover badge (↻ 1) */}
              {item.rolloverCount > 0 && !isDone && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900"
                  title={`Rolled over ${item.rolloverCount} times`}
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  ↻ {item.rolloverCount}
                </span>
              )}

              {/* Active Focus Mode Indicator */}
              {isFocusPulsing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Focus Active
                </span>
              )}
            </div>
          )}

          {/* Quick Progress Adjuster Row */}
          {showProgressAdjuster && (
            <div className="mt-2.5 p-2 rounded-xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1.5 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Set Progress Percentage</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{currentProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentProgress}
                onChange={(e) => setCurrentProgress(Number(e.target.value))}
                onMouseUp={() => handleUpdateProgress(currentProgress)}
                onTouchEnd={() => handleUpdateProgress(currentProgress)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 pt-1">
                {[0, 25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleUpdateProgress(p)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer",
                      currentProgress === p
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-white dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-indigo-50"
                    )}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Notes & Updates Drawer */}
          {expandedUpdates && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50/95 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-2.5 animate-in fade-in slide-in-from-top-1">
              {/* Task Note / Description */}
              {item.description && (
                <div className="p-2 rounded-lg bg-white/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Note:</span>
                  {item.description}
                </div>
              )}

              {/* Updates List */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Progress Updates ({updates.length})
                </span>

                {updates.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    No progress updates posted yet.
                  </p>
                ) : (
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                    {updates.map((log) => (
                      <div
                        key={log.id}
                        className="p-1.5 rounded-lg bg-white/70 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 text-xs flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 dark:text-slate-200 leading-snug">
                            {log.note}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(log.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                            {" "}
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.progressSnapshot !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                            {log.progressSnapshot}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Update Form */}
              <form onSubmit={handlePostUpdate} className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-white/5">
                <input
                  type="text"
                  placeholder="Post an update or note..."
                  value={newUpdateNote}
                  onChange={(e) => setNewUpdateNote(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newUpdateNote.trim() || isPostingUpdate}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Update</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Sleek 2.5px glowing progress bar along the bottom edge */}
      {showProgressBar && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-200/50 dark:bg-white/[0.06] overflow-hidden"
          title={`${computedProgress}% complete`}
        >
          <div
            className={cn(
              "h-full transition-all duration-500",
              computedProgress >= 100
                ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
            )}
            style={{ width: `${computedProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
