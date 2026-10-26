"use client";

import React, { useState } from "react";
import { X, Calendar, Target } from "lucide-react";
import { Section, ItemPriority, ItemStatus } from "@/types";

interface CreateItemModalProps {
  isOpen: boolean;
  sections: Section[];
  defaultSectionId?: string;
  defaultScheduledDate?: string;
  initialMode?: "GOAL" | "TASK";
  onClose: () => void;
  onSubmit: (data: {
    sectionId: string;
    title: string;
    description?: string;
    priority: ItemPriority;
    status: ItemStatus;
    itemType?: string;
    dueDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    scheduledDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    progress?: number;
  }) => Promise<void>;
}

export function CreateItemModal({
  isOpen,
  sections,
  defaultSectionId,
  defaultScheduledDate,
  onClose,
  onSubmit,
}: CreateItemModalProps) {
  const [sectionId, setSectionId] = useState(defaultSectionId || sections[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(defaultScheduledDate || "");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    setStartDate(defaultScheduledDate || "");
  }, [defaultScheduledDate, isOpen]);

  React.useEffect(() => {
    if (defaultSectionId) {
      setSectionId(defaultSectionId);
    } else if (sections.length > 0 && !sectionId) {
      setSectionId(sections[0].id);
    }
  }, [defaultSectionId, sections, sectionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Goal title is required");
      return;
    }

    if (!sectionId) {
      setErrorMsg("Please select a target section");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await onSubmit({
        sectionId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority: "MEDIUM",
        status: "TODO",
        itemType: "GOAL",
        startDate: startDate || null,
        endDate: endDate || null,
        dueDate: endDate ? new Date(`${endDate}T00:00:00`).toISOString() : null,
        scheduledDate: startDate || null,
      });
      setTitle("");
      setDescription("");
      setStartDate(defaultScheduledDate || "");
      setEndDate("");
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 shrink-0 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-500 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Add New Goal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1 mt-3">
          {/* Target Section */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Section
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Goal Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Full Stack Development, Run 10km Marathon"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Vision & Summary */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vision & Summary (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does achieving this goal look like? Key motivation or summary..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Goal Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer"
            >
              {loading ? "Creating Goal..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
