import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Live Server End-to-End Workflow Verification", () => {
  let cookieHeader = "";
  let userEmail = `alex-${Date.now()}@workspace.internal`;
  let sections: Array<{ id: string; name: string; orderIndex: number }> = [];
  let testItemId = "";

  it("1. GET /api/health - server is healthy and connected to SQLite", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("healthy");
    expect(data.data.database.status).toBe("connected");
  });

  it("2. POST /api/auth/register - registers user and initializes 5 default sections", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alex Mercer",
        email: userEmail,
        password: "Password123!",
      }),
    });

    expect(res.status).toBe(201);
    const rawCookies = res.headers.get("set-cookie");
    expect(rawCookies).toBeTruthy();
    if (rawCookies) {
      cookieHeader = rawCookies.split(";")[0];
    }

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe(userEmail);
  });

  it("3. GET /api/sections - verifies the 5 default sections exist in correct order", async () => {
    const res = await fetch(`${BASE_URL}/api/sections`, {
      headers: { Cookie: cookieHeader },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    sections = data.data.sections;

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

  it("4. POST /api/sections - creates 6 additional custom sections (exceeding 10 total)", async () => {
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          name: `Custom Section ${i}`,
          color: "cyan",
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
    }

    const res = await fetch(`${BASE_URL}/api/sections`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    expect(data.data.sections.length).toBe(11); // 5 default + 6 custom = 11
  });

  it("5. PUT /api/sections/reorder - transactionally reorders section positions", async () => {
    const res = await fetch(`${BASE_URL}/api/sections`, {
      headers: { Cookie: cookieHeader },
    });
    const data = await res.json();
    const currentSections = data.data.sections;

    const reversedIds = currentSections.map((s: { id: string }) => s.id).reverse();

    const reorderRes = await fetch(`${BASE_URL}/api/sections/reorder`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ sectionIds: reversedIds }),
    });

    expect(reorderRes.status).toBe(200);

    // Verify persisted order on fresh fetch
    const verifyRes = await fetch(`${BASE_URL}/api/sections`, {
      headers: { Cookie: cookieHeader },
    });
    const verifyData = await verifyRes.json();
    expect(verifyData.data.sections.map((s: { id: string }) => s.id)).toEqual(reversedIds);
  });

  it("6. POST /api/items - creates an item in Current section", async () => {
    const currentSec = sections.find((s) => s.name === "Current");
    expect(currentSec).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        sectionId: currentSec!.id,
        title: "Complete Architecture Review",
        description: "Review Next.js, SQLite, WAL, and foreign keys.",
        priority: "HIGH",
        status: "TODO",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    testItemId = data.data.item.id;
    expect(data.data.item.completedAt).toBeNull();
  });

  it("7. PATCH /api/items/[id]/status - marks item completed and populates timestamp", async () => {
    const res = await fetch(`${BASE_URL}/api/items/${testItemId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ status: "DONE" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.item.status).toBe("DONE");
    expect(data.data.item.completedAt).not.toBeNull();
  });

  it("8. PATCH /api/items/[id]/archive - archives item and removes from active query", async () => {
    const res = await fetch(`${BASE_URL}/api/items/${testItemId}/archive`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ isArchived: true }),
    });

    expect(res.status).toBe(200);

    // Check item does not appear in active query
    const activeRes = await fetch(`${BASE_URL}/api/items`, {
      headers: { Cookie: cookieHeader },
    });
    const activeData = await activeRes.json();
    expect(activeData.data.items.some((i: { id: string }) => i.id === testItemId)).toBe(false);
  });

  it("9. POST /api/backup - creates an atomic online SQLite snapshot", async () => {
    const res = await fetch(`${BASE_URL}/api/backup`, {
      method: "POST",
      headers: { Cookie: cookieHeader },
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.backup.sizeBytes).toBeGreaterThan(0);
  });

  it("10. Rejects unauthorized access without cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/sections`);
    expect(res.status).toBe(401);
  });
});
