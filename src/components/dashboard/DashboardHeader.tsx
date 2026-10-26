"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  LogOut,
  User as UserIcon,
  Search,
  Settings,
  ChevronDown,
  CalendarDays,
  Target,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import { User, Section, Item } from "@/types";
import { OPEN_PALETTE_EVENT } from "@/components/ui/CommandPalette";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: User | null;
  theme: "light" | "dark" | "system";
  stats: {
    totalSections: number;
    totalTasks: number;
    completedTasks: number;
  };
  onToggleTheme: () => void;
  onLogout: () => void;
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Navigation Switcher
  activeView?: "daily" | "goals";
  onViewChange?: (view: "daily" | "goals") => void;
  // New Section (optional)
  onOpenCreateSection?: () => void;
  // Settings & Archived / Backup data
  archivedSections: Section[];
  archivedItems: Item[];
  onRestoreSection: (section: Section) => void | Promise<void>;
  onDeleteSection: (section: Section) => void | Promise<void>;
  onRestoreItem: (item: Item) => void | Promise<void>;
  onDeleteItem: (item: Item) => void | Promise<void>;
  onEmptyTrash?: () => void | Promise<void>;
  density: "compact" | "comfortable";
  onToggleDensity: () => void;
  sections?: Section[];
}

export function DashboardHeader({
  user,
  theme,
  stats,
  onToggleTheme,
  onLogout,
  searchQuery,
  onSearchChange,
  activeView = "daily",
  onViewChange,
  onOpenCreateSection,
  archivedSections,
  archivedItems,
  onRestoreSection,
  onDeleteSection,
  onRestoreItem,
  onDeleteItem,
  onEmptyTrash,
  density,
  onToggleDensity,
  sections = [],
}: DashboardHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  const totalTrashCount = archivedSections.length + archivedItems.length;

  // Live Little Clock ("chotto ghori")
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerPalette = () => {
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const userName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <>
      {/* Floating Transparent Liquid-Glass Header */}
      <header className="sticky top-0 z-30 w-full px-2 sm:px-6 pt-2 sm:pt-3 pb-1 transition-all">
        <div className="max-w-[1700px] mx-auto rounded-2xl backdrop-blur-[25px] bg-white/75 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/15 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-6 transition-all ring-1 ring-slate-900/[0.03] dark:ring-white/[0.05]">
          {/* Left: Brand - Decorated Lifespace Emblem & Typography */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 group cursor-default">
            {/* Jewel-like Liquid Emblem */}
            <BrandLogo size="sm" />

            {/* Styled Lifespace Typography with glowing cyan dot */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white select-none">
                Lifespace
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff] shadow-[0_0_8px_#00eaff]" />
            </div>
          </div>

          {/* Center: Search Capsule (Desktop) */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-[260px] mx-auto min-w-0">
            <div className="relative w-full transition-all">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-9 sm:pr-11 py-1.5 text-xs rounded-full border border-slate-300/80 dark:border-white/15 bg-white/70 dark:bg-white/[0.05] hover:bg-white/90 dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/30 transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={triggerPalette}
                title="Command Palette (⌘K)"
                aria-label="Command Palette"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-[#00eaff] dark:hover:text-[#00eaff] transition cursor-pointer"
              >
                ⌘K
              </button>
            </div>
          </div>

          {/* Right: Daily/Goal Toggle + Quick Search + Clock + User Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Daily / Goal Toggle Button (EN/BN style: shows the other view) */}
            {onViewChange && (
              <button
                type="button"
                onClick={() => onViewChange(activeView === "daily" ? "goals" : "daily")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs select-none shrink-0",
                  activeView === "daily"
                    ? "border-emerald-500/35 dark:border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-indigo-500/35 dark:border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                )}
                title={activeView === "daily" ? "Switch to Goal Management" : "Switch to Daily Tasks"}
                aria-label={activeView === "daily" ? "Switch to Goal Management" : "Switch to Daily Tasks"}
              >
                {activeView === "daily" ? (
                  <>
                    <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Goal</span>
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Daily</span>
                  </>
                )}
              </button>
            )}

            {/* Mobile Search Icon Trigger */}
            <button
              type="button"
              onClick={triggerPalette}
              className="lg:hidden p-1.5 sm:p-2 rounded-full border border-slate-200/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-[#00eaff] transition cursor-pointer"
              title="Search / Command Palette (⌘K)"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Chotto Ghori (Little Live Clock) */}
            {currentTime && (
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.05] backdrop-blur-xl text-xs font-mono text-slate-700 dark:text-slate-200 shadow-2xs select-none">
                <Clock className="w-3.5 h-3.5 text-[#00c6ff] shrink-0" />
                <span className="font-semibold tracking-tight text-[11px]">{currentTime}</span>
              </div>
            )}

            {/* Single Combined User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-200/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.05] hover:bg-white/90 dark:hover:bg-white/[0.09] backdrop-blur-xl text-xs font-medium text-slate-800 dark:text-slate-100 shadow-2xs hover:shadow-xs transition shrink-0"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                title={`Account menu for ${userName}`}
                aria-label="Account menu"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00c6ff] via-[#0072ff] to-[#8a2be2] text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0 shadow-xs">
                  {userName[0]}
                </div>
                <span className="truncate max-w-[110px] font-semibold hidden sm:inline">
                  {userName}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-slate-400 transition-transform duration-150 hidden sm:inline",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-1.5 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/10 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {userName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Profile option - Navigates to dedicated profile page */}
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition text-left cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Profile</span>
                  </Link>

                  {/* Trash option */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Trash</span>
                    </div>
                    {totalTrashCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {totalTrashCount}
                      </span>
                    )}
                  </button>

                  {/* Theme Mode toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-medium transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {theme === "dark" ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 dark:border-white/5 my-1" />

                  {/* Logout option */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        user={user}
        stats={stats}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={onLogout}
      />

      {/* Trash Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        archivedSections={archivedSections}
        archivedItems={archivedItems}
        onRestoreSection={onRestoreSection}
        onDeleteSection={onDeleteSection}
        onRestoreItem={onRestoreItem}
        onDeleteItem={onDeleteItem}
        onEmptyTrash={onEmptyTrash}
        theme={theme}
        density={density}
        onToggleTheme={onToggleTheme}
        onToggleDensity={onToggleDensity}
        sections={sections}
      />
    </>
  );
}
