"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Target,
  Plus,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  Layers,
  ChevronRight,
  Calendar,
  Clock,
  GripVertical,
} from "lucide-react";
import { Item, Section } from "@/types";
import { getSectionKind, getCleanColor, calculateGoalProgress, getItemGoalDates, formatGoalRange, calculateDaysLeft } from "@/lib/goals";
import { cn, SECTION_ACCENTS } from "@/lib/utils";
import { sortSections, sortGoals } from "@/lib/ordering";
import { useToast } from "@/components/ui/Toast";

interface GoalsHubViewProps {
  sections: Section[];
  onSectionsChange?: (sections: Section[]) => void;
  onOpenCreateGoal: (section?: Section) => void;
  onOpenCreateSection: () => void;
  onOpenRenameSection: (section: Section) => void;
  onArchiveSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onEditGoal: (item: Item) => void;
  onArchiveGoal: (item: Item) => void;
  onDeleteGoal: (item: Item) => void;
  onNavigateToDaily?: () => void;
}

interface SortableGoalSectionCardProps {
  section: Section;
  index: number;
  onOpenCreateGoal: (section: Section) => void;
  onOpenRenameSection: (section: Section) => void;
  onArchiveSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onEditGoal: (item: Item) => void;
  onArchiveGoal: (item: Item) => void;
  onDeleteGoal: (item: Item) => void;
}

