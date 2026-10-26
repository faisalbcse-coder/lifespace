"use client";

import React, { useState, useEffect } from "react";
import { X, Database, Download, ShieldCheck, RefreshCw, HardDrive } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface BackupRecord {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { success, error } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.success && data.data?.backups) {
        setBackups(data.data.backups);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Backup failed");
      }
      success("Atomic SQLite backup created and verified!");
      await fetchBackups();
    } catch (err) {
      error(err instanceof Error ? err.message : "Backup failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="glass-panel ring-1 ring-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Database Backup & Recovery
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

        {/* Informative Alert */}
        <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 shrink-0">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Atomic Non-Blocking SQLite Backups</p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
              Backups utilize SQLite&apos;s native <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded">VACUUM INTO</code> engine with WAL checkpointing, guaranteeing 100% data consistency even under active concurrent writes.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Available Backups ({backups.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchBackups}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition"
              title="Refresh backups"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreateBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{creating ? "Creating..." : "Create Backup"}</span>
            </button>
          </div>
        </div>

        {/* Backup files list */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
          {loading && backups.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              No backups created yet. Click &quot;Create Backup&quot; to take a consistent snapshot.
            </div>
          ) : (
            backups.map((b) => (
              <div
                key={b.filename}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                      {b.filename}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(b.sizeBytes / 1024).toFixed(1)} KB • {new Date(b.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CLI Restoration Guide */}
        <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono shrink-0">
          <p className="text-slate-400 text-[10px] mb-1 font-sans">
            To restore from backup with safety verification:
          </p>
          <p className="text-emerald-400 selection:bg-emerald-900">
            $ npm run db:restore
          </p>
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
