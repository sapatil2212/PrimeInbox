import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import net from "net";

function checkRedisPort(host = "127.0.0.1", port = 6379): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access Denied. Super Admin only." }, { status: 403 });
    }

    // Database health + latency
    let dbStatus = "HEALTHY";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await db.$executeRawUnsafe("SELECT 1;");
      dbLatency = Date.now() - start;
    } catch (_) {
      dbStatus = "UNHEALTHY";
    }

    // Redis health
    let redisUrlString = process.env.REDIS_URL || "redis://localhost:6379";
    let redisHost = "127.0.0.1";
    let redisPort = 6379;
    try {
      const parsedUrl = new URL(redisUrlString);
      redisHost = parsedUrl.hostname || "127.0.0.1";
      redisPort = parseInt(parsedUrl.port || "6379");
    } catch (_) {}

    const isRedisConnected = await checkRedisPort(redisHost, redisPort);
    const redisStatus = isRedisConnected ? "HEALTHY" : "UNHEALTHY";

    // Queue stats
    const [queued, processing, failed, sent] = await Promise.all([
      db.campaignQueue.count({ where: { status: "QUEUED" } }),
      db.campaignQueue.count({ where: { status: "PROCESSING" } }),
      db.campaignQueue.count({ where: { status: "FAILED" } }),
      db.campaignQueue.count({ where: { status: "SENT" } }),
    ]);

    // SMTP account health overview
    const [smtpActive, smtpPaused, smtpRateLimited, smtpBlocked, smtpInvalid] = await Promise.all([
      db.smtpAccount.count({ where: { status: "ACTIVE" } }),
      db.smtpAccount.count({ where: { status: "PAUSED" } }),
      db.smtpAccount.count({ where: { status: "RATE_LIMITED" } }),
      db.smtpAccount.count({ where: { status: "BLOCKED" } }),
      db.smtpAccount.count({ where: { status: "INVALID_CREDENTIALS" } }),
    ]);

    const memory = process.memoryUsage();

    return NextResponse.json({
      success: true,
      health: {
        database: { status: dbStatus, latency: `${dbLatency}ms` },
        redis: { status: redisStatus, host: redisHost, port: redisPort },
        queue: {
          workerStatus: isRedisConnected ? "ACTIVE" : "INACTIVE",
          queued,
          processing,
          failed,
          sent,
        },
        smtp: {
          active: smtpActive,
          paused: smtpPaused,
          rateLimited: smtpRateLimited,
          blocked: smtpBlocked,
          invalid: smtpInvalid,
        },
        system: {
          uptime: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          memoryTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/health error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
