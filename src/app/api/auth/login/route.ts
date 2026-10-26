import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  verifyPassword,
  createSession,
  SESSION_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/auth";
import { ensureWorkspaceInitialized } from "@/lib/workspace";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`login:${ip}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return apiError("Too many login attempts. Please wait 1 minute before trying again.", 429);
    }

    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid credentials provided", 400);
    }

    const { email, password } = result.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return apiError("Invalid email or password", 401);
    }

    // Ensure workspace is initialized
    await ensureWorkspaceInitialized(user.id);

    // Create session
    const session = await createSession(user.id);

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Login successful",
    });

    const isHttps = req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https:");

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && isHttps,
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    logger.info("User logged in", { userId: user.id });

    return response;
  } catch (error) {
    logger.error("Login error", error);
    return apiError("Internal server error during login", 500);
  }
}
