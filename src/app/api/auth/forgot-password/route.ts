import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { ForgotPasswordSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`forgot_pwd:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return apiError("Too many password reset requests. Please wait 15 minutes.", 429);
    }

    const body = await req.json();
    const result = ForgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return apiError(result.error.issues[0]?.message || "Invalid email address", 400);
    }

    const { email } = result.data;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // If user exists, create token and send email
    if (user) {
      // Clean up any existing tokens for this email
      await db.passwordResetToken.deleteMany({
        where: { email: user.email },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

      await db.passwordResetToken.create({
        data: {
          email: user.email,
          token,
          expiresAt,
        },
      });

      // Construct reset URL based on incoming request headers
      const forwardedHost = req.headers.get("x-forwarded-host");
      const host = forwardedHost || req.headers.get("host") || "lifespace.notekori.com";
      const forwardedProto = req.headers.get("x-forwarded-proto");
      const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");
      const baseUrl = `${proto}://${host}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      if (!emailResult.success) {
        logger.error("[ForgotPassword] Failed to send email to " + user.email, {
          error: emailResult.error,
        });
      }
    }

    // Always return success to protect user privacy
    return apiSuccess({
      message: "If this email is registered with LifeSpace, a reset link has been sent to it.",
    });
  } catch (error) {
    logger.error("[ForgotPassword] Internal error", { error });
    return apiError("An unexpected error occurred. Please try again later.", 500);
  }
}
