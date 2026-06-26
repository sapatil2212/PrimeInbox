import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { EventType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = session;

    // 1. Fetch total counts of outreach events
    const [sent, open, click, reply, bounce, unsub] = await Promise.all([
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.SENT } }),
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.OPENED } }),
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.CLICKED } }),
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.REPLIED } }),
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.BOUNCED } }),
      db.emailEvent.count({ where: { campaign: { companyId }, eventType: EventType.UNSUBSCRIBED } }),
    ]);

    // 2. Fetch list of campaigns with detailed statistics
    const campaigns = await db.campaign.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const campaignStats = await Promise.all(
      campaigns.map(async (camp) => {
        const [cSent, cOpen, cClick, cReply, cBounce, cUnsub] = await Promise.all([
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.SENT } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.OPENED } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.CLICKED } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.REPLIED } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.BOUNCED } }),
          db.emailEvent.count({ where: { campaignId: camp.id, eventType: EventType.UNSUBSCRIBED } }),
        ]);

        return {
          id: camp.id,
          name: camp.name,
          status: camp.status,
          createdAt: camp.createdAt,
          leadsCount: camp._count.leads,
          sent: cSent,
          opened: cOpen,
          clicked: cClick,
          replied: cReply,
          bounced: cBounce,
          unsubscribed: cUnsub,
          openRate: cSent > 0 ? Number(((cOpen / cSent) * 100).toFixed(1)) : 0,
          clickRate: cSent > 0 ? Number(((cClick / cSent) * 100).toFixed(1)) : 0,
          replyRate: cSent > 0 ? Number(((cReply / cSent) * 100).toFixed(1)) : 0,
        };
      })
    );

    // 3. Fetch SMTP account metrics
    const smtpAccounts = await db.smtpAccount.findMany({
      where: { companyId },
      select: {
        id: true,
        host: true,
        fromEmail: true,
        dailyLimit: true,
        currentDailyCount: true,
        healthScore: true,
        status: true,
      },
    });

    const smtpStats = await Promise.all(
      smtpAccounts.map(async (smtp) => {
        const [smtpSent, smtpBounce] = await Promise.all([
          db.emailEvent.count({ where: { smtpAccountId: smtp.id, eventType: EventType.SENT } }),
          db.emailEvent.count({ where: { smtpAccountId: smtp.id, eventType: EventType.BOUNCED } }),
        ]);

        return {
          ...smtp,
          totalSent: smtpSent,
          totalBounced: smtpBounce,
        };
      })
    );

    // 4. Fetch daily activity logs for the past 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentEvents = await db.emailEvent.findMany({
      where: {
        campaign: { companyId },
        createdAt: { gte: fourteenDaysAgo },
      },
      select: {
        eventType: true,
        createdAt: true,
      },
    });

    // Populate daily chart datasets
    const chartDataMap: { [date: string]: { date: string; sends: number; opens: number; clicks: number; replies: number } } = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      chartDataMap[dateString] = { date: dateString, sends: 0, opens: 0, clicks: 0, replies: 0 };
    }

    recentEvents.forEach((ev) => {
      const dateString = ev.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (chartDataMap[dateString]) {
        if (ev.eventType === EventType.SENT) chartDataMap[dateString].sends++;
        else if (ev.eventType === EventType.OPENED) chartDataMap[dateString].opens++;
        else if (ev.eventType === EventType.CLICKED) chartDataMap[dateString].clicks++;
        else if (ev.eventType === EventType.REPLIED) chartDataMap[dateString].replies++;
      }
    });

    const dailySends = Object.values(chartDataMap);

    return NextResponse.json({
      success: true,
      summary: {
        sent,
        opened: open,
        clicked: click,
        replied: reply,
        bounced: bounce,
        unsubscribed: unsub,
        openRate: sent > 0 ? Number(((open / sent) * 100).toFixed(1)) : 0,
        clickRate: sent > 0 ? Number(((click / sent) * 100).toFixed(1)) : 0,
        replyRate: sent > 0 ? Number(((reply / sent) * 100).toFixed(1)) : 0,
        bounceRate: sent > 0 ? Number(((bounce / sent) * 100).toFixed(1)) : 0,
      },
      campaigns: campaignStats,
      smtp: smtpStats,
      dailySends,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
