"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Timer,
  Moon,
  LayoutDashboard,
  ArrowRight,
  Crosshair,
  CornerDownLeft,
} from "lucide-react";
import { useFocus } from "@/components/focus/FocusProvider";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface TaskResult {
  id: string;
  title: string;
  status: string;
  section?: { name: string };
}

interface PaletteEntry {
  key: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  group: "Actions" | "Tasks";
  run: () => void | Promise<void>;
  /** Secondary action triggered with Shift+Enter */
  alt?: { label: string; run: () => void };
}

export const OPEN_PALETTE_EVENT = "pms:open-palette";
export const REFRESH_EVENT = "pms:refresh";
export const THEME_EVENT = "pms:theme";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const focus = useFocus();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const enabled = pathname !== "/login" && pathname !== "/register";

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  // Global shortcut + custom open event
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [enabled]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Debounced task search
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/items?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) setTasks((data.data.items as TaskResult[]).slice(0, 8));
      } catch {
        /* aborted or offline */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open]);

  const createTask = useCallback(
    async (title: string) => {
      try {
        const secRes = await fetch("/api/sections");
        const secData = await secRes.json();
        const sections: { id: string; name: string }[] = secData?.data?.sections ?? [];
        const target = sections.find((s) => s.name.toLowerCase() === "current") ?? sections[0];
        if (!target) throw new Error("No section available");
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: target.id, title }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to create task");
        toastRef.current.success(`Created "${title}" in ${target.name}`);
        window.dispatchEvent(new Event(REFRESH_EVENT));
        if (pathname !== "/") router.push(`/items/${data.data.item.id}`);
      } catch (err) {
        toastRef.current.error(err instanceof Error ? err.message : "Failed to create task");
      }
    },
    [pathname, router]
  );

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
    void fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    });
  }, []);

  const entries = useMemo<PaletteEntry[]>(() => {
    const q = query.trim();
    const actions: PaletteEntry[] = [];
    if (q) {
      actions.push({
        key: "create",
        label: `Create task “${q}”`,
        hint: "Enter",
        icon: <Plus className="w-4 h-4 text-emerald-500" />,
        group: "Actions",
        run: () => createTask(q),
      });
    }
    actions.push(
      {
        key: "focus",
        label: focus.running ? "Pause focus timer" : "Start focus timer",
        icon: <Timer className="w-4 h-4 text-emerald-500" />,
        group: "Actions",
        run: () => focus.toggle(),
      },
      {
        key: "theme",
        label: "Toggle light / dark theme",
        icon: <Moon className="w-4 h-4 text-indigo-400" />,
        group: "Actions",
        run: toggleTheme,
      },
      {
        key: "dash",
        label: "Go to dashboard",
        icon: <LayoutDashboard className="w-4 h-4 text-sky-500" />,
        group: "Actions",
        run: () => router.push("/dashboard"),
      }
    );
    const filteredActions = q
      ? actions.filter((a) => a.key === "create" || a.label.toLowerCase().includes(q.toLowerCase()))
      : actions;

    const taskEntries: PaletteEntry[] = tasks.map((t) => ({
      key: `task-${t.id}`,
      label: t.title,
      hint: t.section?.name,
      icon: <ArrowRight className="w-4 h-4 text-slate-400" />,
      group: "Tasks",
      run: () => router.push(`/items/${t.id}`),
      alt: {
        label: "Focus on task",
        run: () => {
          focus.start({ id: t.id, title: t.title });
          toastRef.current.info(`Focusing on "${t.title}"`);
        },
      },
    }));
    return [...filteredActions, ...taskEntries];
  }, [query, tasks, focus, createTask, toggleTheme, router]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const execute = (entry: PaletteEntry | undefined, useAlt = false) => {
    if (!entry) return;
    close();
    if (useAlt && entry.alt) entry.alt.run();
    else void entry.run();
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(entries.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(entries[active], e.shiftKey);
    }
  };

  if (!enabled || !open) return null;

  let lastGroup = "";
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4 bg-slate-950/50 backdrop-blur-sm"
      onMouseDown={close}
    >
      <div
        id="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        className="palette-in glass-panel ring-1 ring-white/10 rounded-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/70 dark:border-white/10">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search tasks, or type to create one…"
            aria-label="Search commands and tasks"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400">
            Esc
          </kbd>
        </div>

        <ul role="listbox" className="max-h-[50vh] overflow-y-auto py-1.5">
          {entries.map((entry, i) => {
            const showHeader = entry.group !== lastGroup;
            lastGroup = entry.group;
            return (
              <React.Fragment key={entry.key}>
                {showHeader && (
                  <li className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {entry.group}
                  </li>
                )}
                <li role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => execute(entry)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                      i === active
                        ? "bg-indigo-500/15 text-slate-900 dark:text-white"
                        : "text-slate-700 dark:text-slate-200"
                    )}
                  >
                    {entry.icon}
                    <span className="flex-1 truncate">{entry.label}</span>
                    {entry.hint && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">{entry.hint}</span>
                    )}
                    {i === active && entry.alt && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Crosshair className="w-3 h-3" /> Shift+Enter
                      </span>
                    )}
                    {i === active && !entry.alt && <CornerDownLeft className="w-3 h-3 text-slate-400 shrink-0" />}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
          {entries.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No results</li>
          )}
        </ul>

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/70 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
          <span>↑↓ navigate · Enter select · Shift+Enter focus on task</span>
          <span>Ctrl/⌘ K</span>
        </div>
      </div>
    </div>
  );
}
