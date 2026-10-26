"use client";

import React, { useState } from "react";
import { X, RotateCcw, Trash2, Archive, Layers } from "lucide-react";
import { Section, Item } from "@/types";

interface ArchivedSectionsModalProps {
  isOpen: boolean;
  archivedSections: Section[];
  archivedItems: Item[];
  onClose: () => void;
  onRestoreSection: (section: Section) => void | Promise<void>;
  onDeleteSection: (section: Section) => void | Promise<void>;
  onRestoreItem: (item: Item) => void | Promise<void>;
  onDeleteItem: (item: Item) => void | Promise<void>;
}

export function ArchivedSectionsModal({
  isOpen,
  archivedSections,
  archivedItems,
  onClose,
  onRestoreSection,
  onDeleteSection,
  onRestoreItem,
  onDeleteItem,
}: ArchivedSectionsModalProps) {
  const [tab, setTab] = useState<"sections" | "items">("sections");

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Archived Workspace Records
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setTab("sections")}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
              tab === "sections"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Archived Sections ({archivedSections.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("items")}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition ${
              tab === "items"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Archived Items ({archivedItems.length})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
          {tab === "sections" ? (
            archivedSections.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                No archived sections.
              </div>
            ) : (
              archivedSections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sec.name}
                      </span>
                      <span className="text-slate-400 ml-2">
                        ({sec.items?.length || 0} items)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRestoreSection(sec)}
                      className="px-2.5 py-1 inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-medium"
                      title="Restore section to dashboard"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSection(sec)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                      title="Permanently delete section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : archivedItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
              No archived items.
            </div>
          ) : (
            archivedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.title}
                  </span>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => onRestoreItem(item)}
                    className="px-2.5 py-1 inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-medium"
                    title="Restore item"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                    title="Permanently delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
