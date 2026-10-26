type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

// Redact sensitive keys from log output
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "jwt_secret",
  "authorization",
  "cookie",
  "secret",
]);

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const payload: LogPayload = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
    };
    console.log(JSON.stringify(payload));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const payload: LogPayload = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
    };
    console.warn(JSON.stringify(payload));
  },

  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    const errorDetails =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          }
        : err
        ? { message: String(err) }
        : undefined;

    const payload: LogPayload = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      error: errorDetails,
      context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
    };
    console.error(JSON.stringify(payload));
  },

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "development") return;
    const payload: LogPayload = {
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context: context ? (sanitize(context) as Record<string, unknown>) : undefined,
    };
    console.debug(JSON.stringify(payload));
  },
};
