import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.resolve(rootDir, "backups");
const liveDbPath = path.resolve(rootDir, "dev.db");

async function runRestore() {
  console.log("🔄 Starting SQLite database restoration process...");

  let targetBackupFile = process.argv[2];

  if (!targetBackupFile) {
    if (!fs.existsSync(backupDir)) {
      console.error("❌ No backups directory found at:", backupDir);
      process.exit(1);
    }
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".sqlite") || f.endsWith(".db"))
      .sort((a, b) => {
        return (
          fs.statSync(path.join(backupDir, b)).mtime.getTime() -
          fs.statSync(path.join(backupDir, a)).mtime.getTime()
        );
      });

    if (files.length === 0) {
      console.error("❌ No backup files found in:", backupDir);
      process.exit(1);
    }

    targetBackupFile = path.join(backupDir, files[0]);
    console.log(`ℹ️ No backup specified, selecting latest backup: ${files[0]}`);
  } else {
    if (!path.isAbsolute(targetBackupFile)) {
      targetBackupFile = path.resolve(rootDir, targetBackupFile);
    }
  }

  if (!fs.existsSync(targetBackupFile)) {
    console.error(`❌ Specified backup file does not exist: ${targetBackupFile}`);
    process.exit(1);
  }

  const stat = fs.statSync(targetBackupFile);
  if (stat.size === 0) {
    console.error("❌ Backup file is 0 bytes and cannot be restored.");
    process.exit(1);
  }

  console.log(`📦 Restoring from: ${targetBackupFile} (${(stat.size / 1024).toFixed(2)} KB)`);

  const safetyBackupPath = `${liveDbPath}.pre-restore-${Date.now()}`;
  let safetyBackupCreated = false;

  try {
    // 1. Create safety backup of existing live database if present
    if (fs.existsSync(liveDbPath)) {
      fs.copyFileSync(liveDbPath, safetyBackupPath);
      safetyBackupCreated = true;
      console.log(`🛡️ Created pre-restore safety copy at: ${safetyBackupPath}`);
    }

    // 2. Remove any lingering WAL/SHM files to prevent inconsistency
    const walFile = `${liveDbPath}-wal`;
    const shmFile = `${liveDbPath}-shm`;
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);

    // 3. Copy backup file to live database path
    fs.copyFileSync(targetBackupFile, liveDbPath);
    console.log("📥 Copied backup into live database location.");

    // 4. Verify restored database by opening with Prisma Client and querying
    console.log("🔍 Verifying restored database integrity...");
    const testPrisma = new PrismaClient();
    try {
      const integrity = await testPrisma.$queryRawUnsafe("PRAGMA integrity_check;");
      console.log("PRAGMA integrity_check result:", integrity);

      const sectionCount = await testPrisma.section.count();
      const userCount = await testPrisma.user.count();
      const itemCount = await testPrisma.sectionItem.count();

      console.log(`✅ Restoration verified successfully!`);
      console.log(`👥 Users: ${userCount}`);
      console.log(`📂 Sections: ${sectionCount}`);
      console.log(`📝 Items: ${itemCount}`);

      // Cleanup safety backup
      if (safetyBackupCreated && fs.existsSync(safetyBackupPath)) {
        fs.unlinkSync(safetyBackupPath);
      }
    } finally {
      await testPrisma.$disconnect();
    }
  } catch (err) {
    console.error("❌ Verification failed! Rolling back to pre-restore safety copy...", err);
    if (safetyBackupCreated && fs.existsSync(safetyBackupPath)) {
      fs.copyFileSync(safetyBackupPath, liveDbPath);
      console.log("⏪ Successfully rolled back to pre-restore database state.");
    }
    process.exit(1);
  }
}

runRestore();
