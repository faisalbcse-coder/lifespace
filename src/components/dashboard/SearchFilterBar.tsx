"use client";

import React from "react";
import { Search, Plus, Filter, Archive, Database, LayoutGrid } from "lucide-react";

interface SearchFilterBarProps {
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  density: "compact" | "comfortable";
  archivedCount: number;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPriorityFilterChange: (priority: string) => void;
  onToggleDensity: () => void;
  onOpenCreateSection: () => void;
  onOpenArchivedModal: () => void;
  onOpenBackupModal: () => void;
}

export function SearchFilterBar({
  searchQuery,
  statusFilter,
  priorityFilter,
  density,
  archivedCount,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onToggleDensity,
  onOpenCreateSection,
  onOpenArchivedModal,
  onOpenBackupModal,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-surface rounded-xl p-3">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Search input */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items by title or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Status filter dropdown */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter by item status"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DONE">Completed</option>
          </select>
        </div>

        {/* Priority filter dropdown */}
        <div className="flex items-center">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Density Toggle */}
        <button
          type="button"
          onClick={onToggleDensity}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title={`Switch to ${density === "compact" ? "comfortable" : "compact"} layout`}
          aria-label="Toggle density"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Archived Items / Sections */}
        <button
          type="button"
          onClick={onOpenArchivedModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="View archived sections"
        >
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Archived</span>
          {archivedCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {archivedCount}
            </span>
          )}
        </button>

        {/* Backup manager button */}
        <button
          type="button"
          onClick={onOpenBackupModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Database backup and restoration"
        >
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Backups</span>
        </button>

        {/* Create Section Button */}
        <button
          type="button"
          onClick={onOpenCreateSection}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Section</span>
        </button>
      </div>
    </div>
  );
}
