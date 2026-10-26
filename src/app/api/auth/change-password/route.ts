import { getCurrentUser, verifyPassword, hashPassword, checkRateLimit } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { ChangePasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return apiError("Unauthorized", 401);
  }

  const rateCheck = checkRateLimit(`pwd_change_${currentUser.id}`, 5, 60 * 1000);
  if (!rateCheck.allowed) {
    return apiError("Too many password change attempts. Please try again in 1 minute.", 429);
  }

  try {
    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const isValidCurrent = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isValidCurrent) {
      return apiError("Current password is incorrect", 400);
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await db.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    });

    return apiSuccess({
      message: "Password changed successfully",
    });
  } catch {
    return apiError("Failed to update password", 500);
  }
}
