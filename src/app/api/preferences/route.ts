import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserPreferenceSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const preference = await db.userPreference.findUnique({
      where: { userId: user.id },
    });

    return apiSuccess({
      preference: preference || {
        theme: "system",
        density: "compact",
        showArchived: false,
        seeMoreExpanded: false,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch preferences", error);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const result = UserPreferenceSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid preferences payload", 400, result.error.flatten().fieldErrors);
    }

    const updated = await db.userPreference.upsert({
      where: { userId: user.id },
      update: result.data,
      create: {
        userId: user.id,
        theme: result.data.theme || "system",
        density: result.data.density || "compact",
        showArchived: result.data.showArchived || false,
        seeMoreExpanded: result.data.seeMoreExpanded || false,
      },
    });

    logger.info("User preferences updated", { userId: user.id });

    return apiSuccess({ preference: updated });
  } catch (error) {
    logger.error("Failed to update preferences", error);
    return apiError("Internal server error", 500);
  }
}
