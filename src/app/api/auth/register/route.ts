import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/lib/validators";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  hashPassword,
  createSession,
  SESSION_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/auth";
import { ensureWorkspaceInitialized } from "@/lib/workspace";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateCheck = checkRateLimit(`register:${ip}`, 5, 60 * 1000);
    if (!rateCheck.allowed) {
      return apiError("Too many registration attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return apiError("Invalid input", 400, result.error.flatten().fieldErrors);
    }

    const { email, password, name } = result.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return apiError("An account with this email address already exists", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Idempotently initialize the 5 default sections
    await ensureWorkspaceInitialized(user.id);

    // Create persistent session
    const session = await createSession(user.id);

    const response = apiSuccess(
      {
        user,
        message: "Registration successful",
      },
      201
    );

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

    logger.info("User registered and initialized workspace", { userId: user.id });

    return response;
  } catch (error) {
    logger.error("Registration error", error);
    return apiError("Internal server error during registration", 500);
  }
}
