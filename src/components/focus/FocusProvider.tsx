"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type FocusMode = "focus" | "break";

export const FOCUS_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

interface PersistedState {
  mode: FocusMode;
  /** epoch ms when the running timer ends; null when paused */
  endAt: number | null;
  /** seconds left while paused */
  remaining: number;
  taskId: string | null;
  taskTitle: string | null;
}

interface FocusContextValue {
  mode: FocusMode;
  remaining: number;
  running: boolean;
  taskId: string | null;
  taskTitle: string | null;
  /** True while a focus session is actively counting down */
  isFocusActive: boolean;
  start: (task?: { id: string; title: string }) => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  switchMode: (mode: FocusMode) => void;
  linkTask: (task: { id: string; title: string } | null) => void;
}

const STORAGE_KEY = "pms_focus_timer_v1";
const FocusContext = createContext<FocusContextValue | undefined>(undefined);

const durationFor = (mode: FocusMode) => (mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [state, setState] = useState<PersistedState>({
    mode: "focus",
    endAt: null,
    remaining: FOCUS_SECONDS,
    taskId: null,
    taskTitle: null,
  });
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted timer after mount (avoids SSR/hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as PersistedState);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const running = state.endAt !== null;

  // Tick once per second while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => clearInterval(id);
  }, [running]);

  const remaining = running
    ? Math.max(0, Math.ceil((state.endAt! - now) / 1000))
    : state.remaining;

  // Session finished -> switch to the other mode (paused) and notify
  useEffect(() => {
    if (!running || remaining > 0) return;
    const finishedFocus = state.mode === "focus";
    const nextMode: FocusMode = finishedFocus ? "break" : "focus";
    setState((s) => ({ ...s, mode: nextMode, endAt: null, remaining: durationFor(nextMode) }));
    toastRef.current.success(
      finishedFocus ? "Focus session complete — take a 5 minute break." : "Break over — ready for the next focus session?"
    );
  }, [running, remaining, state.mode]);

  // Reflect the timer in the tab title while running
  useEffect(() => {
    if (!running) return;
    const original = document.title;
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    document.title = `${mm}:${ss} · ${state.mode === "focus" ? "Focus" : "Break"}`;
    return () => {
      document.title = original;
    };
  }, [running, remaining, state.mode]);

  const start = useCallback((task?: { id: string; title: string }) => {
    setState((s) => ({
      ...s,
      ...(task ? { taskId: task.id, taskTitle: task.title } : {}),
      endAt: s.endAt ?? Date.now() + s.remaining * 1000,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((s) =>
      s.endAt === null
        ? s
        : { ...s, endAt: null, remaining: Math.max(1, Math.ceil((s.endAt - Date.now()) / 1000)) }
    );
  }, []);

  const toggle = useCallback(() => {
    setState((s) =>
      s.endAt === null
        ? { ...s, endAt: Date.now() + s.remaining * 1000 }
        : { ...s, endAt: null, remaining: Math.max(1, Math.ceil((s.endAt - Date.now()) / 1000)) }
    );
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, endAt: null, remaining: durationFor(s.mode) }));
  }, []);

  const switchMode = useCallback((mode: FocusMode) => {
    setState((s) => ({ ...s, mode, endAt: null, remaining: durationFor(mode) }));
  }, []);

  const linkTask = useCallback((task: { id: string; title: string } | null) => {
    setState((s) => ({ ...s, taskId: task?.id ?? null, taskTitle: task?.title ?? null }));
  }, []);

  const value = useMemo<FocusContextValue>(
    () => ({
      mode: state.mode,
      remaining,
      running,
      taskId: state.taskId,
      taskTitle: state.taskTitle,
      isFocusActive: running && state.mode === "focus",
      start,
      pause,
      toggle,
      reset,
      switchMode,
      linkTask,
    }),
    [state.mode, state.taskId, state.taskTitle, remaining, running, start, pause, toggle, reset, switchMode, linkTask]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within FocusProvider");
  return ctx;
}
