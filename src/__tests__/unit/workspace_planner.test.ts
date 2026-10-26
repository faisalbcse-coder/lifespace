import { describe, it, expect } from "vitest";
import {
  ScheduleItemSchema,
  CreateLinkAttachmentSchema,
  CreateSubTaskSchema,
  CreateLogSchema,
  UpdateItemSchema,
} from "../../lib/validators";
import { parseDateKey, addDaysToKey, toDateKey } from "../../lib/dates";
import { classifyUpload, resolveUploadPath, sanitizeFilename } from "../../lib/uploads";
import { renderMarkdown } from "../../lib/markdown";
import { computeSubTaskProgress } from "../../lib/progress";

describe("planner & workspace validation / helpers", () => {
  it("validates date keys strictly", () => {
    expect(parseDateKey("2026-02-31")).toBeNull();
    expect(parseDateKey("2026/02/01")).toBeNull();
    expect(toDateKey(parseDateKey("2026-10-20")!)).toBe("2026-10-20");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validates schedule payloads", () => {
    expect(ScheduleItemSchema.safeParse({ preset: "tomorrow" }).success).toBe(true);
    expect(ScheduleItemSchema.safeParse({ scheduledDate: "2026-10-20" }).success).toBe(true);
    expect(ScheduleItemSchema.safeParse({ scheduledDate: null }).success).toBe(true);
    expect(ScheduleItemSchema.safeParse({}).success).toBe(false);
    expect(ScheduleItemSchema.safeParse({ scheduledDate: "tomorrow" }).success).toBe(false);
    expect(ScheduleItemSchema.safeParse({ preset: "yesterday" }).success).toBe(false);
  });

  it("restricts links to http(s)", () => {
    const ok = CreateLinkAttachmentSchema.safeParse({ type: "LINK", title: "t", url: "https://a.com" });
    expect(ok.success).toBe(true);
    expect(CreateLinkAttachmentSchema.safeParse({ type: "LINK", title: "t", url: "javascript:alert(1)" }).success).toBe(false);
    expect(CreateLinkAttachmentSchema.safeParse({ type: "LINK", title: "", url: "https://a.com" }).success).toBe(false);
  });

  it("validates sub-tasks, logs and item updates", () => {
    expect(CreateSubTaskSchema.safeParse({ title: "  " }).success).toBe(false);
    expect(CreateLogSchema.safeParse({ note: "ok", progressSnapshot: 101 }).success).toBe(false);
    expect(CreateLogSchema.safeParse({ note: "ok", progressSnapshot: 60 }).success).toBe(true);
    expect(UpdateItemSchema.safeParse({ progress: 150 }).success).toBe(false);
    expect(UpdateItemSchema.safeParse({ progress: 50, content: "# notes", scheduledDate: null }).success).toBe(true);
  });

  it("computes sub-task progress", () => {
    expect(computeSubTaskProgress([])).toBeNull();
    expect(computeSubTaskProgress([{ isCompleted: true }, { isCompleted: false }, { isCompleted: false }])).toBe(33);
    expect(computeSubTaskProgress([{ isCompleted: true }])).toBe(100);
  });

  it("classifies uploads and blocks path traversal", () => {
    expect(classifyUpload("a.pdf", "application/pdf")?.type).toBe("PDF");
    expect(classifyUpload("a.webp", "image/webp")?.type).toBe("IMAGE");
    expect(classifyUpload("a.docx", "")?.type).toBe("FILE");
    expect(classifyUpload("a.svg", "image/svg+xml")).toBeNull();
    expect(classifyUpload("a.exe", "")).toBeNull();
    expect(classifyUpload("a.png", "text/html")).toBeNull();

    expect(resolveUploadPath(["item1", "file.pdf"])).not.toBeNull();
    expect(resolveUploadPath(["..", "secret"])).toBeNull();
    expect(resolveUploadPath(["item1", "..\\..\\x"])).toBeNull();
    expect(resolveUploadPath(["item1"])).toBeNull();
    expect(sanitizeFilename("../../etc/pass wd.pdf")).toBe("pass_wd.pdf");
  });

  it("renders markdown safely", () => {
    const html = renderMarkdown("# Title\n\n**bold** `code`\n\n- a\n- b\n\n<script>alert(1)</script>\n[x](javascript:alert(1))");
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>a</li>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript');
  });
});
