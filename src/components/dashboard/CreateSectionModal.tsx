"use client";

import React, { useState } from "react";
import { X, ListTodo, Target } from "lucide-react";
import { SectionKind } from "@/types";
import { encodeSectionColor } from "@/lib/goals";
import { cn } from "@/lib/utils";

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string; type?: SectionKind }) => Promise<void>;
}

const COLORS = [
  { id: "indigo", name: "Indigo", bg: "bg-indigo-500" },
  { id: "blue", name: "Sky Blue", bg: "bg-sky-500" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-500" },
  { id: "amber", name: "Amber", bg: "bg-amber-500" },
  { id: "rose", name: "Rose", bg: "bg-rose-500" },
  { id: "violet", name: "Violet", bg: "bg-purple-500" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500" },
  { id: "gray", name: "Slate", bg: "bg-slate-500" },
];

export function CreateSectionModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateSectionModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("indigo");
  const [type, setType] = useState<SectionKind>("TASK");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Section name cannot be empty");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await onSubmit({
        name: name.trim(),
        color: encodeSectionColor(color, type),
        type,
      });
      setName("");
      setColor("indigo");
      setType("TASK");
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create section");
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
      <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col p-4 sm:p-6 space-y-4 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-1 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Create New Section
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Section Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Backlog, Ideas, Urgent Sprint"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Section Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Section Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType("TASK")}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  type === "TASK"
                    ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                )}
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ListTodo className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-none">Task-based</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Daily tasks, single date
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("GOAL")}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                  type === "GOAL"
                    ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                )}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-none">Goal-centric</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Start & End date range
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                    color === c.id
                      ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                      : "opacity-75 hover:opacity-100"
                  }`}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg transition shadow-xs"
            >
              {loading ? "Creating..." : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
