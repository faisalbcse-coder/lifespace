"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Target as TargetIcon,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Percent,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { SubGoal, Item } from "@/types";
import { cn } from "@/lib/utils";
import { formatDateKey, toDateKey, todayKey } from "@/lib/dates";
import { calculateSubGoalProgress, calculateGoalProgress, formatGoalRange, calculateDaysLeft } from "@/lib/goals";
import { sortTargets, sortTasks } from "@/lib/ordering";

interface GoalHierarchyViewProps {
  goalId: string;
  initialTitle: string;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  initialSubGoals?: SubGoal[];
  onDeleteGoal: () => Promise<void>;
}

export function GoalHierarchyView({
  goalId,
  initialTitle,
  initialStartDate,
  initialEndDate,
  initialSubGoals = [],
  onDeleteGoal,
}: GoalHierarchyViewProps) {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [subGoals, setSubGoals] = useState<SubGoal[]>(initialSubGoals);

  // Goal Timeline state (Start & End Date)
  const [goalStartDate, setGoalStartDate] = useState(initialStartDate ? toDateKey(initialStartDate) : "");
  const [goalEndDate, setGoalEndDate] = useState(initialEndDate ? toDateKey(initialEndDate) : "");

  // New Target inline creator state
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState("");
  const [newTargetStartDate, setNewTargetStartDate] = useState("");
  const [newTargetEndDate, setNewTargetEndDate] = useState("");

  // Editing Target state (Target Name, Start Date, End Date)
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetTitle, setEditingTargetTitle] = useState("");
  const [editingTargetStartDate, setEditingTargetStartDate] = useState("");
  const [editingTargetEndDate, setEditingTargetEndDate] = useState("");

  // New Task per Target state: map of subGoalId -> { title, date, startTime, endTime }
  const [taskInputs, setTaskInputs] = useState<
    Record<string, { title: string; date: string; startTime?: string; endTime?: string }>
  >({});

  // Expanded targets: all targets start closed/collapsed by default
  const [expandedTargetIds, setExpandedTargetIds] = useState<Set<string>>(() => new Set());

  // Active target IDs where "+ Task" input box is currently shown
  const [activeTaskTargetIds, setActiveTaskTargetIds] = useState<Set<string>>(() => new Set());

  // Editing Task state (Title, Scheduled Date, Start Time, End Time)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskState, setEditingTaskState] = useState<{
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }>({ title: "", date: "", startTime: "", endTime: "" });

  // Delete confirmations
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "goal" | "target" | "task";
    id: string;
    title: string;
  } | null>(null);

  // Fetch / refresh targets and tasks
  const refreshSubGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals/${goalId}/subgoals`);
      const data = await res.json();
      if (data.success && data.data?.subGoals) {
        setSubGoals(data.data.subGoals);
      }
    } catch {
      // ignore in background
    }
  }, [goalId]);

  useEffect(() => {
    refreshSubGoals();
  }, [refreshSubGoals]);

  // Overall Goal progress calculation
  const overallMetrics = calculateGoalProgress(subGoals);

  // Goal Title update
  const handleSaveGoalTitle = async () => {
    const next = title.trim();
    if (!next) {
      setTitle(initialTitle);
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    try {
      const res = await fetch(`/api/items/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) throw new Error();
      success("Goal title updated");
    } catch {
      error("Failed to update goal title");
    }
  };

  // Goal Dates update
  const handleSaveGoalDates = async (newStart: string, newEnd: string) => {
    setGoalStartDate(newStart);
    setGoalEndDate(newEnd);
    try {
      const res = await fetch(`/api/items/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: newStart ? new Date(newStart).toISOString() : null,
          endDate: newEnd ? new Date(newEnd).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error();
      success("Goal dates updated");
    } catch {
      error("Failed to update goal dates");
    }
  };

  // Add Target
  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const subTitle = newTargetTitle.trim();
    if (!subTitle) return;

    try {
      const res = await fetch(`/api/goals/${goalId}/subgoals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subTitle,
          startDate: newTargetStartDate ? new Date(newTargetStartDate).toISOString() : null,
          endDate: newTargetEndDate ? new Date(newTargetEndDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setSubGoals((prev) => [...prev, data.data.subGoal]);
      setNewTargetTitle("");
      setNewTargetStartDate("");
      setNewTargetEndDate("");
      setIsAddingTarget(false);
      success(`Target "${subTitle}" created`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to create Target");
    }
  };

  // Toggle Target Collapse / Expand (all start closed by default)
  const handleToggleTargetCollapse = (targetId: string) => {
    setExpandedTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  };

  // Toggle Task Add Box for a specific Target
  const handleToggleAddTask = (targetId: string) => {
    // If target was collapsed, expand it so user sees the task input
    setExpandedTargetIds((prev) => new Set(prev).add(targetId));

    setActiveTaskTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });

    setTimeout(() => {
      const el = document.getElementById(`task-input-${targetId}`);
      el?.focus();
    }, 50);
  };

  // Start Editing Target
  const handleStartEditTarget = (target: SubGoal) => {
    setEditingTargetId(target.id);
    setEditingTargetTitle(target.title);
    setEditingTargetStartDate(target.startDate ? toDateKey(target.startDate) : "");
    setEditingTargetEndDate(target.endDate ? toDateKey(target.endDate) : "");
  };

  // Save Target Edit (Title, Start Date, End Date)
  const handleSaveTargetEdit = async (targetId: string) => {
    const next = editingTargetTitle.trim();
    if (!next) {
      setEditingTargetId(null);
      return;
    }

    const nextStartIso = editingTargetStartDate ? new Date(editingTargetStartDate).toISOString() : null;
    const nextEndIso = editingTargetEndDate ? new Date(editingTargetEndDate).toISOString() : null;

    setSubGoals((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              title: next,
              startDate: nextStartIso,
              endDate: nextEndIso,
            }
          : s
      )
    );
    setEditingTargetId(null);

    try {
      const res = await fetch(`/api/subgoals/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: next,
          startDate: nextStartIso,
          endDate: nextEndIso,
        }),
      });
      if (!res.ok) throw new Error();
      success("Target updated");
    } catch {
      error("Failed to update Target");
      refreshSubGoals();
    }
  };

  // Delete Target execute
  const handleDeleteTargetExecute = async (targetId: string) => {
    try {
      const res = await fetch(`/api/subgoals/${targetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSubGoals((prev) => prev.filter((s) => s.id !== targetId));
      success("Target and its tasks removed");
    } catch {
      error("Failed to delete Target");
    }
  };

  // Add Task to Target
  const handleCreateTask = async (subGoalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const input = taskInputs[subGoalId] || { title: "", date: todayKey() };
    const taskTitle = input.title.trim();
    if (!taskTitle) return;

    try {
      const res = await fetch(`/api/subgoals/${subGoalId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          scheduledDate: input.date || todayKey(),
          startTime: input.startTime || null,
          endTime: input.endTime || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      const newTask = data.data.task;
      setSubGoals((prev) =>
        prev.map((sg) =>
          sg.id === subGoalId
            ? { ...sg, tasks: [...(sg.tasks || []), newTask] }
            : sg
        )
      );

      // Reset input for this target
      setTaskInputs((prev) => ({
        ...prev,
        [subGoalId]: { title: "", date: todayKey(), startTime: "", endTime: "" },
      }));

      // Close the task input box so only existing tasks remain
      setActiveTaskTargetIds((prev) => {
        const next = new Set(prev);
        next.delete(subGoalId);
        return next;
      });

      success("Task added and scheduled in Daily Section!");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to add task");
    }
  };

  // Adjust Task Progress (%)
  const handleUpdateTaskProgress = async (taskId: string, newProgress: number) => {
    const clamped = Math.max(0, Math.min(100, newProgress));
    setSubGoals((prev) =>
      prev.map((sg) => ({
        ...sg,
        tasks: sg.tasks?.map((t) =>
          t.id === taskId
            ? {
                ...t,
                progress: clamped,
                status: clamped === 100 ? "DONE" : t.status === "DONE" ? "TODO" : t.status,
              }
            : t
        ),
      }))
    );

    try {
      await fetch(`/api/items/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: clamped }),
      });
    } catch {
      refreshSubGoals();
    }
  };

  // Toggle Task Status (Complete / Reopen) - Synchronized with Daily Section!
  const handleToggleTaskStatus = async (task: Item) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";

    // Optimistic update
    setSubGoals((prev) =>
      prev.map((sg) => ({
        ...sg,
        tasks: sg.tasks?.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                completedAt: nextStatus === "DONE" ? new Date().toISOString() : null,
              }
            : t
        ),
      }))
    );

    try {
      const res = await fetch(`/api/items/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      if (nextStatus === "DONE") {
        info("Task completed! 🎉");
      }
    } catch {
      error("Failed to update task status");
      refreshSubGoals();
    }
  };

  // Start Task Edit
  const handleStartEditTask = (task: Item) => {
    setEditingTaskId(task.id);
    setEditingTaskState({
      title: task.title,
      date: task.scheduledDate ? toDateKey(task.scheduledDate) : "",
      startTime: task.startTime || "",
      endTime: task.endTime || "",
    });
  };

  // Save Task Edit (Title, Date, Start Time, End Time)
  const handleSaveTaskEdit = async (taskId: string) => {
    const nextTitle = editingTaskState.title.trim();
    if (!nextTitle) {
      error("Task title cannot be empty");
      return;
    }

    const payload = {
      title: nextTitle,
      scheduledDate: editingTaskState.date || null,
      startTime: editingTaskState.startTime || null,
      endTime: editingTaskState.endTime || null,
    };

    setEditingTaskId(null);

    // Optimistic update
    setSubGoals((prev) =>
      prev.map((sg) => ({
        ...sg,
        tasks: sg.tasks?.map((t) =>
          t.id === taskId
            ? {
                ...t,
                title: nextTitle,
                scheduledDate: payload.scheduledDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
              }
            : t
        ),
      }))
    );

    try {
      const res = await fetch(`/api/items/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      success("Task updated successfully");
    } catch {
      error("Failed to update task");
      refreshSubGoals();
    }
  };

  // Change Task Assigned Date (moves in Daily section)
  const handleChangeTaskDate = async (taskId: string, newDate: string) => {
    if (!newDate) return;

    setSubGoals((prev) =>
      prev.map((sg) => ({
        ...sg,
        tasks: sg.tasks?.map((t) =>
          t.id === taskId ? { ...t, scheduledDate: newDate } : t
        ),
      }))
    );

    try {
      const res = await fetch(`/api/items/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: newDate }),
      });
      if (!res.ok) throw new Error();
      success(`Task scheduled for ${formatDateKey(newDate)} in Daily Section`);
    } catch {
      error("Failed to reschedule task");
      refreshSubGoals();
    }
  };

  // Delete Task Execute (moves to Trash for 30 days)
  const handleDeleteTaskExecute = async (taskId: string) => {
    try {
      const res = await fetch(`/api/items/${taskId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (!res.ok) {
        await fetch(`/api/items/${taskId}`, { method: "DELETE" });
      }
      setSubGoals((prev) =>
        prev.map((sg) => ({
          ...sg,
          tasks: sg.tasks?.filter((t) => t.id !== taskId),
        }))
      );
      success("Task moved to Trash (kept for 30 days)");
    } catch {
      error("Failed to delete task");
    }
  };

  // Confirm execution router
  const handleConfirmExecute = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    setDeleteTarget(null);

    if (type === "goal") {
      await onDeleteGoal();
    } else if (type === "target") {
      await handleDeleteTargetExecute(id);
    } else if (type === "task") {
      await handleDeleteTaskExecute(id);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 pb-20 overflow-x-hidden">
      {/* ──────────────── Top Floating Navigation Header ──────────────── */}
      <header className="sticky top-0 z-30 glass-nav">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
              <TargetIcon className="w-3.5 h-3.5" />
              <span>Goal</span>
            </span>

            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: "goal",
                  id: goalId,
                  title,
                })
              }
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              title="Delete this Goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8 min-w-0">
        {/* ──────────────── Goal Hero Header & Automatic Progress Card ──────────────── */}
        <section className="glass-surface ring-1 ring-white/10 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  Major Objective
                </span>
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-2 max-w-xl">
                  <input
                    type="text"
                    value={title}
                    autoFocus
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSaveGoalTitle();
                      if (e.key === "Escape") {
                        setTitle(initialTitle);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="w-full text-2xl sm:text-3xl font-extrabold tracking-tight bg-white/80 dark:bg-slate-900 border border-indigo-500 rounded-xl px-3 py-1 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGoalTitle}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(initialTitle);
                      setIsEditingTitle(false);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                    {title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"
                    title="Rename Goal"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Goal Timeline / Date Pickers */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Timeline:</span>

                  {/* Start Date */}
                  <label
                    className="relative inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                    title="Click to set Start Date"
                  >
                    <span>{goalStartDate ? formatDateKey(goalStartDate) : "Start Date"}</span>
                    <input
                      type="date"
                      value={goalStartDate}
                      onChange={(e) => handleSaveGoalDates(e.target.value, goalEndDate)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>

                  <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>

                  {/* End Date */}
                  <label
                    className="relative inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                    title="Click to set End Date"
                  >
                    <span>{goalEndDate ? formatDateKey(goalEndDate) : "End Date"}</span>
                    <input
                      type="date"
                      value={goalEndDate}
                      onChange={(e) => handleSaveGoalDates(goalStartDate, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>

                {goalEndDate && (() => {
                  const dl = calculateDaysLeft(goalEndDate, goalStartDate);
                  if (!dl) return null;
                  return (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold tabular-nums border shadow-2xs",
                        dl.isOverdue
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50"
                          : dl.isWarning
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                          : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50"
                      )}
                      title={`Goal timeline: ${goalStartDate ? `${goalStartDate} – ` : ""}${goalEndDate} (${dl.label})`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{dl.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingTarget(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 active:scale-98 transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Target</span>
            </button>
          </div>

          {/* Automatic Progress Bar */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
            {overallMetrics.totalTasks > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Goal Progress</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({overallMetrics.completedTasks} of {overallMetrics.totalTasks} tasks completed)
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                    {overallMetrics.percentage}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      overallMetrics.percentage === 100
                        ? "bg-emerald-500 shadow-[0_0_12px_#10b981]"
                        : "bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    )}
                    style={{ width: `${overallMetrics.percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 py-1">
                <TargetIcon className="w-4 h-4 text-slate-400" />
                <span>
                  No tasks created yet. Add tasks within Targets below to automatically track progress.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ──────────────── New Target Inline Creator ──────────────── */}
        {isAddingTarget && (
          <form
            onSubmit={handleCreateTarget}
            className="glass-panel ring-1 ring-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Target</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTarget(false);
                  setNewTargetTitle("");
                  setNewTargetStartDate("");
                  setNewTargetEndDate("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                autoFocus
                placeholder="Target title (e.g. Complete First Term, Build Feature X)..."
                value={newTargetTitle}
                onChange={(e) => setNewTargetTitle(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center gap-2">
                {/* Start Date */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Start</span>
                  <input
                    type="date"
                    value={newTargetStartDate}
                    onChange={(e) => setNewTargetStartDate(e.target.value)}
                    className="bg-transparent text-xs focus:outline-hidden"
                  />
                </label>

                {/* End Date */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">End</span>
                  <input
                    type="date"
                    value={newTargetEndDate}
                    onChange={(e) => setNewTargetEndDate(e.target.value)}
                    className="bg-transparent text-xs focus:outline-hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!newTargetTitle.trim()}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition cursor-pointer"
                >
                  Create Target
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTarget(false);
                    setNewTargetTitle("");
                    setNewTargetStartDate("");
                    setNewTargetEndDate("");
                  }}
                  className="px-3 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ──────────────── Targets Hierarchy List ──────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Targets</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                {subGoals.length}
              </span>
            </h2>
          </div>

          {subGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 sm:p-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/30 dark:bg-slate-900/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TargetIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Targets Yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                  Targets break down this Goal into actionable milestones with Start and End dates. Create your first Target to begin scheduling daily tasks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTarget(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Target</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortTargets(subGoals).map((sg) => {
                const tasks = sortTasks(sg.tasks || []);
                const metrics = calculateSubGoalProgress(tasks);
                const isExpanded = expandedTargetIds.has(sg.id);
                const isCollapsed = !isExpanded;
                const isAddingTask = activeTaskTargetIds.has(sg.id);

                const inputState = taskInputs[sg.id] || {
                  title: "",
                  date: todayKey(),
                };

                const isEditing = editingTargetId === sg.id;
                const targetRange = formatGoalRange(
                  sg.startDate ? toDateKey(sg.startDate) : null,
                  sg.endDate ? toDateKey(sg.endDate) : null
                );

                return (
                  <div
                    key={sg.id}
                    className="glass-panel ring-1 ring-white/10 rounded-2xl overflow-hidden shadow-xs transition duration-200"
                  >
                    {/* Target Header */}
                    <div className="p-3.5 sm:p-5 bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/50 dark:border-white/5 space-y-2">
                      {isEditing ? (
                        /* Target Editing Mode: Title + Start Date + End Date */
                        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/50">
                          <input
                            type="text"
                            value={editingTargetTitle}
                            autoFocus
                            placeholder="Target Title"
                            onChange={(e) => setEditingTargetTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleSaveTargetEdit(sg.id);
                              if (e.key === "Escape") setEditingTargetId(null);
                            }}
                            className="flex-1 min-w-[160px] px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-hidden"
                          />

                          <div className="flex items-center gap-1.5 text-xs">
                            <label className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Start</span>
                              <input
                                type="date"
                                value={editingTargetStartDate}
                                onChange={(e) => setEditingTargetStartDate(e.target.value)}
                                className="bg-transparent text-xs focus:outline-hidden"
                              />
                            </label>

                            <label className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <span className="text-[10px] uppercase font-bold text-slate-400">End</span>
                              <input
                                type="date"
                                value={editingTargetEndDate}
                                onChange={(e) => setEditingTargetEndDate(e.target.value)}
                                className="bg-transparent text-xs focus:outline-hidden"
                              />
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveTargetEdit(sg.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                            title="Save Target"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTargetId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Row 1: Chevron + Target Title (left) & Actions (right) */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleTargetCollapse(sg.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/50 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
                                title={isCollapsed ? "Expand Target" : "Collapse Target"}
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              <h3
                                onClick={() => handleToggleTargetCollapse(sg.id)}
                                className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition"
                              >
                                {sg.title}
                              </h3>
                            </div>

                            {/* Header Actions: Edit, + Task, Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditTarget(sg)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                title="Edit Target (Name, Start & End Dates)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleAddTask(sg.id)}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer",
                                  isAddingTask
                                    ? "bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-200 border border-slate-300 dark:border-white/10"
                                    : "text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-500/30"
                                )}
                                title={isAddingTask ? "Close Task Input" : "Add Task to this Target"}
                              >
                                {isAddingTask ? (
                                  <>
                                    <X className="w-3.5 h-3.5" />
                                    <span>Cancel</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Task</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "target",
                                    id: sg.id,
                                    title: sg.title,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                title="Delete Target and its tasks"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Badges (Timeline & Progress) - Never overlaps with buttons */}
                          {(targetRange || metrics.totalTasks >= 0) && (
                            <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-7">
                              {targetRange && (
                                <span
                                  className="px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 inline-flex items-center gap-1.5 shrink-0"
                                  title="Target Timeline (Start – End)"
                                >
                                  <Calendar className="w-3 h-3 text-sky-500" />
                                  <span>{targetRange}</span>
                                  {sg.endDate && (() => {
                                    const targetEndKey = toDateKey(sg.endDate);
                                    const targetStartKey = sg.startDate ? toDateKey(sg.startDate) : undefined;
                                    const dl = calculateDaysLeft(targetEndKey, targetStartKey);
                                    if (!dl) return null;
                                    return (
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums shrink-0 border ml-0.5",
                                          dl.isOverdue
                                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50"
                                            : dl.isWarning
                                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                                            : "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/50"
                                        )}
                                        title={`Target timeline: ${targetStartKey ? `${targetStartKey} – ` : ""}${targetEndKey} (${dl.label})`}
                                      >
                                        <Clock className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                        <span>{dl.label}</span>
                                      </span>
                                    );
                                  })()}
                                </span>
                              )}

                              {metrics.totalTasks > 0 ? (
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0",
                                    metrics.percentage === 100
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                  )}
                                >
                                  {metrics.completedTasks}/{metrics.totalTasks} ({metrics.percentage}%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-white/10 shrink-0">
                                  No tasks
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Target Body (Tasks List + Add Task Row) */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Tasks list */}
                        {tasks.length > 0 ? (
                          <div className="space-y-2">
                            {tasks.map((task) => {
                              const isDone = task.status === "DONE";
                              const taskDate = task.scheduledDate
                                ? toDateKey(task.scheduledDate)
                                : null;
                              const isToday = taskDate === todayKey();
                              const isEditingTask = editingTaskId === task.id;

                              if (isEditingTask) {
                                return (
                                  <div
                                    key={task.id}
                                    className="p-3 rounded-xl border border-indigo-500/60 bg-white/95 dark:bg-slate-900/95 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in"
                                  >
                                    {/* Task title input */}
                                    <input
                                      type="text"
                                      value={editingTaskState.title}
                                      autoFocus
                                      placeholder="Task title"
                                      onChange={(e) =>
                                        setEditingTaskState((prev) => ({ ...prev, title: e.target.value }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") void handleSaveTaskEdit(task.id);
                                        if (e.key === "Escape") setEditingTaskId(null);
                                      }}
                                      className="flex-1 min-w-[140px] px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                    />

                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                      {/* Assigned Date */}
                                      <label
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer"
                                        title="Task Date (Daily Section)"
                                      >
                                        <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                        <input
                                          type="date"
                                          value={editingTaskState.date}
                                          onChange={(e) =>
                                            setEditingTaskState((prev) => ({ ...prev, date: e.target.value }))
                                          }
                                          className="bg-transparent text-xs focus:outline-hidden cursor-pointer"
                                        />
                                      </label>

                                      {/* Start Time */}
                                      <label
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                                        title="Start Time"
                                      >
                                        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                                        <input
                                          type="time"
                                          value={editingTaskState.startTime}
                                          onChange={(e) =>
                                            setEditingTaskState((prev) => ({
                                              ...prev,
                                              startTime: e.target.value,
                                            }))
                                          }
                                          className="bg-transparent text-xs focus:outline-hidden"
                                        />
                                      </label>

                                      {/* End Time */}
                                      <label
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                                        title="End Time"
                                      >
                                        <span className="text-slate-400 text-xs">–</span>
                                        <input
                                          type="time"
                                          value={editingTaskState.endTime}
                                          onChange={(e) =>
                                            setEditingTaskState((prev) => ({
                                              ...prev,
                                              endTime: e.target.value,
                                            }))
                                          }
                                          className="bg-transparent text-xs focus:outline-hidden"
                                        />
                                      </label>

                                      {/* Save Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTaskEdit(task.id)}
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
                                        title="Save Task"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Cancel Button */}
                                      <button
                                        type="button"
                                        onClick={() => setEditingTaskId(null)}
                                        className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "group/task flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition duration-150",
                                    isDone
                                      ? "bg-slate-50/50 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/5 opacity-70"
                                      : "bg-white/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 hover:border-indigo-400/50 shadow-2xs"
                                  )}
                                >
                                  {/* Checkbox + Title */}
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTaskStatus(task)}
                                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0 rounded-full cursor-pointer"
                                      title={isDone ? "Reopen task" : "Mark as done"}
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" />
                                      ) : (
                                        <Circle className="w-4 h-4" />
                                      )}
                                    </button>

                                    <span
                                      onClick={() => handleStartEditTask(task)}
                                      className={cn(
                                        "text-xs sm:text-sm font-medium truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition",
                                        isDone && "line-through text-slate-400 dark:text-slate-500"
                                      )}
                                      title="Click to edit task"
                                    >
                                      {task.title}
                                    </span>
                                  </div>

                                  {/* Right meta badges & actions */}
                                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                    {/* Start & End Time Badge */}
                                    {(task.startTime || task.endTime) && (
                                      <span
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-indigo-50/80 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                                        title={`Time: ${task.startTime || ""} ${task.startTime && task.endTime ? "–" : ""} ${task.endTime || ""}`}
                                      >
                                        <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                        <span>
                                          {task.startTime}
                                          {task.startTime && task.endTime ? " – " : ""}
                                          {task.endTime}
                                        </span>
                                      </span>
                                    )}

                                    {/* Progress (%) pill button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = task.progress ?? (isDone ? 100 : 0);
                                        const next = cur >= 100 ? 0 : cur + 25;
                                        handleUpdateTaskProgress(task.id, next);
                                      }}
                                      className={cn(
                                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer",
                                        (task.progress ?? (isDone ? 100 : 0)) === 100
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                                          : (task.progress ?? 0) > 0
                                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300"
                                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 hover:text-indigo-600"
                                      )}
                                      title="Click to cycle progress percentage (+25%)"
                                    >
                                      <Percent className="w-2.5 h-2.5" />
                                      <span>{task.progress ?? (isDone ? 100 : 0)}%</span>
                                    </button>

                                    {/* Assigned Date Pill (with inline date picker) */}
                                    <label
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition relative",
                                        isToday
                                          ? "bg-rose-50/80 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-900"
                                          : "bg-slate-100/70 text-slate-700 dark:bg-white/[0.04] dark:text-slate-300 border-slate-200/80 dark:border-white/10"
                                      )}
                                      title="Task Date (Click to change date in Daily Section)"
                                    >
                                      <Calendar className="w-3 h-3 shrink-0" />
                                      <span>
                                        {taskDate ? (isToday ? "Today" : formatDateKey(taskDate)) : "No date"}
                                      </span>
                                      <input
                                        type="date"
                                        defaultValue={taskDate || todayKey()}
                                        onChange={(e) => handleChangeTaskDate(task.id, e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </label>

                                    {/* Daily sync badge */}
                                    <span
                                      className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      title="Synced to Daily Section"
                                    >
                                      Daily
                                    </span>

                                    {/* Edit task button - ALWAYS VISIBLE */}
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditTask(task)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition cursor-pointer shrink-0"
                                      title="Edit task (title, date, time)"
                                      aria-label="Edit task"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete task button - ALWAYS VISIBLE */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteTarget({
                                          type: "task",
                                          id: task.id,
                                          title: task.title,
                                        })
                                      }
                                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer shrink-0"
                                      title="Delete task (move to Trash)"
                                      aria-label="Delete task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                            No tasks in this Target yet. Click &quot;+ Task&quot; above to add one.
                          </div>
                        )}

                        {/* Inline Add Task Row with Date & Times - only shown on + Task click */}
                        {isAddingTask && (
                          <form
                            onSubmit={(e) => handleCreateTask(sg.id, e)}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-slate-200/50 dark:border-white/5 animate-in fade-in"
                          >
                            <input
                              id={`task-input-${sg.id}`}
                              type="text"
                              autoFocus
                              placeholder="Add a task under this Target..."
                              value={inputState.title}
                              onChange={(e) =>
                                setTaskInputs((prev) => ({
                                  ...prev,
                                  [sg.id]: { ...inputState, title: e.target.value },
                                }))
                              }
                              className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                            />

                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Date */}
                              <label
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
                                title="Assign Task Date"
                              >
                                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                <input
                                  type="date"
                                  value={inputState.date || todayKey()}
                                  onChange={(e) =>
                                    setTaskInputs((prev) => ({
                                      ...prev,
                                      [sg.id]: { ...inputState, date: e.target.value },
                                    }))
                                  }
                                  className="bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-200"
                                />
                              </label>

                              {/* Start Time */}
                              <label
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                title="Start Time"
                              >
                                <Clock className="w-3 h-3 text-sky-500" />
                                <input
                                  type="time"
                                  value={inputState.startTime || ""}
                                  onChange={(e) =>
                                    setTaskInputs((prev) => ({
                                      ...prev,
                                      [sg.id]: { ...inputState, startTime: e.target.value },
                                    }))
                                  }
                                  className="bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-200"
                                />
                              </label>

                              {/* End Time */}
                              <label
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                title="End Time"
                              >
                                <Clock className="w-3 h-3 text-sky-500" />
                                <input
                                  type="time"
                                  value={inputState.endTime || ""}
                                  onChange={(e) =>
                                    setTaskInputs((prev) => ({
                                      ...prev,
                                      [sg.id]: { ...inputState, endTime: e.target.value },
                                    }))
                                  }
                                  className="bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-200"
                                />
                              </label>

                              <button
                                type="submit"
                                disabled={!inputState.title.trim()}
                                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                              >
                                Add Task
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTaskTargetIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(sg.id);
                                    return next;
                                  });
                                }}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition cursor-pointer shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete ${deleteTarget.type === "goal" ? "Goal" : deleteTarget.type === "target" ? "Target" : "Task"}?`}
          message={
            deleteTarget.type === "goal"
              ? `Are you sure you want to permanently delete the Goal "${deleteTarget.title}" and all its Targets and Tasks?`
              : deleteTarget.type === "target"
              ? `Are you sure you want to permanently delete Target "${deleteTarget.title}" and all tasks inside it?`
              : `Are you sure you want to delete task "${deleteTarget.title}"? It will be moved to Trash (retained for 30 days) and removed from this Goal and Daily Section.`
          }
          confirmLabel={deleteTarget.type === "task" ? "Move to Trash" : "Delete permanently"}
          isDestructive={true}
          onConfirm={handleConfirmExecute}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
