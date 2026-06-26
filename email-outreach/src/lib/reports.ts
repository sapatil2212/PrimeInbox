import { db } from "@/lib/db";
import { EventType } from "@prisma/client";

export type RangeKey = "7d" | "14d" | "30d" | "90d" | "all";

export const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  all: 3650,
};

export interface ReportData {
  range: RangeKey;
  generatedAt: string;
  summary: {
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  deltas: {
    sent: number;
    opened: number;
    replied: number;
    bounced: number;
  };
  funnel: { stage: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  campaigns: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    leadsCount: number;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  }[];
  smtp: {
    id: string;
    host: string;
    fromEmail: string;
    dailyLimit: number;
    currentDailyCount: number;
    healthScore: number;
    status: string;
    totalSent: number;
    totalBounced: number;
  }[];
  dailySends: { date: string; sends: number; opens: number; clicks: number; replies: number }[];
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0;
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

async function countByType(companyId: string, gte: Date, lt?: Date) {
  const where: any = { campaign: { companyId }, createdAt: lt ? { gte, lt } : { gte } };
  const grouped = await db.emailEvent.groupBy({
    by: ["eventType"],
    where,
    _count: { _all: true },
  });
  const map: Record<string, number> = {};
  for (const g of grouped) map[g.eventType] = g._count._all;
  return {
    sent: map[EventType.SENT] || 0,
    opened: map[EventType.OPENED] || 0,
    clicked: map[EventType.CLICKED] || 0,
    replied: map[EventType.REPLIED] || 0,
    bounced: map[EventType.BOUNCED] || 0,
    unsubscribed: map[EventType.UNSUBSCRIBED] || 0,
  };
}

/**
 * Builds the full analytics dataset for a company over a selected time range.
 * Used by both the reports API and the export endpoint so numbers always match.
 */
export async function buildReportData(companyId: string, range: RangeKey = "14d"): Promise<ReportData> {
  const days = RANGE_DAYS[range];

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const prevStart = new Date(rangeStart);
  prevStart.setDate(prevStart.getDate() - days);

  // Current + previous period totals (for real trend deltas)
  const [cur, prev] = await Promise.all([
    countByType(companyId, rangeStart),
    countByType(companyId, prevStart, rangeStart),
  ]);

  const summary = {
    ...cur,
    openRate: pct(cur.opened, cur.sent),
    clickRate: pct(cur.clicked, cur.sent),
    replyRate: pct(cur.replied, cur.sent),
    bounceRate: pct(cur.bounced, cur.sent),
  };

  const deltas = {
    sent: deltaPct(cur.sent, prev.sent),
    opened: deltaPct(cur.opened, prev.opened),
    replied: deltaPct(cur.replied, prev.replied),
    bounced: deltaPct(cur.bounced, prev.bounced),
  };

  const funnel = [
    { stage: "Sent", value: cur.sent },
    { stage: "Opened", value: cur.opened },
    { stage: "Clicked", value: cur.clicked },
    { stage: "Replied", value: cur.replied },
  ];

  // Campaigns (lifetime stats per campaign)
  const campaigns = await db.campaign.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const campaignStats = await Promise.all(
    campaigns.map(async (camp) => {
      const grouped = await db.emailEvent.groupBy({
        by: ["eventType"],
        where: { campaignId: camp.id },
        _count: { _all: true },
      });
      const m: Record<string, number> = {};
      for (const g of grouped) m[g.eventType] = g._count._all;
      const cSent = m[EventType.SENT] || 0;
      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        createdAt: camp.createdAt.toISOString(),
        leadsCount: camp._count.leads,
        sent: cSent,
        opened: m[EventType.OPENED] || 0,
        clicked: m[EventType.CLICKED] || 0,
        replied: m[EventType.REPLIED] || 0,
        bounced: m[EventType.BOUNCED] || 0,
        unsubscribed: m[EventType.UNSUBSCRIBED] || 0,
        openRate: pct(m[EventType.OPENED] || 0, cSent),
        clickRate: pct(m[EventType.CLICKED] || 0, cSent),
        replyRate: pct(m[EventType.REPLIED] || 0, cSent),
      };
    })
  );

  // Status distribution
  const statusGroups = await db.campaign.groupBy({
    by: ["status"],
    where: { companyId },
    _count: { _all: true },
  });
  const statusDistribution = statusGroups.map((s) => ({ name: s.status, value: s._count._all }));

  // SMTP health
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
      return { ...smtp, totalSent: smtpSent, totalBounced: smtpBounce };
    })
  );

  // Daily timeline over the range
  const recentEvents = await db.emailEvent.findMany({
    where: { campaign: { companyId }, createdAt: { gte: rangeStart } },
    select: { eventType: true, createdAt: true },
  });

  const chartMap: Record<string, { date: string; sends: number; opens: number; clicks: number; replies: number }> = {};
  const points = Math.min(days, 90);
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    chartMap[key] = { date: key, sends: 0, opens: 0, clicks: 0, replies: 0 };
  }

  for (const ev of recentEvents) {
    const key = ev.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const bucket = chartMap[key];
    if (!bucket) continue;
    if (ev.eventType === EventType.SENT) bucket.sends++;
    else if (ev.eventType === EventType.OPENED) bucket.opens++;
    else if (ev.eventType === EventType.CLICKED) bucket.clicks++;
    else if (ev.eventType === EventType.REPLIED) bucket.replies++;
  }

  return {
    range,
    generatedAt: new Date().toISOString(),
    summary,
    deltas,
    funnel,
    statusDistribution,
    campaigns: campaignStats,
    smtp: smtpStats,
    dailySends: Object.values(chartMap),
  };
}
