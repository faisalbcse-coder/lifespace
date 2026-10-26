import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }

  const preference = await db.userPreference.findUnique({
    where: { userId: user.id },
  });

  return apiSuccess({
    user,
    preference: preference || {
      theme: "system",
      density: "compact",
      showArchived: false,
      seeMoreExpanded: false,
    },
  });
}
