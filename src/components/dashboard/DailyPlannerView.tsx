"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  CheckCircle2,
  Circle,
  Sun,
  ListTodo,
  Target,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Trash2,
  Clock,
  MessageSquare,
  CalendarPlus,
  ListFilter,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { Item, Section } from "@/types";
import { ItemCard, ReschedulePreset } from "./ItemCard";
import { addDaysToKey, formatDateKey, todayKey, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { sortTasks } from "@/lib/ordering";

interface DailyPlannerViewProps {
  sections: Section[];
  selectedDate: string;
  onChangeDate: (dateKey: string) => void;
  onToggleItemStatus: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onArchiveItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onRescheduleItem: (
    item: Item,
    target: ReschedulePreset | { date: string; startTime?: string; endTime?: string; reason?: string }
  ) => void;
  onQuickAddTask: (title: string, dateKey: string) => Promise<void>;
  onNavigateToGoals?: () => void;
  density?: "compact" | "comfortable";
}

function getDaysOverdue(dateStr: string): number {
  try {
    const taskDate = new Date(dateStr + "T00:00:00");
    const todayDate = new Date(todayKey() + "T00:00:00");
    const diffTime = todayDate.getTime() - taskDate.getTime();
    return Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return 1;
  }
}

function getMonthDays(year: number, month: number) {
  // month: 0-indexed (0 = Jan, 11 = Dec)
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{
    day: number;
    month: number;
    year: number;
    dateKey: string;
    isCurrentMonth: boolean;
  }> = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, month: prevMonth, year: prevYear, dateKey, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, month, year, dateKey, isCurrentMonth: true });
  }

  // Next month padding to fill out 7-day row
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, month: nextMonth, year: nextYear, dateKey, isCurrentMonth: false });
  }

  return days;
}

