"use client";

import React, { useState, useEffect } from "react";
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
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Layers, RotateCcw } from "lucide-react";
import { Section, Item, SectionCardSize } from "@/types";
import { SectionCard } from "./SectionCard";
import { useToast } from "@/components/ui/Toast";
import type { ReschedulePreset } from "./ItemCard";
import { toDateKey, todayKey } from "@/lib/dates";
import { loadSavedCardSize, saveCardSize, clearSavedCardSize } from "@/lib/cardSizing";
import { sortSections, sortSectionItems, sortTasks } from "@/lib/ordering";
import { getSectionKind } from "@/lib/goals";

export const isDailySection = (section: Section) => {
  const n = section.name.trim().toLowerCase();
  return n === "daily" || n === "daily task" || n.startsWith("daily");
};

interface SectionGridProps {
  sections: Section[];
  density?: "compact" | "comfortable";
  seeMoreExpanded: boolean;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  onSectionsChange: (newSections: Section[]) => void;
  onToggleSeeMore: (expanded: boolean) => void;
  onToggleCollapse: (section: Section) => void;
  onOpenAddItem: (section: Section) => void;
  onOpenRename: (section: Section) => void;
  onArchiveSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onToggleItemStatus: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onArchiveItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  selectedDate: string;
  onChangeDate: (dateKey: string) => void;
  onRescheduleItem: (item: Item, target: ReschedulePreset | { date: string }) => void;
}

const INITIAL_SECTION_LIMIT = 10;

