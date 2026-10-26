"use client";

import React from "react";
import { Play, Pause, RotateCcw, Timer, Coffee, X } from "lucide-react";
import { useFocus } from "./FocusProvider";
import { cn } from "@/lib/utils";

export function FocusTimerPill() {
  const f = useFocus();
  const mm = String(Math.floor(f.remaining / 60)).padStart(2, "0");
  const ss = String(f.remaining % 60).padStart(2, "0");
  const isFocus = f.mode === "focus";

  return (
    <div
      id="focus-timer-pill"
      role="timer"
      aria-label={`${isFocus ? "Focus" : "Break"} timer ${mm}:${ss}`}
      className={cn(
        "flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full border text-xs transition-all",
        "bg-white/60 dark:bg-white/[0.05] backdrop-blur-md",
        f.running
          ? isFocus
            ? "border-emerald-500/60 shadow-[0_0_18px_-2px_rgba(16,185,129,0.45)]"
            : "border-sky-500/60 shadow-[0_0_18px_-2px_rgba(14,165,233,0.4)]"
          : "border-slate-300/70 dark:border-white/10"
      )}
    >
      <button
        type="button"
        onClick={() => f.switchMode(isFocus ? "break" : "focus")}
        title={isFocus ? "Switch to 5m break" : "Switch to 25m focus"}
        aria-label="Switch focus/break mode"
        className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      >
        {isFocus ? <Timer className="w-3.5 h-3.5 text-emerald-500" /> : <Coffee className="w-3.5 h-3.5 text-sky-500" />}
        <span className="hidden md:inline font-medium">{isFocus ? "Focus" : "Break"}</span>
      </button>

      <span
        id="focus-timer-display"
        className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50 min-w-[44px] text-center"
      >
        {mm}:{ss}
      </span>

      {f.taskTitle && (
        <span
          className="hidden lg:inline-flex items-center gap-1 max-w-[140px] pl-1.5 border-l border-slate-300/70 dark:border-white/10 text-slate-600 dark:text-slate-300"
          title={`Linked task: ${f.taskTitle}`}
        >
          <span className="truncate">{f.taskTitle}</span>
          <button
            type="button"
            onClick={() => f.linkTask(null)}
            aria-label="Unlink task from timer"
            className="text-slate-400 hover:text-rose-500"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        id="focus-timer-toggle"
        type="button"
        onClick={f.toggle}
        aria-label={f.running ? "Pause timer" : "Start timer"}
        className={cn(
          "ml-0.5 p-1.5 rounded-full text-white transition active:scale-90",
          isFocus ? "bg-emerald-600 hover:bg-emerald-500" : "bg-sky-600 hover:bg-sky-500"
        )}
      >
        {f.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <button
        type="button"
        onClick={f.reset}
        aria-label="Reset timer"
        title="Reset"
        className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
}
