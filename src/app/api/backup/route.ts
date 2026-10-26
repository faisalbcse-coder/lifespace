import { getCurrentUser } from "@/lib/auth";
import { createDatabaseBackup, listBackups } from "@/lib/backup";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const backups = listBackups();
    return apiSuccess({ backups });
  } catch (error) {
    logger.error("Failed to list backups", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const result = await createDatabaseBackup();
    logger.info("Backup triggered by user", { userId: user.id, filename: result.filename });

    return apiSuccess({
      message: "Atomic database backup completed and verified successfully",
      backup: result,
    }, 201);
  } catch (error) {
    logger.error("Failed to execute database backup", error);
    return apiError("Backup failed: " + (error instanceof Error ? error.message : "Unknown error"), 500);
  }
}
