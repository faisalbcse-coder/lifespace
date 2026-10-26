"use client";

import React from "react";
import { X, User as UserIcon, Mail, Shield, CheckCircle2, ListTodo, Layers, LogOut } from "lucide-react";
import { User } from "@/types";

interface ProfileModalProps {
  isOpen: boolean;
  user: User | null;
  stats: {
    totalSections: number;
    totalTasks: number;
    completedTasks: number;
  };
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileModal({
  isOpen,
  user,
  stats,
  onClose,
  onLogout,
}: ProfileModalProps) {
  if (!isOpen || !user) return null;

  const percentComplete =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-md rounded-2xl glass-panel p-4 sm:p-6 shadow-2xl relative border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Avatar & Name */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-200/60 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/25 mb-3 uppercase">
            {user.name ? user.name[0] : (user.email ? user.email[0] : "U")}
          </div>
          <h2 id="profile-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {user.name || "Personal User"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-400" />
            {user.email}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Shield className="w-3 h-3" />
            Personal Workspace Owner
          </span>
        </div>

        {/* Workspace Statistics */}
        <div className="py-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Workspace Overview
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-center">
              <Layers className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats.totalSections}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Sections</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-center">
              <ListTodo className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats.totalTasks}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Tasks</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {percentComplete}%
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Completed</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