export function DailyPlannerView({
  sections,
  selectedDate,
  onChangeDate,
  onToggleItemStatus,
  onEditItem,
  onArchiveItem,
  onDeleteItem,
  onRescheduleItem,
  onQuickAddTask,
  onNavigateToGoals,
  density = "compact",
}: DailyPlannerViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modes: "day" (default) | "overdue" | "all"
  const [viewMode, setViewMode] = useState<"day" | "overdue" | "all">("day");

  // Full Month Calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarYear, setCalendarYear] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  });

  // Per-task reschedule form state: { [taskId]: { date, startTime, endTime, reason } }
  const [rescheduleStates, setRescheduleStates] = useState<
    Record<string, { date: string; startTime: string; endTime: string; reason: string }>
  >({});

  const isToday = selectedDate === todayKey();

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isCalendarOpen]);

  // Sync calendar viewing month when selectedDate changes
  useEffect(() => {
    const d = new Date(selectedDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    }
  }, [selectedDate]);

  // Find daily section if available
  const dailySection = sections.find((s) => {
    const n = s.name.trim().toLowerCase();
    return n === "daily" || n === "daily task" || n.startsWith("daily");
  });

  // Collect all items from across all active sections
  const allCandidateItems = useMemo(
    () =>
      sections
        .filter((s) => !s.isArchived)
        .flatMap((s) => s.items || []),
    [sections]
  );

  // Tasks scheduled for the currently selected date, sorted by scheduled date & time
  const dayTasks = useMemo(() => {
    return sortTasks(
      allCandidateItems.filter((item) => {
        if (item.isArchived) return false;
        // Exclude top-level Goals from appearing as daily task checkboxes
        if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
          return false;
        }

        const taskDate = item.scheduledDate
          ? toDateKey(item.scheduledDate)
          : item.dueDate
          ? toDateKey(item.dueDate)
          : null;

        // CRITICAL: Overdue tasks (scheduled before today) must NEVER appear on Today under any circumstance
        if (isToday && taskDate && taskDate < todayKey()) {
          return false;
        }

        if (item.scheduledDate) {
          return toDateKey(item.scheduledDate) === selectedDate;
        }
        // If unscheduled, only show in Daily section if viewing today
        return isToday && dailySection && item.sectionId === dailySection.id;
      })
    );
  }, [allCandidateItems, isToday, selectedDate, dailySection]);

  // Collect Due / Overdue Tasks (Unfinished tasks scheduled before today), sorted by date & time
  const dueTasks = useMemo(() => {
    return sortTasks(
      allCandidateItems.filter((item) => {
        if (item.isArchived || item.status === "DONE") return false;
        // Exclude top-level Goals
        if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
          return false;
        }
        const dateKey = item.scheduledDate
          ? toDateKey(item.scheduledDate)
          : item.dueDate
          ? toDateKey(item.dueDate)
          : null;
        if (!dateKey) return false;
        return dateKey < todayKey();
      })
    );
  }, [allCandidateItems]);

  // Map of dateKey -> task count & overdue flag for Month Calendar dots
  const taskDateMap = useMemo(() => {
    const map: Record<string, { total: number; hasOverdue: boolean }> = {};
    for (const item of allCandidateItems) {
      if (item.isArchived) continue;
      if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
        continue;
      }
      const k = item.scheduledDate ? toDateKey(item.scheduledDate) : item.dueDate ? toDateKey(item.dueDate) : null;
      if (!k) continue;
      if (!map[k]) map[k] = { total: 0, hasOverdue: false };
      map[k].total += 1;
      if (item.status !== "DONE" && k < todayKey()) {
        map[k].hasOverdue = true;
      }
    }
    return map;
  }, [allCandidateItems]);

  // All Tasks Grouped Date-wise for the "All Tasks" view
  const allTasksGrouped = useMemo(() => {
    const overdueList: Item[] = [];
    const todayList: Item[] = [];
    const tomorrowList: Item[] = [];
    const upcomingByDate: Record<string, Item[]> = {};
    const unscheduledList: Item[] = [];

    const tomorrowKey = addDaysToKey(todayKey(), 1);

    for (const item of allCandidateItems) {
      if (item.isArchived) continue;
      if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
        continue;
      }

      const taskDate = item.scheduledDate
        ? toDateKey(item.scheduledDate)
        : item.dueDate
        ? toDateKey(item.dueDate)
        : null;

      // 1. Overdue: incomplete tasks scheduled before today
      if (item.status !== "DONE" && taskDate && taskDate < todayKey()) {
        overdueList.push(item);
        continue;
      }

      // 2. Unscheduled
      if (!taskDate) {
        unscheduledList.push(item);
        continue;
      }

      // 3. Today
      if (taskDate === todayKey()) {
        todayList.push(item);
        continue;
      }

      // 4. Tomorrow
      if (taskDate === tomorrowKey) {
        tomorrowList.push(item);
        continue;
      }

      // 5. Future dates
      if (!upcomingByDate[taskDate]) {
        upcomingByDate[taskDate] = [];
      }
      upcomingByDate[taskDate].push(item);
    }

    const sortedUpcomingDates = Object.keys(upcomingByDate).sort();

    return {
      overdueList: sortTasks(overdueList),
      todayList: sortTasks(todayList),
      tomorrowList: sortTasks(tomorrowList),
      upcomingDates: sortedUpcomingDates.map((date) => ({
        date,
        tasks: sortTasks(upcomingByDate[date]),
      })),
      unscheduledList: sortTasks(unscheduledList),
      totalCount:
        overdueList.length +
        todayList.length +
        tomorrowList.length +
        Object.values(upcomingByDate).reduce((acc, l) => acc + l.length, 0) +
        unscheduledList.length,
    };
  }, [allCandidateItems]);

  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter((t) => t.status === "DONE").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Month days for calendar
  const calendarDays = useMemo(() => {
    return getMonthDays(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  const calendarMonthName = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [calendarYear, calendarMonth]);

  // Helper to get or initialize reschedule form state for an overdue task
  const getTaskRescheduleState = (task: Item) => {
    if (rescheduleStates[task.id]) return rescheduleStates[task.id];
    let defaultReason = "";
    try {
      if (task.metadata) {
        const parsed = JSON.parse(task.metadata);
        if (parsed.delayReason) defaultReason = parsed.delayReason;
      }
    } catch {
      // ignore
    }
    return {
      date: todayKey(),
      startTime: task.startTime || "",
      endTime: task.endTime || "",
      reason: defaultReason,
    };
  };

  const updateTaskField = (
    task: Item,
    field: "date" | "startTime" | "endTime" | "reason",
    value: string
  ) => {
    const current = getTaskRescheduleState(task);
    setRescheduleStates((prev) => ({
      ...prev,
      [task.id]: {
        ...current,
        [field]: value,
      },
    }));
  };

  // Reschedule single task
  const handleExecuteReschedule = async (task: Item, targetDate?: string) => {
    const state = getTaskRescheduleState(task);
    const dateToAssign = targetDate || state.date || todayKey();
    await onRescheduleItem(task, {
      date: dateToAssign,
      startTime: state.startTime || undefined,
      endTime: state.endTime || undefined,
      reason: state.reason?.trim() || undefined,
    });
  };

  // Handle Quick Add Task
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onQuickAddTask(title, selectedDate);
      setQuickTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* ──────────────── Top Navigation Ribbon ──────────────── */}
      <section className="glass-surface ring-1 ring-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        {/* Row 1: Date Navigation Carousel, Overdue Button & All Tasks Button */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 flex-wrap">
          {/* < Previous Day */}
          <button
            type="button"
            onClick={() => {
              setViewMode("day");
              onChangeDate(addDaysToKey(selectedDate, -1));
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Today Button - Default active when selectedDate is today */}
          <button
            type="button"
            onClick={() => {
              setViewMode("day");
              onChangeDate(todayKey());
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-2xs",
              isToday && viewMode === "day"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15"
            )}
            title="Jump to Today"
          >
            Today
          </button>

          {/* Full Month Calendar Popover Trigger */}
          <div className="relative" ref={calendarRef}>
            <button
              type="button"
              onClick={() => {
                setIsCalendarOpen((prev) => !prev);
                if (!isCalendarOpen) {
                  const d = new Date(selectedDate + "T00:00:00");
                  if (!isNaN(d.getTime())) {
                    setCalendarYear(d.getFullYear());
                    setCalendarMonth(d.getMonth());
                  }
                }
              }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl border font-bold text-xs sm:text-sm cursor-pointer shadow-2xs transition truncate",
                isCalendarOpen
                  ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : viewMode === "day"
                  ? "border-slate-200/80 dark:border-white/15 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white"
                  : "border-slate-200/60 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400"
              )}
              title="Click to open Full Month Calendar"
            >
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{formatDateKey(selectedDate)}</span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0",
                  isCalendarOpen && "rotate-180"
                )}
              />
            </button>

            {/* ──────── FULL MONTH CALENDAR POPOVER ──────── */}
            {isCalendarOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-40 sm:hidden"
                  onClick={() => setIsCalendarOpen(false)}
                />
                <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full mt-2 w-[310px] sm:w-[330px] glass-panel bg-white/98 dark:bg-slate-900/98 ring-1 ring-slate-200 dark:ring-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  {/* Calendar Header with Month/Year & Switchers */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear((y) => y - 1);
                        } else {
                          setCalendarMonth((m) => m - 1);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {calendarMonthName}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear((y) => y + 1);
                        } else {
                          setCalendarMonth((m) => m + 1);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((item) => {
                      const isSel = item.dateKey === selectedDate;
                      const isCurToday = item.dateKey === todayKey();
                      const meta = taskDateMap[item.dateKey];

                      return (
                        <button
                          key={item.dateKey}
                          type="button"
                          onClick={() => {
                            onChangeDate(item.dateKey);
                            setViewMode("day");
                            setIsCalendarOpen(false);
                          }}
                          className={cn(
                            "h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center relative text-xs font-semibold transition cursor-pointer",
                            isSel
                              ? "bg-indigo-600 text-white font-bold shadow-xs"
                              : isCurToday
                              ? "border border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                              : item.isCurrentMonth
                              ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                              : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                        >
                          <span>{item.day}</span>
                          {/* Task Indicator Dot */}
                          {meta && meta.total > 0 && (
                            <span
                              className={cn(
                                "w-1 h-1 rounded-full absolute bottom-1",
                                isSel
                                  ? "bg-white"
                                  : meta.hasOverdue
                                  ? "bg-rose-500"
                                  : "bg-indigo-500"
                              )}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer: Jump to Today & Close */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeDate(todayKey());
                        setViewMode("day");
                        setIsCalendarOpen(false);
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Select Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* > Next Day */}
          <button
            type="button"
            onClick={() => {
              setViewMode("day");
              onChangeDate(addDaysToKey(selectedDate, 1));
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ──────── OVERDUE BUTTON ──────── */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "overdue" ? "day" : "overdue"))}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer shrink-0",
              viewMode === "overdue"
                ? "bg-rose-600 text-white border-rose-600 shadow-rose-500/20"
                : dueTasks.length > 0
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40"
                : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10 hover:bg-slate-200/60"
            )}
            title="View Overdue Tasks"
          >
            <AlertCircle
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                viewMode === "overdue"
                  ? "text-white"
                  : dueTasks.length > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-400"
              )}
            />
            <span>Overdue</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums shrink-0",
                viewMode === "overdue"
                  ? "bg-white text-rose-700"
                  : dueTasks.length > 0
                  ? "bg-rose-600 text-white"
                  : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
              )}
            >
              {dueTasks.length}
            </span>
          </button>

          {/* ──────── ALL TASKS BUTTON ──────── */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "all" ? "day" : "all"))}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer shrink-0",
              viewMode === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-200/60"
            )}
            title="View All Tasks (Date-wise)"
          >
            <ListFilter
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                viewMode === "all" ? "text-white" : "text-indigo-500"
              )}
            />
            <span>All Tasks</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums shrink-0",
                viewMode === "all"
                  ? "bg-white text-indigo-700"
                  : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
              )}
            >
              {allTasksGrouped.totalCount}
            </span>
          </button>
        </div>

        {/* Row 2: Status Indicator & Day Completion Badge */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5 sm:border-0 sm:pt-0">
          {viewMode === "overdue" ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Viewing Overdue Tasks ({dueTasks.length})</span>
            </div>
          ) : viewMode === "all" ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Viewing All Tasks ({allTasksGrouped.totalCount} total)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {dueTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode("overdue")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{dueTasks.length} overdue {dueTasks.length === 1 ? "task" : "tasks"}</span>
                </button>
              )}
            </div>
          )}

          {viewMode !== "day" ? (
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Back to {isToday ? "Today" : formatDateKey(selectedDate)}</span>
            </button>
          ) : totalTasks > 0 ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden xs:inline">
                Completed:
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 tabular-nums">
                {completedTasks}/{totalTasks} ({completionPercentage}%)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              No tasks scheduled
            </span>
          )}
        </div>

        {/* Progress Bar (Visible when tasks exist in day view) */}
        {viewMode === "day" && totalTasks > 0 && (
          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                completionPercentage === 100
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        )}
      </section>

      {/* ──────────────── OVERDUE VIEW ──────────────── */}
      {viewMode === "overdue" && (
        <section className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1 rounded-lg bg-rose-500/10 text-rose-500">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <span>Overdue Tasks</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {dueTasks.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tasks past their scheduled date. Update the reason and reschedule each task to any date and time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {dueTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    dueTasks.forEach((t) => onRescheduleItem(t, "today"));
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                  title="Reschedule all overdue tasks to Today"
                >
                  All to Today
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return</span>
              </button>
            </div>
          </div>

          {dueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 sm:p-14 border-2 border-dashed border-emerald-500/20 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Overdue Tasks!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  All your scheduled tasks are on track. Excellent job staying on schedule!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode("day");
                  onChangeDate(todayKey());
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Go to Today&apos;s Tasks</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dueTasks.map((task) => {
                const taskDate = task.scheduledDate
                  ? toDateKey(task.scheduledDate)
                  : task.dueDate
                  ? toDateKey(task.dueDate)
                  : null;
                const daysOverdue = taskDate ? getDaysOverdue(taskDate) : 1;
                const state = getTaskRescheduleState(task);

                return (
                  <div
                    key={task.id}
                    className="p-3.5 sm:p-4 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs hover:border-rose-500 transition duration-150 space-y-3"
                  >
                    {/* Header Row: Status, Title, Target & Delete */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleItemStatus(task)}
                          className="mt-0.5 text-rose-500 hover:text-emerald-500 transition shrink-0 cursor-pointer"
                          title="Mark as completed"
                        >
                          <Circle className="w-4 h-4" />
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100">
                            {task.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Days Overdue Badge */}
                            {taskDate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                                <AlertCircle className="w-2.5 h-2.5 text-white" />
                                <span>
                                  Due: {formatDateKey(taskDate)} ({daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue)
                                </span>
                              </span>
                            )}

                            {/* Scheduled Time if set */}
                            {(task.startTime || task.endTime) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 text-slate-700 dark:bg-black/30 dark:text-slate-300 border border-rose-200 dark:border-rose-900/50">
                                <Clock className="w-2.5 h-2.5 text-rose-500" />
                                <span>
                                  {task.startTime} {task.startTime && task.endTime ? "–" : ""} {task.endTime}
                                </span>
                              </span>
                            )}

                            {/* Associated Target / Goal Badge */}
                            {task.subGoal && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 truncate max-w-[200px]">
                                <Target className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{task.subGoal.title}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete Task Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteItem(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition shrink-0 cursor-pointer"
                        title="Delete task (move to Trash)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Delay Reason Input Row (Due er karon) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-rose-500" />
                        <span>Reason for Delay (Due Reason):</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Why was this delayed? (e.g. meeting postponed, awaiting client input...)"
                        value={state.reason}
                        onChange={(e) => updateTaskField(task, "reason", e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    {/* Reschedule Date, Time & Action Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/30">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                          Assign To:
                        </span>

                        <button
                          type="button"
                          onClick={() => handleExecuteReschedule(task, todayKey())}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer shadow-2xs"
                          title="Reschedule to Today"
                        >
                          Today
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExecuteReschedule(task, addDaysToKey(todayKey(), 1))}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                          title="Reschedule to Tomorrow"
                        >
                          Tomorrow
                        </button>

                        {/* Custom Date Picker */}
                        <label
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 transition cursor-pointer shadow-2xs"
                          title="Pick custom date"
                        >
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <input
                            type="date"
                            value={state.date || todayKey()}
                            onChange={(e) => updateTaskField(task, "date", e.target.value)}
                            className="bg-transparent text-xs focus:outline-hidden cursor-pointer"
                          />
                        </label>

                        {/* Start Time */}
                        <label
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-2xs"
                          title="Start Time"
                        >
                          <Clock className="w-3 h-3 text-sky-500" />
                          <input
                            type="time"
                            value={state.startTime}
                            onChange={(e) => updateTaskField(task, "startTime", e.target.value)}
                            className="bg-transparent text-xs focus:outline-hidden"
                          />
                        </label>

                        {/* End Time */}
                        <label
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-2xs"
                          title="End Time"
                        >
                          <Clock className="w-3 h-3 text-sky-500" />
                          <input
                            type="time"
                            value={state.endTime}
                            onChange={(e) => updateTaskField(task, "endTime", e.target.value)}
                            className="bg-transparent text-xs focus:outline-hidden"
                          />
                        </label>
                      </div>

                      {/* Reschedule Button */}
                      <button
                        type="button"
                        onClick={() => handleExecuteReschedule(task)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs shrink-0 self-end sm:self-auto"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ──────────────── ALL TASKS VIEW (Date-wise with Overdue in Red) ──────────────── */}
      {viewMode === "all" && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <ListFilter className="w-4 h-4" />
                </span>
                <span>All Tasks</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  {allTasksGrouped.totalCount}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All tasks organized date-wise. Overdue tasks are highlighted in red.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode("day")}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Daily Schedule</span>
            </button>
          </div>

          {allTasksGrouped.totalCount === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-slate-900/30 space-y-2">
              <ListTodo className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No tasks created yet</p>
              <p className="text-xs text-slate-500">Switch to Day view to add tasks or create Targets under Goals.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. OVERDUE TASKS GROUP - IN RED COLOR (lal ronge) */}
              {allTasksGrouped.overdueList.length > 0 && (
                <div className="space-y-2.5 p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900/60 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Overdue Tasks ({allTasksGrouped.overdueList.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setViewMode("overdue")}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Reschedule All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {allTasksGrouped.overdueList.map((task) => {
                      const taskDate = task.scheduledDate
                        ? toDateKey(task.scheduledDate)
                        : task.dueDate
                        ? toDateKey(task.dueDate)
                        : null;
                      const daysOverdue = taskDate ? getDaysOverdue(taskDate) : 1;

                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleItemStatus(task)}
                              className="text-rose-500 hover:text-emerald-500 transition shrink-0 cursor-pointer"
                              title="Mark as completed"
                            >
                              <Circle className="w-4 h-4" />
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 truncate">
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white">
                                  Overdue: {taskDate ? formatDateKey(taskDate) : ""} ({daysOverdue} {daysOverdue === 1 ? "day" : "days"})
                                </span>
                                {task.subGoal && (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                    <Target className="w-2.5 h-2.5" />
                                    <span>{task.subGoal.title}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => onRescheduleItem(task, "today")}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                              title="Reschedule to Today"
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => onRescheduleItem(task, "tomorrow")}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                              title="Reschedule to Tomorrow"
                            >
                              Tomorrow
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(task)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. TODAY'S TASKS GROUP */}
              {allTasksGrouped.todayList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 px-1">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Today • {formatDateKey(todayKey())} ({allTasksGrouped.todayList.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {allTasksGrouped.todayList.map((task) => (
                      <ItemCard
                        key={task.id}
                        item={task}
                        density={density}
                        onToggleStatus={onToggleItemStatus}
                        onEdit={onEditItem}
                        onArchive={onArchiveItem}
                        onDelete={onDeleteItem}
                        onReschedule={onRescheduleItem}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. TOMORROW'S TASKS GROUP */}
              {allTasksGrouped.tomorrowList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide flex items-center gap-1.5 px-1">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    <span>Tomorrow • {formatDateKey(addDaysToKey(todayKey(), 1))} ({allTasksGrouped.tomorrowList.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {allTasksGrouped.tomorrowList.map((task) => (
                      <ItemCard
                        key={task.id}
                        item={task}
                        density={density}
                        onToggleStatus={onToggleItemStatus}
                        onEdit={onEditItem}
                        onArchive={onArchiveItem}
                        onDelete={onDeleteItem}
                        onReschedule={onRescheduleItem}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. UPCOMING DATES CHRONOLOGICALLY */}
              {allTasksGrouped.upcomingDates.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5 px-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDateKey(group.date)} ({group.tasks.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <ItemCard
                        key={task.id}
                        item={task}
                        density={density}
                        onToggleStatus={onToggleItemStatus}
                        onEdit={onEditItem}
                        onArchive={onArchiveItem}
                        onDelete={onDeleteItem}
                        onReschedule={onRescheduleItem}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* 5. UNSCHEDULED TASKS GROUP */}
              {allTasksGrouped.unscheduledList.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 px-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Unscheduled Tasks ({allTasksGrouped.unscheduledList.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {allTasksGrouped.unscheduledList.map((task) => (
                      <ItemCard
                        key={task.id}
                        item={task}
                        density={density}
                        onToggleStatus={onToggleItemStatus}
                        onEdit={onEditItem}
                        onArchive={onArchiveItem}
                        onDelete={onDeleteItem}
                        onReschedule={onRescheduleItem}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ──────────────── NORMAL DAY VIEW (viewMode === "day") ──────────────── */}
      {viewMode === "day" && (
        <>
          {/* Quick Add Task Input for Selected Date */}
          <form onSubmit={handleQuickAdd} className="glass-panel ring-1 ring-white/10 rounded-2xl p-2 sm:p-3 shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 text-indigo-500 shrink-0">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={
                  isToday
                    ? "Add task for today (Enter)..."
                    : `Add task for ${formatDateKey(selectedDate)}...`
                }
                className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!quickTitle.trim() || isSubmitting}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 shrink-0 cursor-pointer"
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          {/* Tasks List for Selected Date */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <ListTodo className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Tasks for {isToday ? "Today" : formatDateKey(selectedDate)}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                  {totalTasks}
                </span>
              </h2>

              {onNavigateToGoals && (
                <button
                  type="button"
                  onClick={onNavigateToGoals}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Goals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {dayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 sm:p-14 border-2 border-dashed border-slate-200/80 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-slate-900/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {isToday ? "No tasks planned for today" : "No tasks scheduled for this day"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Add a task above or pick another date from the calendar to view its schedule.
                  </p>
                </div>
                {onNavigateToGoals && (
                  <button
                    type="button"
                    onClick={onNavigateToGoals}
                    className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Browse Goal Tasks</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayTasks.map((task) => (
                  <ItemCard
                    key={task.id}
                    item={task}
                    density={density}
                    onToggleStatus={onToggleItemStatus}
                    onEdit={onEditItem}
                    onArchive={onArchiveItem}
                    onDelete={onDeleteItem}
                    onReschedule={onRescheduleItem}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
