"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DailyPlannerView } from "@/components/dashboard/DailyPlannerView";
import { GoalsHubView } from "@/components/dashboard/GoalsHubView";
import { SectionGrid } from "@/components/dashboard/SectionGrid";
import { CreateSectionModal } from "@/components/dashboard/CreateSectionModal";
import { RenameSectionModal } from "@/components/dashboard/RenameSectionModal";
import { CreateItemModal } from "@/components/dashboard/CreateItemModal";
import { EditItemModal } from "@/components/dashboard/EditItemModal";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { ArchivedSectionsModal } from "@/components/dashboard/ArchivedSectionsModal";
import { BackupModal } from "@/components/dashboard/BackupModal";
import { useToast } from "@/components/ui/Toast";
import { Section, Item, User, SectionKind } from "@/types";
import { isDailySection } from "@/components/dashboard/SectionGrid";
import type { ReschedulePreset } from "@/components/dashboard/ItemCard";
import { addDaysToKey, todayKey } from "@/lib/dates";

export default function DashboardPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [archivedSections, setArchivedSections] = useState<Section[]>([]);
  const [archivedItems, setArchivedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Navigation state (Default landing: "daily")
  const [activeView, setActiveView] = useState<"daily" | "goals">("daily");

  // Sync with optional ?view= URL query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      if (v === "goals" || v === "daily") {
        setActiveView(v);
      }
    }
  }, []);

  // Preferences & Layout
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [seeMoreExpanded, setSeeMoreExpanded] = useState(false);

  // Daily planner selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => todayKey());

  // Modals state
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [renameSection, setRenameSection] = useState<Section | null>(null);
  const [createItemTargetSection, setCreateItemTargetSection] = useState<Section | null>(null);
  const [createItemMode, setCreateItemMode] = useState<"GOAL" | "TASK">("GOAL");
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "section" | "item";
    target: Section | Item;
    title: string;
    message: string;
  } | null>(null);

  // Apply theme class to document
  const applyTheme = useCallback((newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, []);

  // Fetch initial workspace data
  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // 1. Check user auth
      const meRes = await fetch("/api/auth/me", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      const meData = await meRes.json();
      if (!meData.success) {
        router.replace("/login");
        return;
      }

      setUser(meData.data.user);
      if (meData.data.preference) {
        const pref = meData.data.preference;
        applyTheme(pref.theme as "light" | "dark" | "system");
        setDensity(pref.density as "compact" | "comfortable");
        setSeeMoreExpanded(pref.seeMoreExpanded);
      }

      // 2. Fetch sections with items
      const secRes = await fetch("/api/sections?includeArchived=true");
      const secData = await secRes.json();
      let allSecs: Section[] = [];
      if (secData.success && secData.data?.sections) {
        allSecs = secData.data.sections;
      }

      // 3. Fetch archived/trashed items for trash manager
      const archItemRes = await fetch("/api/items?isArchived=true");
      const archItemData = await archItemRes.json();
      let activeArchivedItems: Item[] = [];
      if (archItemData.success && archItemData.data?.items) {
        activeArchivedItems = archItemData.data.items;
      }

      // Auto-purge items and sections older than 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const expiredSections = allSecs.filter(
        (s) => s.isArchived && new Date(s.updatedAt || s.createdAt).getTime() < thirtyDaysAgo
      );
      const expiredItems = activeArchivedItems.filter(
        (i) => i.isArchived && new Date(i.updatedAt || i.createdAt).getTime() < thirtyDaysAgo
      );

      if (expiredSections.length > 0) {
        expiredSections.forEach((s) => fetch(`/api/sections/${s.id}`, { method: "DELETE" }).catch(() => {}));
        allSecs = allSecs.filter((s) => !expiredSections.some((es) => es.id === s.id));
      }
      if (expiredItems.length > 0) {
        expiredItems.forEach((i) => fetch(`/api/items/${i.id}`, { method: "DELETE" }).catch(() => {}));
        activeArchivedItems = activeArchivedItems.filter((i) => !expiredItems.some((ei) => ei.id === i.id));
      }

      setSections(allSecs.filter((s) => !s.isArchived));
      setArchivedSections(allSecs.filter((s) => s.isArchived));
      setArchivedItems(activeArchivedItems);
    } catch (err: unknown) {
      console.error("Workspace load error:", err);
      if (err instanceof Error && err.name === "AbortError") {
        router.replace("/login");
      } else {
        error("Failed to load workspace data.");
      }
    } finally {
      setLoading(false);
    }
  }, [applyTheme, error, router]);

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist user preference
  const updatePreference = async (partial: Record<string, unknown>) => {
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
    } catch {
      // non-critical
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    updatePreference({ theme: nextTheme });
  };

  const handleToggleDensity = () => {
    const nextDensity = density === "compact" ? "comfortable" : "compact";
    setDensity(nextDensity);
    updatePreference({ density: nextDensity });
  };

  const handleToggleSeeMore = (expanded: boolean) => {
    setSeeMoreExpanded(expanded);
    updatePreference({ seeMoreExpanded: expanded });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  // Section Actions
  const handleCreateSection = async (data: { name: string; color: string; type?: SectionKind }) => {
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to create section");
    }
    const newSection: Section = result.data.section;
    setSections((prev) => [...prev, newSection]);
    success(`Section "${newSection.name}" created`);
  };

  const handleRenameSection = async (sectionId: string, data: { name: string; color: string; type?: SectionKind }) => {
    const res = await fetch(`/api/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to update section");
    }
    const updated: Section = result.data.section;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name: updated.name, color: updated.color } : s))
    );
    success("Section updated");
  };

  const handleToggleCollapse = async (section: Section) => {
    const nextCollapsed = !section.collapsed;
    // Optimistic
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, collapsed: nextCollapsed } : s))
    );
    await fetch(`/api/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collapsed: nextCollapsed }),
    });
  };

  const handleArchiveSection = async (section: Section) => {
    try {
      const res = await fetch(`/api/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (!res.ok) throw new Error();
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      setArchivedSections((prev) => [...prev, { ...section, isArchived: true }]);
      info(`Section "${section.name}" archived`);
    } catch {
      error("Failed to archive section");
    }
  };

  const handleRestoreSection = async (section: Section) => {
    try {
      const res = await fetch(`/api/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (!res.ok) throw new Error();
      setArchivedSections((prev) => prev.filter((s) => s.id !== section.id));
      setSections((prev) => [...prev, { ...section, isArchived: false }]);
      success(`Section "${section.name}" restored`);
    } catch {
      error("Failed to restore section");
    }
  };

  const handleDeleteSectionConfirm = (section: Section) => {
    setDeleteConfirm({
      type: "section",
      target: section,
      title: `Move "${section.name}" to Trash?`,
      message:
        "This section and its items will be kept in Trash for 30 days before being permanently deleted.",
    });
  };

  // Item Actions
  const handleCreateItem = async (data: {
    sectionId: string;
    title: string;
    description?: string;
    priority: Item["priority"];
    status: Item["status"];
    itemType?: string;
    dueDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    scheduledDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    progress?: number;
  }) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to create item");
    }
    const newItem: Item = result.data.item;
    setSections((prev) =>
      prev.map((s) =>
        s.id === newItem.sectionId ? { ...s, items: [...(s.items || []), newItem] } : s
      )
    );
    success("Item added");
  };

  const handleEditItem = async (itemId: string, data: Partial<Item>) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to update item");
    }
    const updated: Item = result.data.item;
    setSections((prev) =>
      prev.map((s) => {
        // If moved across sections
        if (s.id === updated.sectionId) {
          const exists = s.items?.some((i) => i.id === updated.id);
          return {
            ...s,
            items: exists
              ? s.items.map((i) => (i.id === updated.id ? updated : i))
              : [...(s.items || []), updated],
          };
        } else {
          return {
            ...s,
            items: s.items?.filter((i) => i.id !== updated.id) || [],
          };
        }
      })
    );
    success("Item updated");
  };

  const handleRescheduleItem = async (
    item: Item,
    target: ReschedulePreset | { date: string }
  ) => {
    const body =
      typeof target === "string" ? { preset: target } : { scheduledDate: target.date };
    try {
      const res = await fetch(`/api/items/${item.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to reschedule item");
      }
      const updated: Item = result.data.item;
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items?.map((i) => (i.id === updated.id ? updated : i)) || [],
        }))
      );
      success(
        typeof target === "string"
          ? target === "today"
            ? "Moved to today"
            : target === "tomorrow"
            ? "Moved to tomorrow"
            : "Moved to next week"
          : `Scheduled for ${addDaysToKey(target.date, 0)}`
      );
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to reschedule item");
    }
  };

  const handleToggleItemStatus = async (item: Item) => {
    const nextStatus = item.status === "DONE" ? "TODO" : "DONE";
    // Optimistic
    setSections((prev) =>
      prev.map((s) =>
        s.id === item.sectionId
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: nextStatus,
                      completedAt: nextStatus === "DONE" ? new Date().toISOString() : null,
                    }
                  : i
              ),
            }
          : s
      )
    );

    try {
      await fetch(`/api/items/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // rollback
      loadWorkspace();
    }
  };

  const handleArchiveItem = async (item: Item) => {
    try {
      const res = await fetch(`/api/items/${item.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      if (!res.ok) throw new Error();
      setSections((prev) =>
        prev.map((s) =>
          s.id === item.sectionId
            ? { ...s, items: s.items.filter((i) => i.id !== item.id) }
            : s
        )
      );
      setArchivedItems((prev) => [...prev, { ...item, isArchived: true }]);
      info(`Item "${item.title}" archived`);
    } catch {
      error("Failed to archive item");
    }
  };

  const handleRestoreItem = async (item: Item) => {
    try {
      const res = await fetch(`/api/items/${item.id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (!res.ok) throw new Error();
      setArchivedItems((prev) => prev.filter((i) => i.id !== item.id));
      setSections((prev) =>
        prev.map((s) =>
          s.id === item.sectionId
            ? { ...s, items: [...(s.items || []), { ...item, isArchived: false }] }
            : s
        )
      );
      success(`Item "${item.title}" restored`);
    } catch {
      error("Failed to restore item");
    }
  };

  const handleDeleteItemConfirm = (item: Item) => {
    const isGoal = item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0) || !item.subGoalId;
    const typeLabel = isGoal ? "Goal" : "Task";
    setDeleteConfirm({
      type: "item",
      target: item,
      title: `Move ${typeLabel} "${item.title}" to Trash?`,
      message: `This ${typeLabel.toLowerCase()} will be kept in Trash for 30 days before being permanently deleted.`,
    });
  };

  const handleConfirmExecute = async () => {
    if (!deleteConfirm) return;
    const { type, target } = deleteConfirm;
    setDeleteConfirm(null);

    if (type === "section") {
      const section = target as Section;
      try {
        const res = await fetch(`/api/sections/${section.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: true }),
        });
        if (!res.ok) throw new Error();
        const trashedSection: Section = {
          ...section,
          isArchived: true,
          updatedAt: new Date().toISOString(),
        };
        setSections((prev) => prev.filter((s) => s.id !== section.id));
        setArchivedSections((prev) => [trashedSection, ...prev.filter((s) => s.id !== section.id)]);
        info(`Section "${section.name}" moved to Trash (kept for 30 days)`);
      } catch {
        error("Failed to move section to Trash");
      }
    } else {
      const item = target as Item;
      try {
        const res = await fetch(`/api/items/${item.id}/archive`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: true }),
        });
        if (!res.ok) throw new Error();
        const isGoal = item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0) || !item.subGoalId;
        const typeLabel = isGoal ? "Goal" : "Task";
        const trashedItem: Item = {
          ...item,
          isArchived: true,
          updatedAt: new Date().toISOString(),
        };
        setSections((prev) =>
          prev.map((s) =>
            s.id === item.sectionId
              ? { ...s, items: s.items.filter((i) => i.id !== item.id) }
              : s
          )
        );
        setArchivedItems((prev) => [trashedItem, ...prev.filter((i) => i.id !== item.id)]);
        info(`${typeLabel} "${item.title}" moved to Trash (kept for 30 days)`);
      } catch {
        error("Failed to move item to Trash");
      }
    }
  };

  // Permanent Deletion (from inside Trash)
  const handlePermanentDeleteItem = async (item: Item) => {
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setArchivedItems((prev) => prev.filter((i) => i.id !== item.id));
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items?.filter((i) => i.id !== item.id) || [],
        }))
      );
      success("Item permanently deleted");
    } catch {
      error("Failed to delete item permanently");
    }
  };

  const handlePermanentDeleteSection = async (section: Section) => {
    try {
      const res = await fetch(`/api/sections/${section.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setArchivedSections((prev) => prev.filter((s) => s.id !== section.id));
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      success("Section permanently deleted");
    } catch {
      error("Failed to delete section permanently");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const itemPromises = archivedItems.map((item) =>
        fetch(`/api/items/${item.id}`, { method: "DELETE" })
      );
      const sectionPromises = archivedSections.map((sec) =>
        fetch(`/api/sections/${sec.id}`, { method: "DELETE" })
      );
      await Promise.allSettled([...itemPromises, ...sectionPromises]);
      setArchivedItems([]);
      setArchivedSections([]);
      success("Trash emptied successfully");
    } catch {
      error("Failed to empty trash");
    }
  };

  // Calculations for stats
  const totalTasks = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
  const completedTasks = sections.reduce(
    (acc, s) => acc + (s.items?.filter((i) => i.status === "DONE").length || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading your workspace...</p>
          <a
            href="/login"
            className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 underline font-medium cursor-pointer"
          >
            Taking too long? Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // Quick Add task for selected date in Daily Planner
  const handleQuickAddTask = async (title: string, dateKey: string) => {
    let dailySec = sections.find((s) => {
      const n = s.name.trim().toLowerCase();
      return n === "daily" || n === "daily task" || n.startsWith("daily");
    });

    if (!dailySec) {
      dailySec = sections.find((s) => !s.isArchived);
    }

    if (!dailySec) {
      error("Please create a section first.");
      return;
    }

    await handleCreateItem({
      sectionId: dailySec.id,
      title,
      priority: "MEDIUM",
      status: "TODO",
      scheduledDate: dateKey,
    });
  };

  const handleOpenCreateGoal = (targetSection?: Section) => {
    setCreateItemMode("GOAL");
    if (targetSection) {
      setCreateItemTargetSection(targetSection);
      return;
    }
    const goalSec = sections.find((s) => {
      if (s.isArchived || s.isHidden) return false;
      const n = s.name.trim().toLowerCase();
      return n !== "daily" && n !== "daily task" && !n.startsWith("daily");
    });
    setCreateItemTargetSection(goalSec || sections[0] || null);
  };

  const handleOpenCreateTask = (targetSection?: Section) => {
    setCreateItemMode("TASK");
    setCreateItemTargetSection(targetSection || sections[0] || null);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100">
      {/* Header with Lifespace branding, Navigation Switcher (Daily Tasks vs Goals), Search & Settings */}
      <DashboardHeader
        user={user}
        theme={theme}
        stats={{
          totalSections: sections.length,
          totalTasks,
          completedTasks,
        }}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenCreateSection={() => setIsCreateSectionOpen(true)}
        archivedSections={archivedSections}
        archivedItems={archivedItems}
        onRestoreSection={handleRestoreSection}
        onDeleteSection={handlePermanentDeleteSection}
        onRestoreItem={handleRestoreItem}
        onDeleteItem={handlePermanentDeleteItem}
        onEmptyTrash={handleEmptyTrash}
        density={density}
        onToggleDensity={handleToggleDensity}
        sections={sections}
      />

      {/* Main Workspace: Daily Tasks or Goal Management */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-10 sm:pb-14 min-w-0">
        {activeView === "daily" ? (
          <DailyPlannerView
            sections={sections}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            onToggleItemStatus={handleToggleItemStatus}
            onEditItem={(item) => setEditItem(item)}
            onArchiveItem={handleArchiveItem}
            onDeleteItem={handleDeleteItemConfirm}
            onRescheduleItem={handleRescheduleItem}
            onQuickAddTask={handleQuickAddTask}
            onNavigateToGoals={() => setActiveView("goals")}
            density={density}
          />
        ) : (
          <GoalsHubView
            sections={sections}
            onSectionsChange={setSections}
            onOpenCreateGoal={handleOpenCreateGoal}
            onOpenCreateSection={() => setIsCreateSectionOpen(true)}
            onOpenRenameSection={(sec) => setRenameSection(sec)}
            onArchiveSection={handleArchiveSection}
            onDeleteSection={handleDeleteSectionConfirm}
            onEditGoal={(item) => setEditItem(item)}
            onArchiveGoal={handleArchiveItem}
            onDeleteGoal={handleDeleteItemConfirm}
            onNavigateToDaily={() => setActiveView("daily")}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <CreateSectionModal
        isOpen={isCreateSectionOpen}
        onClose={() => setIsCreateSectionOpen(false)}
        onSubmit={handleCreateSection}
      />

      <RenameSectionModal
        section={renameSection}
        isOpen={!!renameSection}
        onClose={() => setRenameSection(null)}
        onSubmit={handleRenameSection}
      />

      <CreateItemModal
        isOpen={!!createItemTargetSection}
        initialMode={createItemMode}
        sections={sections}
        defaultSectionId={createItemTargetSection?.id}
        defaultScheduledDate={
          createItemTargetSection && isDailySection(createItemTargetSection)
            ? selectedDate
            : undefined
        }
        onClose={() => setCreateItemTargetSection(null)}
        onSubmit={handleCreateItem}
      />

      <EditItemModal
        item={editItem}
        sections={sections}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEditItem}
      />

      <ArchivedSectionsModal
        isOpen={isArchivedModalOpen}
        archivedSections={archivedSections}
        archivedItems={archivedItems}
        onClose={() => setIsArchivedModalOpen(false)}
        onRestoreSection={handleRestoreSection}
        onDeleteSection={handleDeleteSectionConfirm}
        onRestoreItem={handleRestoreItem}
        onDeleteItem={handleDeleteItemConfirm}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.title || ""}
        message={deleteConfirm?.message || ""}
        confirmLabel="Move to Trash"
        isDestructive={true}
        onConfirm={handleConfirmExecute}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
