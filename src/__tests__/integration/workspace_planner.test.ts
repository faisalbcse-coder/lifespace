import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/auth";
import { ensureWorkspaceInitialized } from "../../lib/workspace";
import { recalculateItemProgress, rolloverOverdueDailyTasks } from "../../lib/planner";
import { createFileAttachment, createLinkAttachment, deleteAttachment, AttachmentError } from "../../lib/attachments";
import { deleteItemUploads, itemUploadDir } from "../../lib/uploads";
import { addDaysToKey, parseDateKey, todayKey, startOfToday } from "../../lib/dates";

const EMAIL = "workspace-planner-test@example.com";

describe("Deep workspace & daily planner integration", () => {
  let userId: string;
  let sectionId: string;
  const createdItemIds: string[] = [];

  const makeItem = async (data: Record<string, unknown> = {}) => {
    const item = await db.sectionItem.create({
      data: { userId, sectionId, title: "Planner test item", ...data },
    });
    createdItemIds.push(item.id);
    return item;
  };

  beforeAll(async () => {
    await db.user.deleteMany({ where: { email: EMAIL } });
    const user = await db.user.create({
      data: { email: EMAIL, name: "Planner Tester", passwordHash: await hashPassword("password123") },
    });
    userId = user.id;
    await ensureWorkspaceInitialized(userId);
    const section = await db.section.findFirst({ where: { userId, name: "Daily" } });
    sectionId = section!.id;
  });

  afterAll(async () => {
    for (const id of createdItemIds) await deleteItemUploads(id);
    await db.user.deleteMany({ where: { email: EMAIL } });
  });

  describe("sub-tasks & progress", () => {
    it("computes progress from completed/total sub-tasks", async () => {
      const item = await makeItem();
      const subs = await Promise.all(
        ["a", "b", "c", "d"].map((title, i) =>
          db.subTask.create({ data: { itemId: item.id, title, orderIndex: i } })
        )
      );
      expect(await recalculateItemProgress(item.id)).toBe(0);

      await db.subTask.update({ where: { id: subs[0].id }, data: { isCompleted: true } });
      expect(await recalculateItemProgress(item.id)).toBe(25);
      expect((await db.sectionItem.findUnique({ where: { id: item.id } }))!.progress).toBe(25);

      await db.subTask.updateMany({ where: { itemId: item.id }, data: { isCompleted: true } });
      expect(await recalculateItemProgress(item.id)).toBe(100);
    });

    it("keeps manual progress when there are no sub-tasks", async () => {
      const item = await makeItem({ progress: 40 });
      expect(await recalculateItemProgress(item.id)).toBeNull();
      expect((await db.sectionItem.findUnique({ where: { id: item.id } }))!.progress).toBe(40);
    });

    it("cascades sub-task deletion with the parent item", async () => {
      const item = await makeItem();
      const sub = await db.subTask.create({ data: { itemId: item.id, title: "x" } });
      await db.sectionItem.delete({ where: { id: item.id } });
      expect(await db.subTask.findUnique({ where: { id: sub.id } })).toBeNull();
    });
  });

  describe("attachments", () => {
    it("stores a PDF upload on disk and records metadata", async () => {
      const item = await makeItem();
      const buffer = Buffer.from("%PDF-1.4 test");
      const att = await createFileAttachment({
        itemId: item.id,
        filename: "spec sheet.pdf",
        declaredMime: "application/pdf",
        buffer,
      });
      expect(att.type).toBe("PDF");
      expect(att.mimeType).toBe("application/pdf");
      expect(att.fileSize).toBe(buffer.length);
      expect(att.url.startsWith(`/api/uploads/${item.id}/`)).toBe(true);

      const stored = path.join(itemUploadDir(item.id), att.url.split("/").pop()!);
      expect(fs.existsSync(stored)).toBe(true);

      await deleteAttachment(att.id);
      expect(fs.existsSync(stored)).toBe(false);
      expect(await db.itemAttachment.findUnique({ where: { id: att.id } })).toBeNull();
    });

    it("classifies images and rejects unsupported/executable types", async () => {
      const item = await makeItem();
      const img = await createFileAttachment({
        itemId: item.id,
        filename: "diagram.PNG",
        declaredMime: "image/png",
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      });
      expect(img.type).toBe("IMAGE");

      await expect(
        createFileAttachment({
          itemId: item.id,
          filename: "malware.exe",
          declaredMime: "application/octet-stream",
          buffer: Buffer.from("x"),
        })
      ).rejects.toBeInstanceOf(AttachmentError);
      await expect(
        createFileAttachment({
          itemId: item.id,
          filename: "vector.svg",
          declaredMime: "image/svg+xml",
          buffer: Buffer.from("<svg/>"),
        })
      ).rejects.toBeInstanceOf(AttachmentError);
    });

    it("creates LINK attachments without touching disk", async () => {
      const item = await makeItem();
      const link = await createLinkAttachment({
        itemId: item.id,
        title: "Docs",
        url: "https://example.com/docs",
      });
      expect(link.type).toBe("LINK");
      expect(link.fileSize).toBeNull();
      expect(fs.existsSync(itemUploadDir(item.id))).toBe(false);
    });
  });

  describe("progress logs", () => {
    it("creates chronological logs with a progress snapshot", async () => {
      const item = await makeItem({ progress: 60 });
      await db.progressLog.create({
        data: { itemId: item.id, note: "Started", progressSnapshot: 10, createdAt: new Date("2026-01-01") },
      });
      await db.progressLog.create({
        data: { itemId: item.id, note: "API integration done", progressSnapshot: 60 },
      });
      const logs = await db.progressLog.findMany({
        where: { itemId: item.id },
        orderBy: { createdAt: "desc" },
      });
      expect(logs.map((l) => l.note)).toEqual(["API integration done", "Started"]);
      expect(logs[0].progressSnapshot).toBe(60);
    });
  });

  describe("daily rollover", () => {
    it("rolls incomplete overdue tasks to today and increments rolloverCount, leaving DONE tasks", async () => {
      const yesterday = parseDateKey(addDaysToKey(todayKey(), -1))!;
      const threeDaysAgo = parseDateKey(addDaysToKey(todayKey(), -3))!;
      const tomorrow = parseDateKey(addDaysToKey(todayKey(), 1))!;

      const todo = await makeItem({ status: "TODO", scheduledDate: yesterday });
      const inProgress = await makeItem({ status: "IN_PROGRESS", scheduledDate: threeDaysAgo, rolloverCount: 1 });
      const done = await makeItem({ status: "DONE", scheduledDate: yesterday, completedAt: new Date() });
      const archived = await makeItem({ status: "TODO", scheduledDate: yesterday, isArchived: true });
      const future = await makeItem({ status: "TODO", scheduledDate: tomorrow });
      const unscheduled = await makeItem({ status: "TODO" });

      const count = await rolloverOverdueDailyTasks(userId);
      expect(count).toBe(2);

      const today = startOfToday().getTime();
      const reload = (id: string) => db.sectionItem.findUnique({ where: { id } });

      const t = (await reload(todo.id))!;
      expect(t.scheduledDate!.getTime()).toBe(today);
      expect(t.rolloverCount).toBe(1);

      const p = (await reload(inProgress.id))!;
      expect(p.scheduledDate!.getTime()).toBe(today);
      expect(p.rolloverCount).toBe(2);

      const d = (await reload(done.id))!;
      expect(d.scheduledDate!.getTime()).toBe(yesterday.getTime());
      expect(d.rolloverCount).toBe(0);

      expect((await reload(archived.id))!.scheduledDate!.getTime()).toBe(yesterday.getTime());
      expect((await reload(future.id))!.scheduledDate!.getTime()).toBe(tomorrow.getTime());
      expect((await reload(unscheduled.id))!.scheduledDate).toBeNull();

      // Idempotent: a second run on the same day changes nothing
      expect(await rolloverOverdueDailyTasks(userId)).toBe(0);
    });

    it("does not touch other users' tasks", async () => {
      const other = await db.user.create({
        data: { email: "rollover-other@example.com", passwordHash: "x" },
      });
      try {
        await ensureWorkspaceInitialized(other.id);
        const otherSection = await db.section.findFirst({ where: { userId: other.id } });
        const yesterday = parseDateKey(addDaysToKey(todayKey(), -1))!;
        const otherItem = await db.sectionItem.create({
          data: { userId: other.id, sectionId: otherSection!.id, title: "other", scheduledDate: yesterday },
        });
        await rolloverOverdueDailyTasks(userId);
        const after = await db.sectionItem.findUnique({ where: { id: otherItem.id } });
        expect(after!.scheduledDate!.getTime()).toBe(yesterday.getTime());
      } finally {
        await db.user.delete({ where: { id: other.id } });
      }
    });
  });
});
