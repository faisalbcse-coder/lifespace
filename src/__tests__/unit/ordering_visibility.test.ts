import { describe, it, expect } from "vitest";

describe("Section Ordering & Visibility Rules (Unit Tests)", () => {
  const mockSections = Array.from({ length: 14 }, (_, i) => ({
    id: `sec_${i + 1}`,
    name: `Section ${i + 1}`,
    orderIndex: i,
    isArchived: i === 12, // sec_13 is archived
    isHidden: i === 13,   // sec_14 is hidden
  }));

  it("should filter out archived and hidden sections from active dashboard view", () => {
    const visible = mockSections.filter((s) => !s.isArchived && !s.isHidden);
    expect(visible.length).toBe(12);
    expect(visible.some((s) => s.id === "sec_13")).toBe(false);
    expect(visible.some((s) => s.id === "sec_14")).toBe(false);
  });

  it("should enforce the initial 10-section limit when visible count > 10 and not expanded", () => {
    const visible = mockSections.filter((s) => !s.isArchived && !s.isHidden);
    const limit = 10;
    const isExpanded = false;

    const displayed = visible.length > limit && !isExpanded ? visible.slice(0, limit) : visible;

    expect(displayed.length).toBe(10);
    expect(displayed[0].id).toBe("sec_1");
    expect(displayed[9].id).toBe("sec_10");
  });

  it("should reveal all visible sections when seeMore is expanded", () => {
    const visible = mockSections.filter((s) => !s.isArchived && !s.isHidden);
    const limit = 10;
    const isExpanded = true;

    const displayed = visible.length > limit && !isExpanded ? visible.slice(0, limit) : visible;

    expect(displayed.length).toBe(12);
    expect(displayed[11].id).toBe("sec_12");
  });

  it("should not show See More control when visible sections count <= 10", () => {
    const smallList = mockSections.slice(0, 5);
    const hasMoreThanLimit = smallList.length > 10;
    expect(hasMoreThanLimit).toBe(false);
  });

  it("should correctly reorder items when moving positions", () => {
    const initialList = ["sec_A", "sec_B", "sec_C", "sec_D"];
    // Move sec_D to index 1
    const fromIndex = 3;
    const toIndex = 1;
    const result = [...initialList];
    const [moved] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, moved);

    expect(result).toEqual(["sec_A", "sec_D", "sec_B", "sec_C"]);
    expect(result.length).toBe(4);
  });
});

import { sortSections, sortGoals, sortTargets, sortTasks, sortSectionItems } from "@/lib/ordering";

