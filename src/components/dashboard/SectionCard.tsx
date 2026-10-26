"use client";

import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreVertical,
  Archive,
  Trash2,
  Edit2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CalendarDays,
  Target,
  ListTodo,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import { Section, Item, SectionCardSize } from "@/types";
import { ItemCard, ReschedulePreset } from "./ItemCard";
import { cn, SECTION_ACCENTS } from "@/lib/utils";
import { formatDateKey, todayKey, addDaysToKey } from "@/lib/dates";
import { getCleanColor, getSectionKind } from "@/lib/goals";
import { MIN_CARD_HEIGHT, MAX_CARD_HEIGHT, MIN_CARD_WIDTH } from "@/lib/cardSizing";

interface SectionCardProps {
  section: Section;
  index: number;
  totalSections: number;
  density?: "compact" | "comfortable";
  filteredItems: Item[];
  size?: SectionCardSize;
  onResize?: (size: SectionCardSize) => void;
  onLiveResize?: (size: SectionCardSize | null) => void;
  onResetSize?: () => void;
  onToggleCollapse: (section: Section) => void;
  onOpenAddItem: (section: Section) => void;
  onOpenRename: (section: Section) => void;
  onArchiveSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onMoveSection: (section: Section, direction: "left" | "right") => void;
  onToggleItemStatus: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onArchiveItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  /** Daily planner: when true the section renders a date navigation bar */
  isDaily?: boolean;
  selectedDate?: string;
  onChangeDate?: (dateKey: string) => void;
  /** Maps sectionId -> name for tasks displayed outside their home section */
  sectionNames?: Record<string, string>;
  onRescheduleItem?: (item: Item, target: ReschedulePreset | { date: string }) => void;
}

