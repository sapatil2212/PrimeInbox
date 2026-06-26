import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;

    // Database connection latency
    let dbStatus = "HEALTHY";
    let dbLatency = 0;
    try {
      const start = Date.now();
      await db.$executeRawUnsafe("SELECT 1;");
      dbLatency = Date.now() - start;
    } catch (_) {
      dbStatus = "UNHEALTHY";
    }

    // Row counts across core tables
    const [
      companies,
      users,
      campaigns,
      leads,
      leadLists,
      smtpAccounts,
      templates,
      emailEvents,
      campaignQueue,
      systemLogs,
      crmContacts,
      invoices,
    ] = await Promise.all([
      db.company.count(),
      db.user.count(),
      db.campaign.count(),
      db.lead.count(),
      db.leadList.count(),
      db.smtpAccount.count(),
      db.emailTemplate.count(),
      db.emailEvent.count(),
      db.campaignQueue.count(),
      db.systemLog.count(),
      db.crmContact.count(),
      db.invoice.count(),
    ]);

    const tables = [
      { name: "Company", rows: companies, group: "Tenancy" },
      { name: "User", rows: users, group: "Tenancy" },
      { name: "Campaign", rows: campaigns, group: "Campaigns" },
      { name: "CampaignQueue", rows: campaignQueue, group: "Campaigns" },
      { name: "Lead", rows: leads, group: "Leads" },
      { name: "LeadList", rows: leadLists, group: "Leads" },
      { name: "SmtpAccount", rows: smtpAccounts, group: "Sending" },
      { name: "EmailTemplate", rows: templates, group: "Content" },
      { name: "EmailEvent", rows: emailEvents, group: "Tracking" },
      { name: "CrmContact", rows: crmContacts, group: "CRM" },
      { name: "Invoice", rows: invoices, group: "Billing" },
      { name: "SystemLog", rows: systemLogs, group: "System" },
    ];

    const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);

    // Provider info derived from DATABASE_URL (without exposing credentials)
    let provider = "mysql";
    let dbHost = "unknown";
    try {
      const url = new URL(process.env.DATABASE_URL || "");
      provider = url.protocol.replace(":", "");
      dbHost = url.hostname;
    } catch (_) {}

    return NextResponse.json({
      success: true,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
        provider,
        host: dbHost,
        totalRows,
        tables,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/database error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
