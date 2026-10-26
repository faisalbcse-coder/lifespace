import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit, hashPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`reset_pwd:${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return apiError("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      return apiError(result.error.issues[0]?.message || "Invalid input data", 400);
    }

    const { token, password } = result.data;

    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return apiError("Invalid or expired reset token. Please request a new password reset.", 400);
    }

    if (new Date() > resetRecord.expiresAt) {
      await db.passwordResetToken.deleteMany({
        where: { token },
      });
      return apiError("This reset link has expired. Please request a new one.", 400);
    }

    const user = await db.user.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      return apiError("No account found associated with this reset link.", 404);
    }

    // Hash the new password and update the user
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate any existing sessions for security
    await db.session.deleteMany({
      where: { userId: user.id },
    });

    // Clean up all reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { email: user.email },
    });

    return apiSuccess({
      message: "Your password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    logger.error("[ResetPassword] Internal error", { error });
    return apiError("An unexpected error occurred while resetting your password.", 500);
  }
}
