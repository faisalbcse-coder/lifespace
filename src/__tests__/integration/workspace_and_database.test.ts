import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/auth";
import { ensureWorkspaceInitialized, DEFAULT_SECTIONS } from "../../lib/workspace";
import { createDatabaseBackup } from "../../lib/backup";
import fs from "fs";

describe("Database & Workspace Integration Tests", () => {
  let testUserId: string;
  let unauthorizedUserId: string;

  beforeAll(async () => {
    // Clean up any existing test accounts
    await db.user.deleteMany({
      where: {
        email: {
          in: ["integration-test@example.com", "unauthorized-user@example.com"],
        },
      },
    });

    const passwordHash = await hashPassword("password123");

    // Create main test user
    const user = await db.user.create({
      data: {
        email: "integration-test@example.com",
        name: "Integration Test User",
        passwordHash,
      },
    });
    testUserId = user.id;

    // Create a second user for authorization boundary testing
    const otherUser = await db.user.create({
      data: {
        email: "unauthorized-user@example.com",
        name: "Unauthorized User",
        passwordHash,
      },
    });
    unauthorizedUserId = otherUser.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await db.user.deleteMany({
        where: { id: { in: [testUserId, unauthorizedUserId] } },
      });
    }
  });

  it("1. should initialize a workspace with the five default sections", async () => {
    const result = await ensureWorkspaceInitialized(testUserId);
    expect(result.initializedCount).toBe(5);

    const sections = await db.section.findMany({
      where: { userId: testUserId },
      orderBy: { orderIndex: "asc" },
    });

    expect(sections.length).toBe(5);
    const names = sections.map((s) => s.name);
    expect(names).toEqual([
      "Current",
      "Next",
      "Skill",
      "Project Parking",
      "Daily",
    ]);
  });

  it("2. should NOT create duplicate default sections when initialization runs repeatedly (idempotency)", async () => {
    const rerunResult = await ensureWorkspaceInitialized(testUserId);
    expect(rerunResult.initializedCount).toBe(0);

    const sections = await db.section.findMany({
      where: { userId: testUserId },
    });
    expect(sections.length).toBe(5);
  });

  it("3. should support creating additional sections up to and exceeding 10 sections", async () => {
    // Add 7 more custom sections to reach 12 total
    for (let i = 1; i <= 7; i++) {
      await db.section.create({
        data: {
          userId: testUserId,
          name: `Custom Section ${i}`,
          orderIndex: 5 + i,
        },
      });
    }

    const allSections = await db.section.findMany({
      where: { userId: testUserId, isArchived: false },
      orderBy: { orderIndex: "asc" },
    });

    expect(allSections.length).toBe(12);
  });

  it("4. should transactionally persist section reordering in SQLite", async () => {
    const userSections = await db.section.findMany({
      where: { userId: testUserId, isArchived: false },
      orderBy: { orderIndex: "asc" },
    });

    // Reverse the section IDs
    const reversedIds = userSections.map((s) => s.id).reverse();

    // Perform transactional update
    await db.$transaction(
      reversedIds.map((id, index) =>
        db.section.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    // Verify ordering after re-querying
    const reordered = await db.section.findMany({
      where: { userId: testUserId, isArchived: false },
      orderBy: { orderIndex: "asc" },
    });

    expect(reordered.map((s) => s.id)).toEqual(reversedIds);
  });

  it("5. should support the full lifecycle of Section Items (Create, Edit, Complete, Reopen, Archive, Restore, Delete)", async () => {
    const section = await db.section.findFirst({
      where: { userId: testUserId },
    });
    expect(section).toBeDefined();
    if (!section) return;

    // Create
    const item = await db.sectionItem.create({
      data: {
        userId: testUserId,
        sectionId: section.id,
        title: "Test Task Lifecycle",
        description: "Initial description",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2026-12-31"),
      },
    });
    expect(item.id).toBeDefined();
    expect(item.completedAt).toBeNull();

    // Edit
    const updated = await db.sectionItem.update({
      where: { id: item.id },
      data: {
        title: "Updated Task Title",
        priority: "URGENT",
      },
    });
    expect(updated.title).toBe("Updated Task Title");
    expect(updated.priority).toBe("URGENT");

    // Complete (should record completedAt timestamp)
    const completed = await db.sectionItem.update({
      where: { id: item.id },
      data: {
        status: "DONE",
        completedAt: new Date(),
      },
    });
    expect(completed.status).toBe("DONE");
    expect(completed.completedAt).not.toBeNull();

    // Reopen (should clear completedAt)
    const reopened = await db.sectionItem.update({
      where: { id: item.id },
      data: {
        status: "TODO",
        completedAt: null,
      },
    });
    expect(reopened.status).toBe("TODO");
    expect(reopened.completedAt).toBeNull();

    // Archive
    const archived = await db.sectionItem.update({
      where: { id: item.id },
      data: { isArchived: true },
    });
    expect(archived.isArchived).toBe(true);

    // Restore
    const restored = await db.sectionItem.update({
      where: { id: item.id },
      data: { isArchived: false },
    });
    expect(restored.isArchived).toBe(false);

    // Delete
    await db.sectionItem.delete({
      where: { id: item.id },
    });
    const found = await db.sectionItem.findUnique({
      where: { id: item.id },
    });
    expect(found).toBeNull();
  });

  it("6. should enforce ownership isolation between users", async () => {
    // Fetch sections owned by testUser
    const testUserSections = await db.section.findMany({
      where: { userId: testUserId },
    });

    // Ensure unauthorized user cannot modify testUser's section
    const targetSection = testUserSections[0];

    const canOtherUserAccess = await db.section.findFirst({
      where: {
        id: targetSection.id,
        userId: unauthorizedUserId,
      },
    });

    expect(canOtherUserAccess).toBeNull();
  });

  it("7. should verify SQLite atomic backup creation with non-zero size", async () => {
    const backupResult = await createDatabaseBackup();
    expect(backupResult.success).toBe(true);
    expect(fs.existsSync(backupResult.filepath)).toBe(true);
    expect(backupResult.sizeBytes).toBeGreaterThan(0);

    // Clean up created test backup file
    if (fs.existsSync(backupResult.filepath)) {
      fs.unlinkSync(backupResult.filepath);
    }
  });

  it("8. should NOT resurrect deleted sections when ensureWorkspaceInitialized runs", async () => {
    // Delete one of the default sections (e.g. "Skill")
    const skillSection = await db.section.findFirst({
      where: { userId: testUserId, name: "Skill" },
    });
    expect(skillSection).not.toBeNull();
    if (skillSection) {
      await db.section.delete({ where: { id: skillSection.id } });
    }

    // Call ensureWorkspaceInitialized again
    const initResult = await ensureWorkspaceInitialized(testUserId);
    expect(initResult.initializedCount).toBe(0);

    // Verify "Skill" was NOT recreated
    const recreated = await db.section.findFirst({
      where: { userId: testUserId, name: "Skill" },
    });
    expect(recreated).toBeNull();
  });
});
