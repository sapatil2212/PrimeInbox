import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.companyId;

    // 1. Fetch count stats
    const totalSends = await db.emailEvent.count({
      where: { campaign: { companyId }, eventType: "SENT" },
    });

    const totalOpens = await db.emailEvent.count({
      where: { campaign: { companyId }, eventType: "OPENED" },
    });

    const totalClicks = await db.emailEvent.count({
      where: { campaign: { companyId }, eventType: "CLICKED" },
    });

    const totalReplies = await db.emailEvent.count({
      where: { campaign: { companyId }, eventType: "REPLIED" },
    });

    const totalBounces = await db.emailEvent.count({
      where: { campaign: { companyId }, eventType: "BOUNCED" },
    });

    const activeCampaigns = await db.campaign.count({
      where: { companyId, status: "RUNNING" },
    });

    // SMTP Health metrics
    const smtpStats = await db.smtpAccount.aggregate({
      where: { companyId },
      _avg: { healthScore: true },
      _count: { id: true },
    });

    const activeSmtps = smtpStats._count.id;
    const smtpHealth = smtpStats._avg.healthScore || 100.0;

    // Today's enqueued sends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayQueue = await db.campaignQueue.count({
      where: { campaign: { companyId }, status: "QUEUED", scheduledAt: { gte: today } },
    });

    // 2. Fetch recent activity (Campaign logs)
    const recentActivity = await db.campaignLog.findMany({
      where: { campaign: { companyId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        status: true,
        message: true,
        createdAt: true,
        campaign: { select: { name: true } },
        lead: { select: { email: true } },
      },
    });

    // 3. Daily sends time-series data (Last 7 days)
    const dailySends: { date: string; sends: number; opens: number; replies: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const [sends, opens, replies] = await Promise.all([
        db.emailEvent.count({
          where: { campaign: { companyId }, eventType: "SENT", createdAt: { gte: start, lte: end } },
        }),
        db.emailEvent.count({
          where: { campaign: { companyId }, eventType: "OPENED", createdAt: { gte: start, lte: end } },
        }),
        db.emailEvent.count({
          where: { campaign: { companyId }, eventType: "REPLIED", createdAt: { gte: start, lte: end } },
        }),
      ]);

      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailySends.push({
        date: formattedDate,
        sends,
        opens,
        replies,
      });
    }

    // Rates calculators
    const openRate = totalSends > 0 ? Number(((totalOpens / totalSends) * 100).toFixed(1)) : 0;
    const clickRate = totalSends > 0 ? Number(((totalClicks / totalSends) * 100).toFixed(1)) : 0;
    const replyRate = totalSends > 0 ? Number(((totalReplies / totalSends) * 100).toFixed(1)) : 0;
    const bounceRate = totalSends > 0 ? Number(((totalBounces / totalSends) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalSends,
        openRate,
        clickRate,
        replyRate,
        bounceRate,
        activeCampaigns,
        activeSmtps,
        smtpHealth,
        todayQueue,
      },
      recentActivity,
      dailySends,
    });
  } catch (error) {
    console.error("Dashboard Stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
