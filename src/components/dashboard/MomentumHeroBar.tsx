"use client";

import React, { useMemo } from "react";
import { Sparkles, CheckCircle2, Flame, ArrowUpRight, Zap, Target } from "lucide-react";
import { User, Section, Item } from "@/types";
import { todayKey, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface MomentumHeroBarProps {
  user: User | null;
  sections: Section[];
  onOpenQuickCreate?: () => void;
}

export function MomentumHeroBar({ user, sections, onOpenQuickCreate }: MomentumHeroBarProps) {
  const today = useMemo(() => todayKey(), []);

  // Compute tasks assigned to Today or inside the "Daily" section
  const { todayTotal, todayDone, percent, activeCount, streakMotivation } = useMemo(() => {
    const allItems: Item[] = sections
      .filter((s) => !s.isArchived)
      .flatMap((s) => s.items || [])
      .filter((item) => {
        if (item.isArchived) return false;
        if (item.scheduledDate && toDateKey(item.scheduledDate) === today) return true;
        // If in daily section and unscheduled, treat as today
        const parentSec = sections.find((s) => s.id === item.sectionId);
        return parentSec?.name?.trim().toLowerCase() === "daily" && !item.scheduledDate;
      });

    const total = allItems.length;
    const done = allItems.filter((i) => i.status === "DONE").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    let motivation = "Build initial momentum today";
    if (pct === 100 && total > 0) motivation = "All daily goals conquered! Outstanding work.";
    else if (pct >= 75) motivation = "Final stretch — sprint to the finish!";
    else if (pct >= 50) motivation = "Over halfway through — momentum is surging!";
    else if (pct > 0) motivation = "Great start — keep the flow state alive!";

    const totalActive = sections
      .filter((s) => !s.isArchived)
      .flatMap((s) => s.items || [])
      .filter((i) => !i.isArchived && i.status !== "DONE").length;

    return {
      todayTotal: total,
      todayDone: done,
      percent: pct,
      activeCount: totalActive,
      streakMotivation: motivation,
    };
  }, [sections, today]);

  // Time-aware greeting
  const { greeting, timeBadge } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: "Good morning", timeBadge: "Morning Focus" };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: "Good afternoon", timeBadge: "Peak Momentum" };
    } else if (hour >= 17 && hour < 22) {
      return { greeting: "Good evening", timeBadge: "Evening Wrap-up" };
    } else {
      return { greeting: "Deep work session", timeBadge: "Night Owl Flow" };
    }
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // SVG Circular Ring calculation
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const displayName = user?.name ? user.name.split(" ")[0] : "Commander";

  return (
    <div
      id="momentum-hero-bar"
      className="relative overflow-hidden rounded-2xl glass-surface p-5 sm:p-6 border border-slate-200/70 dark:border-white/[0.09] shadow-xl backdrop-blur-xl transition-all"
    >
      {/* Decorative ambient subtle background glows inside the card */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Greeting & Date & Inspiration */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              {timeBadge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formattedDate}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {greeting}, <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">{displayName}</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{streakMotivation}</span>
          </p>
        </div>

        {/* Right: Today's Momentum Meter */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 py-2 px-3.5 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/[0.06] text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-500" /> Active Tasks
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activeCount}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" /> Today Done
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {todayDone} <span className="text-xs text-slate-500 font-normal">/ {todayTotal}</span>
              </span>
            </div>
          </div>

          {/* Glowing Circular Momentum Meter */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
                {/* Track Circle */}
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  strokeWidth="5"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  fill="transparent"
                />
                {/* Glowing Progress Circle */}
                <circle
                  cx="30"
                  cy="30"
                  r={radius}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-700 ease-out",
                    percent >= 100
                      ? "stroke-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      : "stroke-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                  )}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {percent}%
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                Daily Momentum
                {percent === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {todayDone} of {todayTotal} completed
              </span>
              <div className="w-28 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    percent >= 100
                      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
