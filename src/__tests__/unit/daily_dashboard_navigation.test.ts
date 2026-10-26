import { describe, it, expect } from "vitest";
import { isDailySection } from "../../components/dashboard/SectionGrid";
import { calculateGoalProgress, getSectionKind, getItemGoalDates, formatGoalRange, isGoalItem, calculateDaysLeft } from "../../lib/goals";
import { toDateKey, todayKey, addDaysToKey } from "../../lib/dates";
import { Section, Item } from "../../types";
import { CreateItemSchema, UpdateItemSchema } from "../../lib/validators";

describe("Daily Dashboard & Navigation Logic", () => {
  it("correctly identifies daily sections regardless of case or suffix", () => {
    expect(isDailySection({ name: "Daily" } as Section)).toBe(true);
    expect(isDailySection({ name: "daily task" } as Section)).toBe(true);
    expect(isDailySection({ name: "Daily Tasks" } as Section)).toBe(true);
    expect(isDailySection({ name: "Now" } as Section)).toBe(false);
    expect(isDailySection({ name: "Next" } as Section)).toBe(false);
    expect(isDailySection({ name: "Skill" } as Section)).toBe(false);
  });

  it("filters candidate tasks for a given date excluding top-level goals", () => {
    const today = todayKey();
    const tomorrow = addDaysToKey(today, 1);

    const mockSections = [
      {
        id: "sec-daily",
        userId: "u1",
        name: "Daily Task",
        color: "#6366f1",
        position: 0,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: "task-1",
            sectionId: "sec-daily",
            title: "Brush teeth",
            priority: "MEDIUM",
            status: "TODO",
            itemType: "TASK",
            scheduledDate: today,
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "task-2",
            sectionId: "sec-daily",
            title: "Review notes",
            priority: "HIGH",
            status: "DONE",
            itemType: "TASK",
            scheduledDate: tomorrow,
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "sec-goals",
        userId: "u1",
        name: "Now",
        color: "#10b981",
        position: 1,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          // Top-level Goal
          {
            id: "goal-1",
            sectionId: "sec-goals",
            title: "UoPeople CS",
            priority: "MEDIUM",
            status: "TODO",
            itemType: "GOAL",
            scheduledDate: today, // even if it has a date, top-level goal shouldn't be rendered as daily checklist
            subGoals: [{ id: "sub-1", goalId: "goal-1", title: "Term 1", orderIndex: 0, createdAt: "", updatedAt: "" }],
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Sub-goal Task scheduled for today
          {
            id: "task-sub-1",
            sectionId: "sec-goals",
            subGoalId: "sub-1",
            title: "Complete CS1101 Assignment 1",
            priority: "HIGH",
            status: "TODO",
            itemType: "TASK",
            scheduledDate: today,
            subGoal: { id: "sub-1", title: "Term 1", goal: { id: "goal-1", title: "UoPeople CS" } },
            isArchived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ] as unknown as Section[];

    // Simulate DailyPlannerView filtering logic for today
    const allCandidateItems = mockSections
      .filter((s) => !s.isArchived)
      .flatMap((s) => s.items || []);

    const todayTasks = allCandidateItems.filter((item) => {
      if (item.isArchived) return false;
      if (!item.subGoalId && (item.itemType === "GOAL" || (item.subGoals && item.subGoals.length > 0))) {
        return false;
      }
      if (item.scheduledDate) {
        return toDateKey(item.scheduledDate) === today;
      }
      return true;
    });

    expect(todayTasks.map((t) => t.id)).toEqual(["task-1", "task-sub-1"]);
    // Sub-goal task has parent context
    const sgTask = todayTasks.find((t) => t.id === "task-sub-1");
    expect(sgTask?.subGoal?.title).toBe("Term 1");
    expect(sgTask?.subGoal?.goal?.title).toBe("UoPeople CS");
  });

  it("calculates goal hub statistics across all goal sections accurately", () => {
    const subGoals = [
      {
        id: "sg-1",
        goalId: "g-1",
        title: "SubGoal 1",
        position: 0,
        createdAt: "",
        updatedAt: "",
        tasks: [
          { id: "t1", status: "DONE" as const },
          { id: "t2", status: "TODO" as const },
        ],
      },
      {
        id: "sg-2",
        goalId: "g-1",
        title: "SubGoal 2",
        position: 1,
        createdAt: "",
        updatedAt: "",
        tasks: [
          { id: "t3", status: "DONE" as const },
          { id: "t4", status: "DONE" as const },
        ],
      },
    ];

    const progress = calculateGoalProgress(subGoals);
    expect(progress.totalTasks).toBe(4);
    expect(progress.completedTasks).toBe(3);
    expect(progress.percentage).toBe(75);
  });

  it("extracts and formats Target and Goal Start/End date ranges properly", () => {
    // Goal or Target with startDate and endDate
    const dates = getItemGoalDates({
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-12-15T00:00:00.000Z",
    });
    expect(dates.startDate).toBe("2026-11-01");
    expect(dates.endDate).toBe("2026-12-15");

    const formatted = formatGoalRange(dates.startDate, dates.endDate);
    expect(formatted).toBe("Sun, Nov 1 – Tue, Dec 15");

    const futureKey = addDaysToKey(todayKey(), 10);
    const daysLeftFuture = calculateDaysLeft(futureKey);
    expect(daysLeftFuture?.daysLeft).toBe(10);
    expect(daysLeftFuture?.label).toBe("10 days left");
    expect(daysLeftFuture?.isOverdue).toBe(false);

    const overdueKey = addDaysToKey(todayKey(), -2);
    const daysLeftOverdue = calculateDaysLeft(overdueKey);
    expect(daysLeftOverdue?.daysLeft).toBe(-2);
    expect(daysLeftOverdue?.label).toBe("2 days overdue");
    expect(daysLeftOverdue?.isOverdue).toBe(true);

    const todayDaysLeft = calculateDaysLeft(todayKey());
    expect(todayDaysLeft?.daysLeft).toBe(0);
    expect(todayDaysLeft?.label).toBe("Ends today");
  });

  it("filters overdue Due Tasks accurately from past dates and excludes done tasks", () => {
    const today = todayKey();
    const pastDate = addDaysToKey(today, -3);
    const futureDate = addDaysToKey(today, 2);

    const items = [
      {
        id: "due-task-1",
        title: "Overdue report",
        status: "TODO",
        scheduledDate: pastDate,
        isArchived: false,
      },
      {
        id: "completed-past-task",
        title: "Finished essay",
        status: "DONE",
        scheduledDate: pastDate,
        isArchived: false,
      },
      {
        id: "today-task",
        title: "Today's workout",
        status: "TODO",
        scheduledDate: today,
        isArchived: false,
      },
      {
        id: "future-task",
        title: "Future meeting",
        status: "TODO",
        scheduledDate: futureDate,
        isArchived: false,
      },
    ] as Item[];

    const dueTasks = items.filter((item) => {
      if (item.isArchived || item.status === "DONE") return false;
      const dateKey = item.scheduledDate ? toDateKey(item.scheduledDate) : null;
      if (!dateKey) return false;
      return dateKey < today;
    });

    expect(dueTasks.map((t) => t.id)).toEqual(["due-task-1"]);
    expect(dueTasks[0].title).toBe("Overdue report");
  });

  it("validates task with date, startTime, endTime, and progress percentage", () => {
    const validCreate = CreateItemSchema.safeParse({
      sectionId: "sec-1",
      title: "Math Lecture",
      scheduledDate: "2026-10-25",
      startTime: "09:30",
      endTime: "11:00",
      progress: 40,
    });
    expect(validCreate.success).toBe(true);
    if (validCreate.success) {
      expect(validCreate.data.startTime).toBe("09:30");
      expect(validCreate.data.endTime).toBe("11:00");
      expect(validCreate.data.progress).toBe(40);
    }

    const validUpdate = UpdateItemSchema.safeParse({
      progress: 100,
      startTime: "10:00",
      endTime: "12:00",
      description: "Finished chapter 1 exercises",
    });
    expect(validUpdate.success).toBe(true);
  });

  it("accurately identifies Goals in Section -> Goal -> Target -> Task hierarchy using isGoalItem", () => {
    // Goal in any section (e.g. Current, Next, Career)
    const goalItem: Partial<Item> = {
      id: "goal-1",
      sectionId: "sec-career",
      title: "Become Full Stack Engineer",
      itemType: "GOAL",
      startDate: "2026-10-01",
      endDate: "2026-12-31",
      section: { id: "sec-career", name: "Career", color: "indigo" },
    };
    expect(isGoalItem(goalItem as Item)).toBe(true);

    // Goal identified by subGoals array
    const goalWithSubGoals: Partial<Item> = {
      id: "goal-2",
      sectionId: "sec-current",
      title: "Health & Fitness",
      itemType: "TASK", // even if legacy itemType was TASK, presence of subGoals makes it a Goal
      subGoals: [{ id: "target-1", goalId: "goal-2", title: "Target 1", orderIndex: 0, collapsed: false, createdAt: "", updatedAt: "" }],
      section: { id: "sec-current", name: "Current", color: "emerald" },
    };
    expect(isGoalItem(goalWithSubGoals as Item)).toBe(true);

    // Child task under a Target (has subGoalId) is NEVER a Goal
    const childTaskUnderTarget: Partial<Item> = {
      id: "task-child-1",
      sectionId: "sec-career",
      subGoalId: "target-1",
      title: "Complete Module 3",
      itemType: "TASK",
      section: { id: "sec-career", name: "Career", color: "indigo" },
    };
    expect(isGoalItem(childTaskUnderTarget as Item)).toBe(false);

    // Normal task in a regular section
    const normalTask: Partial<Item> = {
      id: "task-normal",
      sectionId: "sec-daily",
      title: "Buy groceries",
      itemType: "TASK",
      section: { id: "sec-daily", name: "Daily", color: "indigo" },
    };
    expect(isGoalItem(normalTask as Item)).toBe(false);
  });
});


