import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { rolloverOverdueDailyTasks } from "@/lib/planner";

/** POST /api/daily/rollover — manually triggers the rollover engine for the current user. */
export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    const rolledOver = await rolloverOverdueDailyTasks(user.id);
    return apiSuccess({ rolledOver });
  } catch (error) {
    logger.error("Rollover endpoint failed", error);
    return apiError("Internal server error while rolling over tasks", 500);
  }
}