function SortableGoalSectionCard({
  section,
  index,
  onOpenCreateGoal,
  onOpenRenameSection,
  onArchiveSection,
  onDeleteSection,
  onEditGoal,
  onArchiveGoal,
  onDeleteGoal,
}: SortableGoalSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const cleanColor = getCleanColor(section.color);
  const accent = SECTION_ACCENTS[cleanColor] || SECTION_ACCENTS.indigo;
  const goals = sortGoals(
    (section.items || []).filter(
      (item) => !item.isArchived && !item.subGoalId
    )
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "glass-panel ring-1 ring-white/10 rounded-2xl overflow-hidden shadow-xs flex flex-col w-full h-[255px] sm:h-[260px] transition duration-150",
        isDragging && "opacity-50 ring-2 ring-[#00eaff] z-30 shadow-2xl scale-[1.01]"
      )}
    >
      {/* Section Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-slate-200/50 dark:border-white/10 gap-1.5 sm:gap-2",
          accent.headerBg
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition shrink-0 focus:outline-hidden"
            aria-label={`Drag section ${section.name}`}
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Sequential Order Number (1, 2, 3, 4, ...) */}
          <span
            className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0 font-mono select-none"
            title={`Section order #${index + 1}`}
          >
            {index + 1}.
          </span>

          <span className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0", accent.barBg || "bg-indigo-500")} />

          <h2
            onClick={() => onOpenRenameSection(section)}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline min-w-0 flex-1"
            title={section.name}
          >
            {section.name}
          </h2>

          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 shrink-0"
            title={`${goals.length} active goal${goals.length === 1 ? "" : "s"}`}
          >
            {goals.length} {goals.length === 1 ? "goal" : "goals"}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpenCreateGoal(section)}
            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
            title={`Add Goal to ${section.name}`}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Add Goal</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRenameSection(section)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition cursor-pointer"
            title={`Rename section "${section.name}"`}
            aria-label="Rename section"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onArchiveSection(section)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
            title={`Archive section "${section.name}"`}
            aria-label="Archive section"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteSection(section)}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            title={`Delete section "${section.name}"`}
            aria-label="Delete section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section Goals List */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
        {goals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-slate-200/80 dark:border-white/10 rounded-xl bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 p-3">
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              No goals in this section
            </p>
            <button
              type="button"
              onClick={() => onOpenCreateGoal(section)}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal to this Section</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
              {goals.map((goal) => {
                const goalMetrics = calculateGoalProgress(goal.subGoals);
                const targetCount = goal.subGoals?.length || 0;
                const goalDates = getItemGoalDates(goal);
                const dateRange = formatGoalRange(goalDates.startDate, goalDates.endDate);
                const daysLeft = goalDates.endDate ? calculateDaysLeft(goalDates.endDate, goalDates.startDate) : null;

                return (
                  <div
                    key={goal.id}
                    className="group rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] hover:border-emerald-500/40 transition duration-150 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs flex flex-col justify-center gap-1"
                  >
                    {/* Line 1: Goal Title & Action Buttons */}
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <Link
                        href={`/items/${goal.id}`}
                        className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition truncate flex-1 min-w-0"
                        title={goal.title}
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{goal.title}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </Link>

                      <div className="flex items-center gap-0.5 shrink-0 opacity-75 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => onEditGoal(goal)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition cursor-pointer"
                          title="Edit Goal"
                          aria-label="Edit Goal"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGoal(goal)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Goal"
                          aria-label="Delete Goal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Line 2: Compact Meta (Date • Targets • Progress Badge / Add Targets Link) */}
                    <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 truncate text-slate-500 dark:text-slate-400">
                        {dateRange && (
                          <div className="inline-flex items-center gap-1.5 font-medium shrink-0">
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span className="truncate">{dateRange}</span>
                            </span>
                            {daysLeft && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 border whitespace-nowrap",
                                  daysLeft.isOverdue
                                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50"
                                    : daysLeft.isWarning
                                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                                      : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50"
                                )}
                                title={`Due ${goalDates.endDate} (${daysLeft.label})`}
                              >
                                <Clock className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                <span>{daysLeft.label}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {dateRange && (
                          <span className="text-slate-300 dark:text-white/20 select-none shrink-0">•</span>
                        )}

                        <span className="font-medium shrink-0">
                          {targetCount} {targetCount === 1 ? "Target" : "Targets"}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center">
                        {goalMetrics.totalTasks > 0 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] tabular-nums border border-emerald-200/60 dark:border-emerald-800/40">
                            <span>{goalMetrics.completedTasks}/{goalMetrics.totalTasks}</span>
                            <span className="text-emerald-600/75 dark:text-emerald-400/75 font-semibold">({goalMetrics.percentage}%)</span>
                          </span>
                        ) : (
                          <Link
                            href={`/items/${goal.id}`}
                            className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>Open & add targets</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenCreateGoal(section)}
              className="w-full py-1 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 rounded-lg border border-dashed border-slate-200/80 dark:border-white/10 hover:border-emerald-500/30 transition flex items-center justify-center gap-1 cursor-pointer mt-1.5 shrink-0"
            >
              <Plus className="w-3 h-3 text-emerald-500" />
              <span>Add Goal to {section.name}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function GoalsHubView({
  sections,
  onSectionsChange,
  onOpenCreateGoal,
  onOpenCreateSection,
  onOpenRenameSection,
  onArchiveSection,
  onDeleteSection,
  onEditGoal,
  onArchiveGoal,
  onDeleteGoal,
  onNavigateToDaily,
}: GoalsHubViewProps) {
  const { success, error } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Goal-related sections, sorted by Section ordering (exclude Daily planner section)
  const goalSections = sortSections(
    sections.filter((s) => {
      if (s.isArchived || s.isHidden) return false;
      const n = s.name.trim().toLowerCase();
      return n !== "daily" && n !== "daily task" && !n.startsWith("daily");
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = goalSections.findIndex((s) => s.id === active.id);
    const newIndex = goalSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedGoalSections = arrayMove(goalSections, oldIndex, newIndex);
    const otherSections = sections.filter((s) => !goalSections.some((gs) => gs.id === s.id));
    const completeNewSections = [...reorderedGoalSections, ...otherSections].map((s, idx) => ({
      ...s,
      orderIndex: idx,
    }));

    onSectionsChange?.(completeNewSections);

    try {
      const response = await fetch("/api/sections/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionIds: completeNewSections.map((s) => s.id),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to persist order");
      }
      success("Section order saved");
    } catch {
      error("Could not save section order");
      onSectionsChange?.(sections);
    }
  };

  // Calculate overall metrics across all goals
  const allGoals = goalSections.flatMap((s) =>
    (s.items || []).filter(
      (item) => !item.isArchived && !item.subGoalId
    )
  );

  const totalGoals = allGoals.length;
  const overallMetrics = calculateGoalProgress(
    allGoals.flatMap((g) => g.subGoals || [])
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ──────────────── Goals Hub Hero / Header ──────────────── */}
      <section className="glass-surface ring-1 ring-white/10 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Target className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Goal Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Break down major objectives into Sub-Goals and actionable daily tasks.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            {onNavigateToDaily && (
              <button
                type="button"
                onClick={onNavigateToDaily}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Today&apos;s Tasks
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenCreateGoal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-md shadow-emerald-500/20 transition shrink-0 cursor-pointer"
              title="Create a new Goal"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateSection}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-md shadow-indigo-500/20 transition shrink-0 cursor-pointer"
              title="Create a new Goal Section"
            >
              <Plus className="w-4 h-4" />
              <span>New Section</span>
            </button>
          </div>
        </div>

        {/* Aggregate Progress Overview Bar */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10">
          {overallMetrics.totalTasks > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Overall Milestone Progress</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({overallMetrics.completedTasks} of {overallMetrics.totalTasks} tasks completed across {totalGoals} goals)
                  </span>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                  {overallMetrics.percentage}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallMetrics.percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-0.5">
              <span>{totalGoals} active goal{totalGoals === 1 ? "" : "s"} defined</span>
              <span className="italic">Add tasks inside Sub-Goals to track progress</span>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────── Goal Sections Grid ──────────────── */}
      {goalSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/30 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Goal Sections
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Create a category section (like &quot;Skill&quot;, &quot;Project Parking&quot;, or &quot;Career&quot;) to organize your goals.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateSection}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Section</span>
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={goalSections.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
              {goalSections.map((section, idx) => (
                <SortableGoalSectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  onOpenCreateGoal={onOpenCreateGoal}
                  onOpenRenameSection={onOpenRenameSection}
                  onArchiveSection={onArchiveSection}
                  onDeleteSection={onDeleteSection}
                  onEditGoal={onEditGoal}
                  onArchiveGoal={onArchiveGoal}
                  onDeleteGoal={onDeleteGoal}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}