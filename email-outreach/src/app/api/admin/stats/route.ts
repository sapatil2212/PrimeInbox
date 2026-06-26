import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import net from "net";

// Helper to check TCP port connection (Redis status)
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

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    // 1. Core platform metrics
    const [companiesCount, usersCount, campaignsCount, smtpCount] = await Promise.all([
      db.company.count(),
      db.user.count(),
      db.campaign.count(),
      db.smtpAccount.count(),
    ]);

    // 2. Health checks
    let dbStatus = "HEALTHY";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await db.$executeRawUnsafe("SELECT 1;");
      dbLatency = Date.now() - start;
    } catch (e) {
      dbStatus = "UNHEALTHY";
    }

    // Redis Port scan
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

    // Worker Queue health (pending items)
    const queuePending = await db.campaignQueue.count({
      where: { status: "QUEUED" },
    });
    
    const workerStatus = isRedisConnected ? "ACTIVE" : "INACTIVE";

    // 3. Global tenant companies list
    const tenants = await db.company.findMany({
      select: {
        id: true,
        name: true,
        workspaceSlug: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      stats: {
        companiesCount,
        usersCount,
        campaignsCount,
        smtpCount,
      },
      health: {
        database: { status: dbStatus, latency: `${dbLatency}ms` },
        redis: { status: redisStatus, host: redisHost, port: redisPort },
        queue: { pendingJobs: queuePending, workerStatus },
      },
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.workspaceSlug,
        plan: t.subscriptionPlan,
        status: t.subscriptionStatus,
        createdAt: t.createdAt,
        users: t._count.users,
        campaigns: t._count.campaigns,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
