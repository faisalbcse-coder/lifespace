import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.resolve(rootDir, "backups");

const prisma = new PrismaClient();

async function runBackup() {
  console.log("🔒 Starting SQLite database backup process...");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.sqlite`;
  const targetPath = path.join(backupDir, filename).replace(/\\/g, "/");

  try {
    // 1. Run WAL checkpoint to ensure all committed transactions are flushed
    console.log("Checkpointing WAL journal...");
    await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(PASSIVE);");

    // 2. Perform native online VACUUM INTO backup
    console.log(`Writing atomic vacuumed copy to ${targetPath}...`);
    await prisma.$executeRawUnsafe(`VACUUM INTO '${targetPath}';`);

    // 3. Verify file existence and non-zero size
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Backup file not found at ${targetPath}`);
    }

    const stats = fs.statSync(targetPath);
    if (stats.size === 0) {
      fs.unlinkSync(targetPath);
      throw new Error("Backup file was created with 0 bytes.");
    }

    console.log(`✅ Backup successfully created!`);
    console.log(`📁 File: ${filename}`);
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`⏰ Timestamp: ${timestamp}`);
  } catch (error) {
    console.error("❌ Backup process failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
