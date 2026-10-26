"use client";

import React, { useState } from "react";
import { History, Send, Trash2 } from "lucide-react";
import { ProgressLog } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface ProgressTimelineProps {
  itemId: string;
  logs: ProgressLog[];
  currentProgress: number;
  onChange: (logs: ProgressLog[]) => void;
  onError: (message: string) => void;
}

export function ProgressTimeline({
  itemId,
  logs,
  currentProgress,
  onChange,
  onError,
}: ProgressTimelineProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${itemId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text, progressSnapshot: currentProgress }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add log");
      onChange([data.data.log, ...logs]);
      setNote("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add log");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (log: ProgressLog) => {
    try {
      const res = await fetch(`/api/items/${itemId}/logs/${log.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onChange(logs.filter((l) => l.id !== log.id));
    } catch {
      onError("Failed to delete log entry");
    }
  };

  return (
    <section
      aria-label="Progress timeline"
      className="rounded-2xl glass-surface ring-1 ring-white/10 p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-indigo-500" />
        Progress Timeline
      </h2>

      <form onSubmit={submit} className="flex flex-col gap-2 mb-4">
        <textarea
          id="progress-log-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder="Log an update, e.g. “Completed API integration, 60% done”"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Snapshot: {currentProgress}% progress</span>
          <button
            id="add-log-button"
            type="submit"
            disabled={saving || !note.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            <Send className="w-3.5 h-3.5" /> Log Update
          </button>
        </div>
      </form>

      {logs.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No updates logged yet.</p>
      ) : (
        <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-4">
          {logs.map((log) => (
            <li key={log.id} className="group ml-4">
              <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900" />
              <div className="flex items-center justify-between gap-2">
                <time className="text-[11px] font-medium text-slate-400">{formatDateTime(log.createdAt)}</time>
                <div className="flex items-center gap-2">
                  {log.progressSnapshot !== null && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300">
                      {log.progressSnapshot}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(log)}
                    aria-label="Delete log entry"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{log.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
