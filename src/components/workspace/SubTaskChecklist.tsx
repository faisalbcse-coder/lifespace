"use client";

import React, { useState } from "react";
import { Check, Plus, Trash2, Pencil, X, ListChecks } from "lucide-react";
import { SubTask } from "@/types";
import { cn } from "@/lib/utils";

interface SubTaskChecklistProps {
  itemId: string;
  subTasks: SubTask[];
  /** Called with the new list and the recomputed parent progress (null when no sub-tasks remain) */
  onChange: (subTasks: SubTask[], progress: number | null) => void;
  onError: (message: string) => void;
}

export function SubTaskChecklist({ itemId, subTasks, onChange, onError }: SubTaskChecklistProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const done = subTasks.filter((s) => s.isCompleted).length;

  const request = async (url: string, init: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Request failed");
    return data.data;
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const data = await request(`/api/items/${itemId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      onChange([...subTasks, data.subTask], data.progress);
      setNewTitle("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add sub-task");
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (sub: SubTask) => {
    const optimistic = subTasks.map((s) => (s.id === sub.id ? { ...s, isCompleted: !s.isCompleted } : s));
    onChange(optimistic, null);
    try {
      const data = await request(`/api/items/${itemId}/subtasks/${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted: !sub.isCompleted }),
      });
      onChange(optimistic, data.progress);
    } catch (err) {
      onChange(subTasks, null);
      onError(err instanceof Error ? err.message : "Failed to update sub-task");
    }
  };

  const saveEdit = async (sub: SubTask) => {
    const title = editTitle.trim();
    setEditingId(null);
    if (!title || title === sub.title) return;
    try {
      const data = await request(`/api/items/${itemId}/subtasks/${sub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      onChange(subTasks.map((s) => (s.id === sub.id ? data.subTask : s)), data.progress);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to rename sub-task");
    }
  };

  const remove = async (sub: SubTask) => {
    try {
      const data = await request(`/api/items/${itemId}/subtasks/${sub.id}`, { method: "DELETE" });
      onChange(subTasks.filter((s) => s.id !== sub.id), data.progress);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete sub-task");
    }
  };

  return (
    <section
      aria-label="Sub-tasks"
      className="rounded-2xl glass-surface ring-1 ring-white/10 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-indigo-500" />
          Sub-tasks
        </h2>
        <span className="text-xs font-medium text-slate-500 tabular-nums" id="subtask-count">
          {done}/{subTasks.length}
        </span>
      </div>

      <ul className="space-y-1">
        {subTasks.map((sub) => (
          <li
            key={sub.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
          >
            <button
              type="button"
              onClick={() => void toggle(sub)}
              aria-label={sub.isCompleted ? "Mark sub-task incomplete" : "Mark sub-task complete"}
              className={cn(
                "w-4.5 h-4.5 shrink-0 rounded-md border flex items-center justify-center transition",
                sub.isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-500"
              )}
              style={{ width: 18, height: 18 }}
            >
              {sub.isCompleted && <Check className="w-3 h-3" />}
            </button>

            {editingId === sub.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => void saveEdit(sub)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveEdit(sub);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 px-2 py-0.5 text-sm rounded border border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            ) : (
              <span
                className={cn(
                  "flex-1 text-sm",
                  sub.isCompleted ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"
                )}
              >
                {sub.title}
              </span>
            )}

            <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
              <button
                type="button"
                onClick={() => {
                  setEditingId(sub.id);
                  setEditTitle(sub.title);
                }}
                aria-label="Edit sub-task"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void remove(sub)}
                aria-label="Delete sub-task"
                className="p-1 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
        {subTasks.length === 0 && (
          <li className="text-xs text-slate-400 px-2 py-2">
            No sub-tasks yet. Add one and progress will be computed automatically.
          </li>
        )}
      </ul>

      <form onSubmit={add} className="mt-3 flex items-center gap-2">
        <input
          id="new-subtask-input"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a sub-task…"
          maxLength={255}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <button
          id="add-subtask-button"
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
        {newTitle && (
          <button type="button" onClick={() => setNewTitle("")} aria-label="Clear" className="p-1 text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
    </section>
  );
}
