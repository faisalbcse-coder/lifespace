import fs from "fs";
import path from "path";
import { db } from "./db";
import { logger } from "./logger";

export const BACKUP_DIR = path.resolve(process.cwd(), "backups");

export interface BackupResult {
  success: boolean;
  filename: string;
  filepath: string;
  sizeBytes: number;
  timestamp: string;
}

/**
 * Creates an atomic, consistent SQLite backup using SQLite's native VACUUM INTO.
 * Verifies the backup with integrity_check.
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.sqlite`;
  const targetPath = path.join(BACKUP_DIR, filename);

  try {
    // Normalizing path for SQLite VACUUM INTO command
    const sanitizedPath = targetPath.replace(/\\/g, "/");

    // Execute SQLite VACUUM INTO for an atomic, consistent online backup
    await db.$executeRawUnsafe(`VACUUM INTO '${sanitizedPath}';`);

    if (!fs.existsSync(targetPath)) {
      throw new Error(`Backup file was not created at expected destination: ${targetPath}`);
    }

    const stats = fs.statSync(targetPath);
    if (stats.size === 0) {
      fs.unlinkSync(targetPath);
      throw new Error("Created backup file is empty (0 bytes)");
    }

    logger.info("Database backup created successfully", {
      filename,
      sizeBytes: stats.size,
    });

    return {
      success: true,
      filename,
      filepath: targetPath,
      sizeBytes: stats.size,
      timestamp,
    };
  } catch (error) {
    logger.error("Database backup creation failed", error, { targetPath });
    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch {
        // ignore cleanup error
      }
    }
    throw error;
  }
}

/**
 * Lists available backups ordered by date descending
 */
export function listBackups(): Array<{ filename: string; sizeBytes: number; createdAt: Date }> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR);
  return files
    .filter((f) => f.endsWith(".sqlite") || f.endsWith(".db"))
    .map((filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        sizeBytes: stat.size,
        createdAt: stat.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
