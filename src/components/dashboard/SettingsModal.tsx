"use client";

import React, { useState } from "react";
import {
  X,
  Trash2,
  RotateCcw,
  Clock,
  Layers,
  Target,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { Section, Item } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedSections: Section[];
  archivedItems: Item[];
  onRestoreSection: (section: Section) => void | Promise<void>;
  onDeleteSection: (section: Section) => void | Promise<void>;
  onRestoreItem: (item: Item) => void | Promise<void>;
  onDeleteItem: (item: Item) => void | Promise<void>;
  onEmptyTrash?: () => void | Promise<void>;
  theme?: "light" | "dark" | "system";
  density?: "compact" | "comfortable";
  onToggleTheme?: () => void;
  onToggleDensity?: () => void;
  sections?: Section[];
}

export function SettingsModal({
  isOpen,
  onClose,
  archivedSections,
  archivedItems,
  onRestoreSection,
  onDeleteSection,
  onRestoreItem,
  onDeleteItem,
  onEmptyTrash,
  sections = [],
}: SettingsModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "sections" | "goals" | "tasks">("all");
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<{
    type: "section" | "item";
    target: Section | Item;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  // Separate goals vs normal tasks
  const trashedGoals = archivedItems.filter(
    (item) => item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0) || !item.subGoalId
  );
  const trashedTasks = archivedItems.filter(
    (item) => !trashedGoals.some((g) => g.id === item.id)
  );

  const totalTrashedCount = archivedSections.length + archivedItems.length;

  // Calculate days left in 30-day retention
  const calculateDaysLeft = (dateStr?: string | Date | null) => {
    if (!dateStr) return 30;
    const deletedTime = new Date(dateStr).getTime();
    if (isNaN(deletedTime)) return 30;
    const daysPassed = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysPassed);
  };

  const renderDaysBadge = (daysLeft: number) => {
    if (daysLeft > 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          <span>{daysLeft} days left</span>
        </span>
      );
    }
    if (daysLeft > 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50 shrink-0">
          <Clock className="w-2.5 h-2.5 text-amber-500" />
          <span>{daysLeft} days left</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50 shrink-0 animate-pulse">
        <Clock className="w-2.5 h-2.5 text-rose-500" />
        <span>{daysLeft === 1 ? "1 day left" : "Expires today"}</span>
      </span>
    );
  };

  // Section name lookup
  const getSectionName = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId) || archivedSections.find((s) => s.id === sectionId);
    return sec?.name;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trash-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in"
    >
      <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-xl w-full p-4 sm:p-5 space-y-3.5 max-h-[88vh] flex flex-col bg-white/95 dark:bg-slate-900/95 shadow-2xl border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="trash-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Trash</span>
                {totalTrashedCount > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                    {totalTrashedCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Deleted items stay here for 30 days before being permanently removed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {totalTrashedCount > 0 && onEmptyTrash && (
              <button
                type="button"
                onClick={() => setConfirmEmptyOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 transition cursor-pointer"
                title="Permanently remove all items in Trash"
              >
                <Trash2 className="w-3 h-3" />
                <span>Empty Trash</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              aria-label="Close trash"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-b border-slate-200/60 dark:border-white/10 pb-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterTab === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            All ({totalTrashedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("sections")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterTab === "sections"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            Sections ({archivedSections.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("goals")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterTab === "goals"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            Goals ({trashedGoals.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("tasks")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterTab === "tasks"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            Tasks ({trashedTasks.length})
          </button>
        </div>

        {/* Trashed Items List */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-[220px]">
          {/* Trashed Sections */}
          {(filterTab === "all" || filterTab === "sections") &&
            archivedSections.map((sec) => {
              const daysLeft = calculateDaysLeft(sec.updatedAt || sec.createdAt);
              return (
                <div
                  key={`sec-${sec.id}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:border-indigo-500/30 transition gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {sec.name}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                          Section
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderDaysBadge(daysLeft)}

                    <button
                      type="button"
                      onClick={() => onRestoreSection(sec)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                      title="Restore Section to workspace"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmPermanentDelete({
                          type: "section",
                          target: sec,
                          title: sec.name,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Permanently delete section now"
                      aria-label="Delete section permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Trashed Goals */}
          {(filterTab === "all" || filterTab === "goals") &&
            trashedGoals.map((goal) => {
              const daysLeft = calculateDaysLeft(goal.updatedAt || goal.createdAt);
              const secName = getSectionName(goal.sectionId);
              return (
                <div
                  key={`goal-${goal.id}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:border-emerald-500/30 transition gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 shrink-0">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {goal.title}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                          Goal
                        </span>
                        {secName && (
                          <span className="text-[10px] text-slate-400 truncate">
                            in {secName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderDaysBadge(daysLeft)}

                    <button
                      type="button"
                      onClick={() => onRestoreItem(goal)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                      title="Restore Goal to workspace"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmPermanentDelete({
                          type: "item",
                          target: goal,
                          title: goal.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Permanently delete goal now"
                      aria-label="Delete goal permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Trashed Tasks */}
          {(filterTab === "all" || filterTab === "tasks") &&
            trashedTasks.map((task) => {
              const daysLeft = calculateDaysLeft(task.updatedAt || task.createdAt);
              const secName = getSectionName(task.sectionId);
              return (
                <div
                  key={`task-${task.id}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:border-sky-500/30 transition gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500 shrink-0">
                      <CheckSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60 shrink-0">
                          Task
                        </span>
                        {secName && (
                          <span className="text-[10px] text-slate-400 truncate">
                            in {secName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderDaysBadge(daysLeft)}

                    <button
                      type="button"
                      onClick={() => onRestoreItem(task)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer"
                      title="Restore Task to workspace"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmPermanentDelete({
                          type: "item",
                          target: task,
                          title: task.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Permanently delete task now"
                      aria-label="Delete task permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {((filterTab === "all" && totalTrashedCount === 0) ||
            (filterTab === "sections" && archivedSections.length === 0) ||
            (filterTab === "goals" && trashedGoals.length === 0) ||
            (filterTab === "tasks" && trashedTasks.length === 0)) && (
            <div className="py-12 px-4 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-400 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {filterTab === "all" ? "Trash is empty" : `No ${filterTab} in Trash`}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Deleted items stay in Trash for 30 days before being automatically removed forever.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 shrink-0">
          <p className="text-[11px] text-slate-400">
            {totalTrashedCount > 0 ? `${totalTrashedCount} item${totalTrashedCount === 1 ? "" : "s"} in Trash` : "Trash is empty"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Dialog: Permanent Delete Single Item */}
      {confirmPermanentDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-sm w-full p-4 space-y-3 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Delete Permanently?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete &quot;{confirmPermanentDelete.title}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmPermanentDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmPermanentDelete;
                  setConfirmPermanentDelete(null);
                  if (target.type === "section") {
                    await onDeleteSection(target.target as Section);
                  } else {
                    await onDeleteItem(target.target as Item);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Empty All Trash */}
      {confirmEmptyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-sm w-full p-4 space-y-3 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Empty Entire Trash?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              All {totalTrashedCount} item{totalTrashedCount === 1 ? "" : "s"} in Trash will be permanently deleted immediately. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmEmptyOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmEmptyOpen(false);
                  await onEmptyTrash?.();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
