import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting Goal migration...");

  const goals = await prisma.sectionItem.findMany({
    where: {
      OR: [
        { id: "cmvgshc8x0001xm0c54iawyoh" },
        { id: "cmvgwclgq002ixm0cu87jmlly" },
      ],
    },
    include: {
      subGoals: {
        include: { tasks: true },
      },
    },
  });

  for (const goal of goals) {
    console.log(`Checking goal: "${goal.title}" (${goal.id})`);

    // Ensure legacy data is preserved in metadata
    let meta = {};
    try {
      meta = goal.metadata ? JSON.parse(goal.metadata) : {};
    } catch {
      meta = {};
    }

    if (goal.content && !meta.legacyContent) {
      meta.legacyContent = goal.content;
      meta.legacyDescription = goal.description;
      meta.legacyDueDate = goal.dueDate;
      meta.migratedAt = new Date().toISOString();

      await prisma.sectionItem.update({
        where: { id: goal.id },
        data: { metadata: JSON.stringify(meta) },
      });
      console.log(`Preserved legacy content for goal "${goal.title}" into metadata.`);
    }

    // Skip if sub-goals already exist
    if (goal.subGoals.length > 0) {
      console.log(`Goal "${goal.title}" already has ${goal.subGoals.length} sub-goals. Skipping creation.`);
      continue;
    }

    // Find daily section for tasks
    const dailySection = await prisma.section.findFirst({
      where: {
        userId: goal.userId,
        name: { in: ["Daily", "Daily Task"] },
      },
    }) || await prisma.section.findFirst({
      where: { userId: goal.userId },
      orderBy: { orderIndex: "asc" },
    });

    const targetSectionId = dailySection ? dailySection.id : goal.sectionId;
    const now = new Date();

    if (goal.id === "cmvgshc8x0001xm0c54iawyoh") {
      // "UOPEOPLE CS"
      const subGoal1 = await prisma.subGoal.create({
        data: {
          goalId: goal.id,
          title: "1st Term (2 Courses: 03/09/2026 - 01/11/2026)",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal1.id,
          title: "Course 1: Complete Assignments & Discussion",
          scheduledDate: now,
          status: "TODO",
          priority: "HIGH",
          itemType: "TASK",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal1.id,
          title: "Course 2: Complete Assignments & Discussion",
          scheduledDate: now,
          status: "TODO",
          priority: "HIGH",
          itemType: "TASK",
          orderIndex: 1,
        },
      });

      const subGoal2 = await prisma.subGoal.create({
        data: {
          goalId: goal.id,
          title: "2nd Term (2 Courses: 03/11/2026 - 01/01/2027)",
          orderIndex: 1,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal2.id,
          title: "Course 3: Complete Coursework",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal2.id,
          title: "Course 4: Complete Coursework",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 1,
        },
      });

      const subGoal3 = await prisma.subGoal.create({
        data: {
          goalId: goal.id,
          title: "3rd - 8th Term (25 Courses)",
          orderIndex: 2,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal3.id,
          title: "Sophia Learning Transfers (11 Courses)",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal3.id,
          title: "Remaining Major Courses (14 Courses)",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 1,
        },
      });

      const subGoal4 = await prisma.subGoal.create({
        data: {
          goalId: goal.id,
          title: "Study Routine & Ratios",
          orderIndex: 3,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal4.id,
          title: "14+6+4=1 Hour Study Ratio",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 0,
        },
      });

      console.log(`Successfully migrated "UOPEOPLE CS" into 4 sub-goals and 7 tasks!`);
    } else if (goal.id === "cmvgwclgq002ixm0cu87jmlly") {
      // "USA PhD (After Graduation)"
      const subGoal = await prisma.subGoal.create({
        data: {
          goalId: goal.id,
          title: "Core Milestones",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal.id,
          title: "Rootixa.com",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 0,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal.id,
          title: "Company Finance Management",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 1,
        },
      });

      await prisma.sectionItem.create({
        data: {
          sectionId: targetSectionId,
          userId: goal.userId,
          subGoalId: subGoal.id,
          title: "Personal Income and Expense System",
          scheduledDate: now,
          status: "TODO",
          priority: "MEDIUM",
          itemType: "TASK",
          orderIndex: 2,
        },
      });

      console.log(`Successfully migrated "USA PhD (After Graduation)" into sub-goal and 3 tasks!`);
    }
  }

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
