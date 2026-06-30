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

    // Time boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    // Run all independent queries in parallel to minimise round trips to the
    // (remote) database. A single groupBy replaces five separate count() calls,
    // and one findMany over the last 7 days replaces 21 per-day counts.
    const [eventCounts, activeCampaigns, smtpStats, todayQueue, recentActivity, weekEvents] =
      await Promise.all([
        db.emailEvent.groupBy({
          by: ["eventType"],
          where: { campaign: { companyId } },
          _count: { _all: true },
        }),
        db.campaign.count({ where: { companyId, status: "RUNNING" } }),
        db.smtpAccount.aggregate({
          where: { companyId },
          _avg: { healthScore: true },
          _count: { id: true },
        }),
        db.campaignQueue.count({
          where: { campaign: { companyId }, status: "QUEUED", scheduledAt: { gte: today } },
        }),
        db.campaignLog.findMany({
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
        }),
        db.emailEvent.findMany({
          where: {
            campaign: { companyId },
            eventType: { in: ["SENT", "OPENED", "REPLIED"] },
            createdAt: { gte: weekStart },
          },
          select: { eventType: true, createdAt: true },
        }),
      ]);

    // Aggregate the grouped event totals.
    const countFor = (type: string) =>
      eventCounts.find((e) => e.eventType === type)?._count._all || 0;
    const totalSends = countFor("SENT");
    const totalOpens = countFor("OPENED");
    const totalClicks = countFor("CLICKED");
    const totalReplies = countFor("REPLIED");
    const totalBounces = countFor("BOUNCED");

    const activeSmtps = smtpStats._count.id;
    const smtpHealth = smtpStats._avg.healthScore || 100.0;

    // Bucket the last 7 days of events in memory (1 query instead of 21).
    const dailySends: { date: string; sends: number; opens: number; replies: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      let sends = 0,
        opens = 0,
        replies = 0;
      for (const ev of weekEvents) {
        const t = new Date(ev.createdAt);
        if (t >= d && t < next) {
          if (ev.eventType === "SENT") sends++;
          else if (ev.eventType === "OPENED") opens++;
          else if (ev.eventType === "REPLIED") replies++;
        }
      }

      dailySends.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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
