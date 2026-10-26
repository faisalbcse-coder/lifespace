-- CreateTable
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubTask_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SectionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemAttachment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SectionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgressLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "progressSnapshot" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SectionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SectionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "scheduledDate" DATETIME,
    "rolloverCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "itemType" TEXT NOT NULL DEFAULT 'TASK',
    "metadata" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SectionItem" ("completedAt", "createdAt", "description", "dueDate", "id", "isArchived", "itemType", "metadata", "orderIndex", "priority", "sectionId", "status", "title", "updatedAt", "userId") SELECT "completedAt", "createdAt", "description", "dueDate", "id", "isArchived", "itemType", "metadata", "orderIndex", "priority", "sectionId", "status", "title", "updatedAt", "userId" FROM "SectionItem";
DROP TABLE "SectionItem";
ALTER TABLE "new_SectionItem" RENAME TO "SectionItem";
CREATE INDEX "SectionItem_sectionId_isArchived_orderIndex_idx" ON "SectionItem"("sectionId", "isArchived", "orderIndex");
CREATE INDEX "SectionItem_userId_status_idx" ON "SectionItem"("userId", "status");
CREATE INDEX "SectionItem_userId_priority_idx" ON "SectionItem"("userId", "priority");
CREATE INDEX "SectionItem_userId_dueDate_idx" ON "SectionItem"("userId", "dueDate");
CREATE INDEX "SectionItem_userId_scheduledDate_status_idx" ON "SectionItem"("userId", "scheduledDate", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubTask_itemId_orderIndex_idx" ON "SubTask"("itemId", "orderIndex");

-- CreateIndex
CREATE INDEX "ItemAttachment_itemId_idx" ON "ItemAttachment"("itemId");

-- CreateIndex
CREATE INDEX "ProgressLog_itemId_createdAt_idx" ON "ProgressLog"("itemId", "createdAt");
