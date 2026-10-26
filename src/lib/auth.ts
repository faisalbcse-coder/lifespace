import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "./db";
import { logger } from "./logger";

export const SESSION_COOKIE_NAME = "pms_session";
const SESSION_EXPIRY_DAYS = 30;

// Simple in-memory rate limiter for authentication endpoints
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60 * 1000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function validateSession(token: string) {
  try {
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            fatherName: true,
            motherName: true,
            phone: true,
            address: true,
            permanentAddress: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            occupation: true,
            bio: true,
            emergencyContact: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      // Session expired, remove it asynchronously
      db.session.delete({ where: { token } }).catch(() => {});
      return null;
    }

    return session;
  } catch (error) {
    logger.error("Session validation error", error);
    return null;
  }
}

export async function deleteSession(token: string) {
  try {
    await db.session.delete({ where: { token } });
  } catch {
    // If not found or already deleted, ignore
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await validateSession(token);
    return session ? session.user : null;
  } catch {
    return null;
  }
}