describe("Section, Goal, Target & Task Ordering Rules", () => {
  it("1. Section Ordering: preserves custom orderIndex and falls back to creation time oldest first", () => {
    const sections = [
      { id: "s3", name: "Skill", orderIndex: 2, createdAt: "2026-10-03T00:00:00Z" },
      { id: "s1", name: "Current", orderIndex: 0, createdAt: "2026-10-01T00:00:00Z" },
      { id: "s2", name: "Next", orderIndex: 1, createdAt: "2026-10-02T00:00:00Z" },
      { id: "s_new", name: "Newly Created", orderIndex: 3, createdAt: "2026-10-25T00:00:00Z" },
    ];

    const sorted = sortSections(sections);
    expect(sorted.map((s) => s.id)).toEqual(["s1", "s2", "s3", "s_new"]);
    // Sequential 1-based order numbers
    expect(sorted.map((_, idx) => idx + 1)).toEqual([1, 2, 3, 4]);
  });

  it("1b. Section Ordering: falls back to oldest first when orderIndex is equal", () => {
    const sections = [
      { id: "s_newer", orderIndex: 0, createdAt: "2026-10-05T00:00:00Z" },
      { id: "s_older", orderIndex: 0, createdAt: "2026-10-01T00:00:00Z" },
    ];
    const sorted = sortSections(sections);
    expect(sorted[0].id).toBe("s_older");
    expect(sorted[1].id).toBe("s_newer");
  });

  it("2. Goal Ordering: strictly sorts by creation time, oldest first, ignoring manual orderIndex", () => {
    const goals = [
      { id: "g3", title: "Goal 3", createdAt: "2026-10-15T12:00:00Z", orderIndex: 0 },
      { id: "g1", title: "Goal 1", createdAt: "2026-10-01T08:00:00Z", orderIndex: 5 },
      { id: "g2", title: "Goal 2", createdAt: "2026-10-05T10:00:00Z", orderIndex: 2 },
    ];

    const sorted = sortGoals(goals);
    expect(sorted.map((g) => g.id)).toEqual(["g1", "g2", "g3"]);
  });

  it("3. Target Ordering: strictly sorts targets within a goal by creation time, oldest first", () => {
    const targets = [
      { id: "t_term2", title: "2nd Term", createdAt: "2026-10-20T00:00:00Z" },
      { id: "t_term1", title: "1st Term", createdAt: "2026-09-01T00:00:00Z" },
      { id: "t_term3", title: "3rd Term", createdAt: "2026-10-25T00:00:00Z" },
    ];

    const sorted = sortTargets(targets);
    expect(sorted.map((t) => t.id)).toEqual(["t_term1", "t_term2", "t_term3"]);
  });

  it("4. Task Ordering: sorts by scheduled date and time earliest first, with unscheduled tasks at the bottom (oldest first)", () => {
    const tasks = [
      { id: "task_unscheduled_new", title: "No date (new)", scheduledDate: null, startTime: null, createdAt: "2026-10-24T00:00:00Z" },
      { id: "task_today_afternoon", title: "Today afternoon", scheduledDate: "2026-10-25T00:00:00.000Z", startTime: "14:00", createdAt: "2026-10-20T00:00:00Z" },
      { id: "task_tomorrow", title: "Tomorrow", scheduledDate: "2026-10-26T00:00:00.000Z", startTime: "09:00", createdAt: "2026-10-10T00:00:00Z" },
      { id: "task_today_morning", title: "Today morning", scheduledDate: "2026-10-25T00:00:00.000Z", startTime: "09:30", createdAt: "2026-10-21T00:00:00Z" },
      { id: "task_today_notime", title: "Today no time", scheduledDate: "2026-10-25T00:00:00.000Z", startTime: null, createdAt: "2026-10-22T00:00:00Z" },
      { id: "task_unscheduled_old", title: "No date (old)", scheduledDate: null, startTime: null, createdAt: "2026-10-01T00:00:00Z" },
    ];

    const sorted = sortTasks(tasks);
    expect(sorted.map((t) => t.id)).toEqual([
      "task_today_morning",   // 2026-10-25 09:30
      "task_today_afternoon", // 2026-10-25 14:00
      "task_today_notime",    // 2026-10-25 without time
      "task_tomorrow",        // 2026-10-26
      "task_unscheduled_old", // Unscheduled oldest (Oct 1)
      "task_unscheduled_new", // Unscheduled newer (Oct 24)
    ]);
  });

  it("4b. Task Ordering: position automatically updates when scheduled date or time changes", () => {
    const taskA = { id: "task_a", scheduledDate: "2026-10-25T00:00:00.000Z", startTime: "10:00", createdAt: "2026-10-01T00:00:00Z" };
    const taskB = { id: "task_b", scheduledDate: "2026-10-25T00:00:00.000Z", startTime: "12:00", createdAt: "2026-10-01T00:00:00Z" };

    // Initially taskA (10:00) is before taskB (12:00)
    let sorted = sortTasks([taskB, taskA]);
    expect(sorted.map((t) => t.id)).toEqual(["task_a", "task_b"]);

    // Update taskA time to 15:00 -> automatically moves after taskB
    const updatedTaskA = { ...taskA, startTime: "15:00" };
    sorted = sortTasks([taskB, updatedTaskA]);
    expect(sorted.map((t) => t.id)).toEqual(["task_b", "task_a"]);
  });

  it("5. sortSectionItems: applies Goal ordering for GOAL sections and Task ordering for TASK sections", () => {
    const goalA = { id: "g_old", itemType: "GOAL", createdAt: "2026-10-01T00:00:00Z" };
    const goalB = { id: "g_new", itemType: "GOAL", createdAt: "2026-10-10T00:00:00Z" };
    const sortedGoals = sortSectionItems([goalB, goalA], true);
    expect(sortedGoals.map((g) => g.id)).toEqual(["g_old", "g_new"]);

    const taskA = { id: "t_early", scheduledDate: "2026-10-20T00:00:00.000Z", createdAt: "2026-10-10T00:00:00Z" };
    const taskB = { id: "t_late", scheduledDate: "2026-10-25T00:00:00.000Z", createdAt: "2026-10-01T00:00:00Z" };
    const sortedTasks = sortSectionItems([taskB, taskA], false);
    expect(sortedTasks.map((t) => t.id)).toEqual(["t_early", "t_late"]);
  });
});

