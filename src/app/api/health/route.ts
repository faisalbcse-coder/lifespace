import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  const startTime = performance.now();
  try {
    // 1. Check database connectivity
    await db.$queryRawUnsafe("SELECT 1;");
    const dbLatencyMs = Math.round(performance.now() - startTime);

    return apiSuccess({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: "connected",
        provider: "sqlite",
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  } catch (error) {
    return apiError(
      "Health check failed: " + (error instanceof Error ? error.message : "Unknown error"),
      503,
      { status: "unhealthy" }
    );
  }
}