export function SectionCard({
  section,
  index,
  totalSections,
  density = "compact",
  filteredItems,
  onToggleCollapse,
  onOpenAddItem,
  onOpenRename,
  onArchiveSection,
  onDeleteSection,
  onMoveSection,
  onToggleItemStatus,
  onEditItem,
  onArchiveItem,
  onDeleteItem,
  isDaily = false,
  selectedDate,
  onChangeDate,
  sectionNames,
  onRescheduleItem,
  size,
  onResize,
  onLiveResize,
  onResetSize,
}: SectionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<"horizontal" | "vertical" | "both" | null>(null);
  const [liveDimensions, setLiveDimensions] = useState<{ width: number; height: number } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const setCardRef = (node: HTMLDivElement | null) => {
    cardRef.current = node;
    setNodeRef(node);
  };

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    direction: "horizontal" | "vertical" | "both"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const startClientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startClientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const containerWidth =
      card.parentElement?.getBoundingClientRect().width || window.innerWidth;

    setIsResizing(direction);
    setLiveDimensions({ width: Math.round(startWidth), height: Math.round(startHeight) });

    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    if (direction === "horizontal") document.body.style.cursor = "ew-resize";
    else if (direction === "vertical") document.body.style.cursor = "ns-resize";
    else document.body.style.cursor = "nwse-resize";

    let currentW = startWidth;
    let currentH = startHeight;

    const handlePointerMove = (moveEvt: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvt ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const clientY = "touches" in moveEvt ? moveEvt.touches[0].clientY : moveEvt.clientY;

      if (direction === "horizontal" || direction === "both") {
        const deltaX = clientX - startClientX;
        currentW = Math.max(MIN_CARD_WIDTH, Math.min(containerWidth, startWidth + deltaX));
      }

      if (direction === "vertical" || direction === "both") {
        const deltaY = clientY - startClientY;
        currentH = Math.max(MIN_CARD_HEIGHT, Math.min(MAX_CARD_HEIGHT, startHeight + deltaY));
      }

      setLiveDimensions({ width: Math.round(currentW), height: Math.round(currentH) });
      if (onLiveResize) {
        onLiveResize({
          width: direction === "vertical" ? size?.width : Math.round(currentW),
          height: direction === "horizontal" ? size?.height : Math.round(currentH),
          isFullWidth: currentW >= containerWidth - 24,
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);

      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      setIsResizing(null);
      setLiveDimensions(null);
      if (onLiveResize) onLiveResize(null);

      if (onResize) {
        onResize({
          width: direction === "vertical" ? size?.width : Math.round(currentW),
          height: direction === "horizontal" ? size?.height : Math.round(currentH),
          isFullWidth: currentW >= containerWidth - 24,
        });
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);
  };

  const cleanColor = getCleanColor(section.color);
  const accent = SECTION_ACCENTS[cleanColor] || SECTION_ACCENTS.indigo;
  const sectionKind = getSectionKind(section);
  const itemCount = section.items?.length || 0;
  const doneCount = section.items?.filter((i) => i.status === "DONE").length || 0;

  const currentWidth =
    isResizing && liveDimensions
      ? liveDimensions.width
      : size?.isFullWidth
      ? "100%"
      : size?.width;

  const currentHeight =
    !section.collapsed && isResizing && liveDimensions
      ? liveDimensions.height
      : !section.collapsed && size?.height
      ? size.height
      : undefined;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isResizing ? "none" : transition,
    width: currentWidth ? (typeof currentWidth === "number" ? `min(${currentWidth}px, 100%)` : currentWidth) : undefined,
    height: currentHeight ? `${currentHeight}px` : undefined,
    minHeight: currentHeight ? `${currentHeight}px` : undefined,
    maxWidth: "100%",
    minWidth: 0,
    flexGrow: size?.isFullWidth ? 1 : currentWidth ? 0 : 1,
    flexShrink: 1,
  };

  return (
    <div
      ref={setCardRef}
      style={style}
      className={cn(
        "relative group/card flex flex-col rounded-2xl bg-white/70 dark:bg-white/[0.06] border border-white/60 dark:border-white/12 shadow-[0_15px_45px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-[25px] transition-shadow duration-200 min-w-0 overflow-hidden",
        !size?.width && !size?.isFullWidth && "w-full md:w-[calc(50%-12px)]",
        !section.collapsed && !currentHeight && "min-h-[380px] xl:min-h-[415px]",
        isDragging && "opacity-50 ring-2 ring-[#00eaff] z-30 shadow-2xl",
        isResizing && "ring-2 ring-[#00eaff]/80 shadow-2xl select-none"
      )}
    >
      {/* Subtle glowing section color accent line at top */}
      <div className={cn("h-[2.5px] w-full shadow-xs", accent.barBg || "bg-gradient-to-r from-[#00c6ff] to-[#8a2be2]")} />

      {/* Compact Section Header */}
      <div
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 border-b border-white/40 dark:border-white/10 gap-1.5 bg-white/40 dark:bg-white/[0.03] backdrop-blur-md",
          accent.headerBg
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Dedicated Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition shrink-0 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            aria-label={`Drag section ${section.name}`}
            title="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Sequential Order Number (1, 2, 3, ...) */}
          <span
            className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0 select-none font-mono"
            title={`Section order #${index + 1}`}
          >
            {index + 1}.
          </span>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => onToggleCollapse(section)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded shrink-0 transition"
            aria-label={section.collapsed ? "Expand section" : "Collapse section"}
          >
            {section.collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Section Name with Tooltip */}
          <h2
            onClick={() => onOpenRename(section)}
            className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:underline min-w-0 flex-1"
            title={section.name}
          >
            {section.name}
          </h2>

          {/* Section Type indicator */}
          {sectionKind === "GOAL" ? (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 inline-flex items-center gap-0.5"
              title="Goal-centric Section (Start & End Date)"
            >
              <Target className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Goal</span>
            </span>
          ) : (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 shrink-0 inline-flex items-center gap-0.5"
              title="Task-based Section (Daily & Scheduled Tasks)"
            >
              <ListTodo className="w-2.5 h-2.5 text-indigo-500" />
              <span>Task</span>
            </span>
          )}

          {/* Count Badge */}
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
            {doneCount}/{itemCount}
          </span>
        </div>

        {/* Section Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Quick Add Item Button */}
          <button
            type="button"
            onClick={() => onOpenAddItem(section)}
            className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition"
            title="Add item to section"
            aria-label="Add item"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Section Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
              aria-label="Section menu"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 text-xs animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAddItem(section);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{sectionKind === "GOAL" ? "Add Goal" : "Add Task"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenRename(section);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename Section</span>
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveSection(section, "left");
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      <span>Move Left</span>
                    </button>
                  )}
                  {index < totalSections - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveSection(section, "right");
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>Move Right</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onArchiveSection(section);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Archive Section</span>
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Card Sizing
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onResize) onResize({ ...size, isFullWidth: !size?.isFullWidth });
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{size?.isFullWidth ? "Half Width (50%)" : "Full Width (100%)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onResize) onResize({ ...size, height: 560 });
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tall Height (560px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onResize) onResize({ ...size, height: 320 });
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>Compact Height (320px)</span>
                  </button>
                  {(size?.width || size?.height || size?.isFullWidth) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (onResetSize) onResetSize();
                      }}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset Card Size</span>
                    </button>
                  )}
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteSection(section);
                    }}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Section</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Daily planner compact date navigation */}
      {isDaily && selectedDate && onChangeDate && (
        <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px]">
          <button
            type="button"
            onClick={() => onChangeDate(addDaysToKey(selectedDate, -1))}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-medium rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Previous day"
            title="Previous day"
          >
            <ChevronLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => onChangeDate(todayKey())}
              disabled={selectedDate === todayKey()}
              className="px-1.5 py-0.5 text-[10px] font-semibold rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-40 disabled:hover:bg-transparent transition"
              title="Jump to today"
            >
              Today
            </button>
            <label
              className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              title="Pick a date"
            >
              <CalendarDays className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="truncate max-w-[85px] font-medium">{formatDateKey(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                aria-label="Select planner date"
                onChange={(e) => e.target.value && onChangeDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => onChangeDate(addDaysToKey(selectedDate, 1))}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 font-medium rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Next day"
            title="Next day"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Section Body (Collapsible, Big card height with centered empty state) */}
      {!section.collapsed && (
        <div
          className={cn(
            "p-3 sm:p-4 flex-1 flex flex-col space-y-2.5 overflow-y-auto min-h-0",
            !currentHeight && "max-h-[640px]"
          )}
        >
          {filteredItems.length === 0 ? (
            <div className="flex-1 min-h-[220px] py-8 px-4 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {sectionKind === "GOAL" ? "No goals" : "No tasks"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {sectionKind === "GOAL" ? "Create your first goal in this section" : "Stay organized by adding your first task"}
              </p>
              <button
                type="button"
                onClick={() => onOpenAddItem(section)}
                className={cn(
                  "mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer",
                  sectionKind === "GOAL"
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                    : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{sectionKind === "GOAL" ? "Add Goal" : "Add Task"}</span>
              </button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                density={density}
                onToggleStatus={onToggleItemStatus}
                onEdit={onEditItem}
                onArchive={onArchiveItem}
                onDelete={onDeleteItem}
                sectionLabel={
                  item.sectionId !== section.id ? sectionNames?.[item.sectionId] : undefined
                }
                onReschedule={onRescheduleItem}
              />
            ))
          )}
        </div>
      )}

      {/* Interactive Resize Handles (Bottom, Right, and Corner) */}
      {!section.collapsed && (
        <>
          {/* Right Handle (Horizontal Width - hidden on mobile to avoid touch swipe collisions) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "horizontal")}
            onTouchStart={(e) => handleResizeStart(e, "horizontal")}
            className="hidden sm:block absolute top-0 right-0 w-2.5 h-full cursor-ew-resize z-20 group/rhandle hover:bg-indigo-500/25 active:bg-indigo-600/40 transition-colors"
            title="Drag side to resize width"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-slate-300/80 dark:bg-slate-700/80 group-hover/rhandle:bg-indigo-500 transition-colors rounded-full" />
          </div>

          {/* Bottom Handle (Vertical Height) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "vertical")}
            onTouchStart={(e) => handleResizeStart(e, "vertical")}
            className="absolute bottom-0 left-0 w-full h-2.5 cursor-ns-resize z-20 group/bhandle hover:bg-indigo-500/25 active:bg-indigo-600/40 transition-colors"
            title="Drag bottom to resize height"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-slate-300/80 dark:bg-slate-700/80 group-hover/bhandle:bg-indigo-500 transition-colors rounded-full" />
          </div>

          {/* Bottom-Right Corner Handle (Both Width & Height - hidden on mobile) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "both")}
            onTouchStart={(e) => handleResizeStart(e, "both")}
            className="hidden sm:flex absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-30 items-end justify-end p-1 group/chandle hover:bg-indigo-500/20 rounded-tl-lg transition-colors"
            title="Drag corner to resize width and height"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-400 group-hover/chandle:text-indigo-600 dark:group-hover/chandle:text-indigo-400 transition-colors pointer-events-none"
              viewBox="0 0 10 10"
              fill="currentColor"
            >
              <circle cx="8" cy="8" r="1.1" />
              <circle cx="8" cy="4.5" r="1.1" />
              <circle cx="4.5" cy="8" r="1.1" />
              <circle cx="8" cy="1" r="1.1" />
              <circle cx="4.5" cy="4.5" r="1.1" />
              <circle cx="1" cy="8" r="1.1" />
            </svg>
          </div>

          {/* Live Dimension Indicator Pill Badge */}
          {isResizing && liveDimensions && (
            <div className="absolute bottom-3 right-8 px-2 py-0.5 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-[11px] font-mono font-medium rounded-md shadow-lg pointer-events-none z-40 backdrop-blur-xs flex items-center gap-1 border border-white/20">
              <span>{liveDimensions.width}w</span>
              <span className="text-slate-400">×</span>
              <span>{liveDimensions.height}h</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
