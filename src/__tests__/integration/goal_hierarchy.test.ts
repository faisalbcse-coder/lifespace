import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/auth";
import { ensureWorkspaceInitialized } from "../../lib/workspace";
import { calculateSubGoalProgress, calculateGoalProgress } from "../../lib/goals";
import { parseDateKey, todayKey, addDaysToKey, toDateKey } from "../../lib/dates";

const TEST_EMAIL = "goal-hierarchy-test@example.com";

describe("Goal -> Sub-Goal -> Task -> Daily Section Hierarchy System", () => {
  let userId: string;
  let goalSectionId: string;
  let dailySectionId: string;
  let goalId: string;

  beforeAll(async () => {
    await db.user.deleteMany({ where: { email: TEST_EMAIL } });
    const user = await db.user.create({
      data: {
        email: TEST_EMAIL,
        name: "Goal Hierarchy Tester",
        passwordHash: await hashPassword("password123"),
      },
    });
    userId = user.id;
    await ensureWorkspaceInitialized(userId);

    const goalSection = await db.section.findFirst({
      where: { userId, name: { in: ["Skill", "Goals", "Project Parking"] } },
    });
    goalSectionId = goalSection!.id;

    const dailySection = await db.section.findFirst({
      where: { userId, name: "Daily" },
    });
    dailySectionId = dailySection!.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  it("1. Goal creation: creates a Goal with title and minimal metadata", async () => {
    const goal = await db.sectionItem.create({
      data: {
        userId,
        sectionId: goalSectionId,
        title: "UoPeople CS",
        itemType: "GOAL",
        status: "TODO",
        priority: "MEDIUM",
      },
    });

    expect(goal).toBeDefined();
    expect(goal.title).toBe("UoPeople CS");
    expect(goal.itemType).toBe("GOAL");
    goalId = goal.id;
  });

  it("2. Sub-Goal CRUD: creates, renames, and manages Sub-Goals under parent Goal", async () => {
    const sg1 = await db.subGoal.create({
      data: {
        goalId,
        title: "Complete First Term",
        orderIndex: 0,
        collapsed: false,
      },
    });

    const sg2 = await db.subGoal.create({
      data: {
        goalId,
        title: "Complete Second Term",
        orderIndex: 1,
        collapsed: false,
      },
    });

    expect(sg1.goalId).toBe(goalId);
    expect(sg2.goalId).toBe(goalId);

    // Rename
    const renamed = await db.subGoal.update({
      where: { id: sg1.id },
      data: { title: "Complete Term 1: CS 1101 & UNIV 1001" },
    });
    expect(renamed.title).toBe("Complete Term 1: CS 1101 & UNIV 1001");

    // Toggle collapse
    const collapsed = await db.subGoal.update({
      where: { id: sg1.id },
      data: { collapsed: true },
    });
    expect(collapsed.collapsed).toBe(true);
  });

  it("3. Task creation: creates dated tasks strictly under a Sub-Goal with target section Daily", async () => {
    const sg = await db.subGoal.findFirst({ where: { goalId } });
    expect(sg).toBeDefined();

    const taskDate = parseDateKey(todayKey());

    const task1 = await db.sectionItem.create({
      data: {
        userId,
        sectionId: dailySectionId,
        subGoalId: sg!.id,
        title: "Complete CS 1101 Assignment 1",
        scheduledDate: taskDate,
        status: "TODO",
        priority: "MEDIUM",
        itemType: "TASK",
      },
    });

    const task2 = await db.sectionItem.create({
      data: {
        userId,
        sectionId: dailySectionId,
        subGoalId: sg!.id,
        title: "Complete UNIV 1001 Discussion Forum",
        scheduledDate: taskDate,
        status: "TODO",
        priority: "MEDIUM",
        itemType: "TASK",
      },
    });

    expect(task1.subGoalId).toBe(sg!.id);
    expect(task2.subGoalId).toBe(sg!.id);
    expect(task1.sectionId).toBe(dailySectionId);
    expect(toDateKey(task1.scheduledDate!)).toBe(todayKey());
  });

  it("4. Automatic Daily Section integration: task appears in Daily planner for assigned date", async () => {
    const sg = await db.subGoal.findFirst({ where: { goalId } });
    const today = todayKey();

    // Query Daily planner tasks for today (matching SectionGrid's getDailyItems logic)
    const dailyItems = await db.sectionItem.findMany({
      where: {
        userId,
        isArchived: false,
        scheduledDate: parseDateKey(today),
      },
      include: {
        subGoal: {
          include: {
            goal: true,
          },
        },
      },
    });

    const subGoalTasksInDaily = dailyItems.filter((i) => i.subGoalId === sg!.id);
    expect(subGoalTasksInDaily.length).toBe(2);

    // Verify parent Goal and Sub-Goal metadata is attached
    expect(subGoalTasksInDaily[0].subGoal).toBeDefined();
    expect(subGoalTasksInDaily[0].subGoal!.title).toBe("Complete Term 1: CS 1101 & UNIV 1001");
    expect(subGoalTasksInDaily[0].subGoal!.goal.title).toBe("UoPeople CS");
  });

  it("5. Status synchronization: completing a task from Daily section updates it in Sub-Goal and vice versa", async () => {
    const task = await db.sectionItem.findFirst({
      where: { userId, title: "Complete CS 1101 Assignment 1" },
    });
    expect(task).toBeDefined();

    // Mark task as done in database (single record!)
    const updated = await db.sectionItem.update({
      where: { id: task!.id },
      data: { status: "DONE", completedAt: new Date() },
    });
    expect(updated.status).toBe("DONE");

    // Verify when querying via Goal hierarchy
    const goalWithHierarchy = await db.sectionItem.findUnique({
      where: { id: goalId },
      include: {
        subGoals: {
          include: {
            tasks: true,
          },
        },
      },
    });

    const foundTaskInHierarchy = goalWithHierarchy?.subGoals
      .flatMap((s) => s.tasks)
      .find((t) => t.id === task!.id);

    expect(foundTaskInHierarchy?.status).toBe("DONE");
  });

  it("6. Automatic Progress calculation: Sub-Goal and Goal progress calculate from descendant tasks", async () => {
    const subGoals = await db.subGoal.findMany({
      where: { goalId },
      include: { tasks: true },
    });

    // sg1 has 2 tasks, 1 DONE => 50%
    const sg1 = subGoals.find((s) => s.title.includes("Term 1"))!;
    const sg1Progress = calculateSubGoalProgress(sg1.tasks);
    expect(sg1Progress.totalTasks).toBe(2);
    expect(sg1Progress.completedTasks).toBe(1);
    expect(sg1Progress.percentage).toBe(50);

    // sg2 has 0 tasks => neutral empty state (percentage: null)
    const sg2 = subGoals.find((s) => s.title.includes("Second Term"))!;
    const sg2Progress = calculateSubGoalProgress(sg2.tasks);
    expect(sg2Progress.totalTasks).toBe(0);
    expect(sg2Progress.completedTasks).toBe(0);
    expect(sg2Progress.percentage).toBeNull();

    // Goal overall progress: 1 completed out of 2 total descendant tasks => 50%
    const goalProgress = calculateGoalProgress(subGoals);
    expect(goalProgress.totalTasks).toBe(2);
    expect(goalProgress.completedTasks).toBe(1);
    expect(goalProgress.percentage).toBe(50);

    // When all tasks complete => 100%
    const remainingTask = sg1.tasks.find((t) => t.status === "TODO")!;
    await db.sectionItem.update({
      where: { id: remainingTask.id },
      data: { status: "DONE" },
    });

    const refreshedSubGoals = await db.subGoal.findMany({
      where: { goalId },
      include: { tasks: true },
    });
    const refreshedGoalProgress = calculateGoalProgress(refreshedSubGoals);
    expect(refreshedGoalProgress.percentage).toBe(100);
  });

  it("7. Rescheduling: changing task date moves it to new date in Daily section", async () => {
    const task = await db.sectionItem.findFirst({
      where: { userId, title: "Complete CS 1101 Assignment 1" },
    });
    const tomorrow = addDaysToKey(todayKey(), 1);

    await db.sectionItem.update({
      where: { id: task!.id },
      data: { scheduledDate: parseDateKey(tomorrow) },
    });

    // Query for today: should no longer include this task
    const todayTasks = await db.sectionItem.findMany({
      where: { userId, scheduledDate: parseDateKey(todayKey()) },
    });
    expect(todayTasks.some((t) => t.id === task!.id)).toBe(false);

    // Query for tomorrow: should now include this task
    const tomorrowTasks = await db.sectionItem.findMany({
      where: { userId, scheduledDate: parseDateKey(tomorrow) },
    });
    expect(tomorrowTasks.some((t) => t.id === task!.id)).toBe(true);
  });

  it("8. Cascade deletion: deleting a Sub-Goal removes its descendant tasks", async () => {
    const sg = await db.subGoal.findFirst({ where: { goalId } });
    expect(sg).toBeDefined();

    // Delete sub-goal
    await db.subGoal.delete({ where: { id: sg!.id } });

    // Descendant tasks should be cascade deleted
    const orphanTasks = await db.sectionItem.findMany({
      where: { subGoalId: sg!.id },
    });
    expect(orphanTasks.length).toBe(0);
  });

  it("9. Cascade deletion: deleting a Goal removes all sub-goals and descendant tasks", async () => {
    // Delete goal
    await db.sectionItem.delete({ where: { id: goalId } });

    // Associated subgoals should be deleted
    const remainingSubGoals = await db.subGoal.findMany({
      where: { goalId },
    });
    expect(remainingSubGoals.length).toBe(0);
  });
});