export function SectionGrid({
  sections,
  density = "compact",
  seeMoreExpanded,
  searchQuery,
  statusFilter,
  priorityFilter,
  onSectionsChange,
  onToggleSeeMore,
  onToggleCollapse,
  onOpenAddItem,
  onOpenRename,
  onArchiveSection,
  onDeleteSection,
  onToggleItemStatus,
  onEditItem,
  onArchiveItem,
  onDeleteItem,
  selectedDate,
  onChangeDate,
  onRescheduleItem,
}: SectionGridProps) {
  const { error, success } = useToast();
  const [isReordering, setIsReordering] = useState(false);
  const [globalCardSize, setGlobalCardSize] = useState<SectionCardSize>({});
  const [liveResizeSize, setLiveResizeSize] = useState<SectionCardSize | null>(null);

  useEffect(() => {
    setGlobalCardSize(loadSavedCardSize());
  }, []);

  const handleGlobalCardResize = (newSize: SectionCardSize) => {
    setGlobalCardSize(newSize);
    setLiveResizeSize(null);
    saveCardSize(newSize);
  };

  const handleGlobalCardLiveResize = (liveSize: SectionCardSize | null) => {
    setLiveResizeSize(liveSize);
  };

  const handleResetCardSize = () => {
    setGlobalCardSize({});
    setLiveResizeSize(null);
    clearSavedCardSize();
    success("All card sizes reset to default");
  };

  const effectiveCardSize = liveResizeSize || globalCardSize;

  // Configure pointer and accessible keyboard sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px drag to initiate, preventing accidental drag on click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter visible, non-archived sections
  const visibleSections = sortSections(sections.filter((s) => !s.isArchived && !s.isHidden));
  const totalVisible = visibleSections.length;
  const hasMoreThanLimit = totalVisible > INITIAL_SECTION_LIMIT;

  // Initial 10-section limit logic
  const displayedSections =
    hasMoreThanLimit && !seeMoreExpanded
      ? visibleSections.slice(0, INITIAL_SECTION_LIMIT)
      : visibleSections;

  // Persist reordered sections to backend
  const persistReorder = async (newSections: Section[], previousSections: Section[]) => {
    setIsReordering(true);
    try {
      const response = await fetch("/api/sections/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionIds: newSections.map((s) => s.id),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to persist section order");
      }
      success("Section order saved");
    } catch (err) {
      error("Could not save new section order. Restoring previous order.");
      // Roll back optimistic update
      onSectionsChange(previousSections);
    } finally {
      setIsReordering(false);
    }
  };

  // Handle Drag & Drop reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleSections.findIndex((s) => s.id === active.id);
    const newIndex = visibleSections.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedVisible = arrayMove(visibleSections, oldIndex, newIndex);

    // Merge reordered visible sections with any archived sections
    const archivedSections = sections.filter((s) => s.isArchived || s.isHidden);
    const completeNewSections = [...reorderedVisible, ...archivedSections].map((s, idx) => ({
      ...s,
      orderIndex: idx,
    }));

    // Optimistic update
    onSectionsChange(completeNewSections);

    // Persist
    await persistReorder(completeNewSections, sections);
  };

  // Handle Move Left / Right accessible buttons
  const handleMoveSection = async (section: Section, direction: "left" | "right") => {
    const currentIndex = visibleSections.findIndex((s) => s.id === section.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= visibleSections.length) return;

    const reorderedVisible = arrayMove(visibleSections, currentIndex, targetIndex);
    const archivedSections = sections.filter((s) => s.isArchived || s.isHidden);
    const completeNewSections = [...reorderedVisible, ...archivedSections].map((s, idx) => ({
      ...s,
      orderIndex: idx,
    }));

    // Optimistic update
    onSectionsChange(completeNewSections);

    // Persist
    await persistReorder(completeNewSections, sections);
  };

  // Helper to filter items in each section by search & filters
  const getFilteredItems = (items: Item[] = [], isDaily = false) => {
    return items.filter((item) => {
      if (item.isArchived) return false;

      // Sub-goal tasks only appear in the Daily Section on their scheduled date, or within their Sub-Goal in the Goal detail page.
      if (!isDaily && item.subGoalId) return false;

      // Status filter
      if (statusFilter === "ACTIVE" && item.status === "DONE") return false;
      if (statusFilter === "DONE" && item.status !== "DONE") return false;

      // Priority filter
      if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  };

  const sectionNames: Record<string, string> = Object.fromEntries(
    sections.map((s) => [s.id, s.name])
  );

  /**
   * The Daily section is a date-based planner: it shows every task (from any
   * section, including sub-goal tasks) scheduled for the selected date. Daily's own
   * unscheduled tasks are treated as belonging to today. Goals themselves do not appear here.
   */
  const getDailyItems = (daily: Section): Item[] => {
    const isToday = selectedDate === todayKey();
    const all = sections
      .filter((s) => !s.isArchived)
      .flatMap((s) => s.items || [])
      .filter((item) => {
        // Goals themselves do not appear in Daily task section
        if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
          return false;
        }
        if (item.scheduledDate) return toDateKey(item.scheduledDate) === selectedDate;
        return item.sectionId === daily.id && isToday;
      });
    return getFilteredItems(all, true);
  };

  return (
    <div className="space-y-4">
      {visibleSections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-center">
          <Layers className="w-10 h-10 text-slate-400 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No visible sections
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            All sections may be archived, or your workspace has not been initialized.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedSections.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            {/* Flexible layout: defaults to 2 columns on desktop, allows freeform resizing in both width and height */}
            <div className="flex flex-wrap gap-4 sm:gap-6 items-start w-full">
              {displayedSections.map((section, idx) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={idx}
                  totalSections={displayedSections.length}
                  density={density}
                  size={effectiveCardSize}
                  onResize={handleGlobalCardResize}
                  onLiveResize={handleGlobalCardLiveResize}
                  onResetSize={handleResetCardSize}
                  filteredItems={
                    isDailySection(section)
                      ? sortTasks(getDailyItems(section))
                      : sortSectionItems(
                          getFilteredItems(section.items),
                          getSectionKind(section) === "GOAL"
                        )
                  }
                  isDaily={isDailySection(section)}
                  selectedDate={selectedDate}
                  onChangeDate={onChangeDate}
                  sectionNames={sectionNames}
                  onRescheduleItem={onRescheduleItem}
                  onToggleCollapse={onToggleCollapse}
                  onOpenAddItem={onOpenAddItem}
                  onOpenRename={onOpenRename}
                  onArchiveSection={onArchiveSection}
                  onDeleteSection={onDeleteSection}
                  onMoveSection={handleMoveSection}
                  onToggleItemStatus={onToggleItemStatus}
                  onEditItem={onEditItem}
                  onArchiveItem={onArchiveItem}
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Footer controls: Reset sizes & 10-Section Limit 'See More' / 'Show Less' */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-6">
        {(globalCardSize.width || globalCardSize.height || globalCardSize.isFullWidth) && (
          <button
            type="button"
            onClick={handleResetCardSize}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition"
            title="Reset card size to default for all cards"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Card Sizes</span>
          </button>
        )}

        {hasMoreThanLimit && (
          <button
            type="button"
            onClick={() => onToggleSeeMore(!seeMoreExpanded)}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition"
          >
            {seeMoreExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-500" />
                <span>Show Less (Collapse to 10 sections)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span>
                  See More (+{totalVisible - INITIAL_SECTION_LIMIT} remaining sections)
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
