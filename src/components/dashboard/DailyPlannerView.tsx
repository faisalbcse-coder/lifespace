"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Sun,
  ListTodo,
  Target,
  ArrowRight,
  AlertCircle,
  Trash2,
  X,
  RotateCw,
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
  onRescheduleItem: (item: Item, target: ReschedulePreset | { date: string }) => void;
  onQuickAddTask: (title: string, dateKey: string) => Promise<void>;
  onNavigateToGoals?: () => void;
  density?: "compact" | "comfortable";
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
  const [isDueDropdownOpen, setIsDueDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isToday = selectedDate === todayKey();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDueDropdownOpen(false);
      }
    }
    if (isDueDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDueDropdownOpen]);

  // Find daily section if available
  const dailySection = sections.find((s) => {
    const n = s.name.trim().toLowerCase();
    return n === "daily" || n === "daily task" || n.startsWith("daily");
  });

  // Collect all items from across all active sections
  const allCandidateItems = sections
    .filter((s) => !s.isArchived)
    .flatMap((s) => s.items || []);

  // Tasks scheduled for the currently selected date, sorted by scheduled date & time
  const dayTasks = sortTasks(
    allCandidateItems.filter((item) => {
      if (item.isArchived) return false;
      // Exclude top-level Goals from appearing as daily task checkboxes
      if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
        return false;
      }
      if (item.scheduledDate) {
        return toDateKey(item.scheduledDate) === selectedDate;
      }
      // If unscheduled, only show in Daily section if viewing today
      return isToday && dailySection && item.sectionId === dailySection.id;
    })
  );

  // Collect Due / Overdue Tasks (Unfinished tasks scheduled before today), sorted by date & time
  const dueTasks = sortTasks(
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

  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter((t) => t.status === "DONE").length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      {/* ──────────────── Top Date Navigator Ribbon ──────────────── */}
      <section className="glass-surface ring-1 ring-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Responsive layout: Date navigation in row 1, status pills & due button in row 2 on mobile */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Date Navigation Carousel */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onChangeDate(addDaysToKey(selectedDate, -1))}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => onChangeDate(todayKey())}
              disabled={isToday}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0",
                isToday
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15"
              )}
            >
              Today
            </button>

            {/* Native Date Picker trigger with styled badge */}
            <label
              className="relative flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/15 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-sm cursor-pointer shadow-2xs transition truncate"
              title="Click to select another date"
            >
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{formatDateKey(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                aria-label="Select Date"
                onChange={(e) => e.target.value && onChangeDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={() => onChangeDate(addDaysToKey(selectedDate, 1))}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Row 2: Due Tasks Dropdown Trigger & Day Progress Pill */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/5 sm:border-0 sm:pt-0">
            {/* ──────── DUE TASKS DROPDOWN TRIGGER ──────── */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDueDropdownOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer",
                  dueTasks.length > 0
                    ? isDueDropdownOpen
                      ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/20"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10 hover:bg-slate-200/60"
                )}
                title="View overdue / due tasks that need attention"
              >
                <AlertCircle
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    dueTasks.length > 0
                      ? isDueDropdownOpen
                        ? "text-white"
                        : "text-amber-500"
                      : "text-slate-400"
                  )}
                />
                <span className="truncate">Due Tasks</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums shrink-0",
                    dueTasks.length > 0
                      ? isDueDropdownOpen
                        ? "bg-white text-amber-600"
                        : "bg-amber-500 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {dueTasks.length}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform duration-200 shrink-0",
                    isDueDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Due Tasks Dropdown Popover with backdrop on mobile */}
              {isDueDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-40 sm:hidden"
                    onClick={() => setIsDueDropdownOpen(false)}
                  />
                  <div className="fixed inset-x-3 top-24 sm:absolute sm:inset-x-auto sm:left-0 sm:top-full mt-2 sm:w-[420px] max-w-[calc(100vw-24px)] glass-panel bg-white/95 dark:bg-slate-900/95 ring-1 ring-slate-200 dark:ring-white/10 rounded-2xl shadow-2xl z-50 p-3 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Due / Overdue Tasks
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {dueTasks.length} {dueTasks.length === 1 ? "task" : "tasks"} past scheduled date
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dueTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            dueTasks.forEach((t) => onRescheduleItem(t, "today"));
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
                          title="Reschedule all due tasks to Today"
                        >
                          All to Today
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsDueDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Task List in Dropdown */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-0.5">
                    {dueTasks.length === 0 ? (
                      <div className="py-6 text-center space-y-1">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          No overdue tasks!
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          All your tasks are completed or scheduled on track.
                        </p>
                      </div>
                    ) : (
                      dueTasks.map((task) => {
                        const taskDate = task.scheduledDate
                          ? toDateKey(task.scheduledDate)
                          : task.dueDate
                          ? toDateKey(task.dueDate)
                          : null;

                        return (
                          <div
                            key={task.id}
                            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/60 hover:border-amber-400/50 transition duration-150 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onToggleItemStatus(task)}
                                  className="mt-0.5 text-slate-400 hover:text-emerald-500 transition shrink-0"
                                  title="Mark as completed"
                                >
                                  <Circle className="w-4 h-4" />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {task.title}
                                  </p>
                                  {taskDate && (
                                    <span className="text-[10px] font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-2.5 h-2.5" />
                                      <span>Due: {formatDateKey(taskDate)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Delete due task */}
                              <button
                                type="button"
                                onClick={() => onDeleteItem(task)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition shrink-0"
                                title="Delete this due task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Reschedule options */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/5 text-[11px]">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Reschedule:
                              </span>
                              <button
                                type="button"
                                onClick={() => onRescheduleItem(task, "today")}
                                className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => onRescheduleItem(task, "tomorrow")}
                                className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                              >
                                Tomorrow
                              </button>
                              <label
                                className="relative px-2 py-0.5 rounded-md font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Pick specific date"
                              >
                                <span>Pick Date</span>
                                <input
                                  type="date"
                                  defaultValue={todayKey()}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onRescheduleItem(task, { date: e.target.value });
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Day Progress Pill */}
          {totalTasks > 0 ? (
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
      </div>

        {/* Progress Bar (Visible when tasks exist) */}
        {totalTasks > 0 && (
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

      {/* Due Tasks Notification Bar (If overdue tasks exist and dropdown is closed) */}
      {dueTasks.length > 0 && !isDueDropdownOpen && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              You have <strong>{dueTasks.length}</strong> due task{dueTasks.length > 1 ? "s" : ""} past scheduled date.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDueDropdownOpen(true)}
            className="font-bold underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer self-end sm:self-auto text-xs"
          >
            Review & Reschedule
          </button>
        </div>
      )}

      {/* ──────────────── Quick Add Task Input for Selected Date ──────────────── */}
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

      {/* ──────────────── Tasks List ──────────────── */}
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
                Add a task above or schedule tasks from your Targets to keep your day organized.
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
    </div>
  );
}
