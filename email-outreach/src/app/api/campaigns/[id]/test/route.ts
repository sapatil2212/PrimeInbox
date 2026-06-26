import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { resolveCampaignSmtpPool, sendViaSmtpAccount, interpolate } from "@/lib/campaign-sender";

/**
 * Send a single test email for a campaign to an arbitrary address
 * (e.g. a mail-tester.com inbox) so deliverability can be checked before launch.
 *
 * Uses the first account from the campaign's resolved SMTP pool and the
 * campaign's first step template, rendered with sample lead data.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const to: string = body?.to ? String(body.to).trim() : session.email;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "A valid recipient email is required" }, { status: 400 });
    }

    const campaign = await db.campaign.findUnique({
      where: { id, companyId: session.companyId },
      include: { steps: { include: { template: true }, orderBy: { stepNumber: "asc" } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (!campaign.steps.length) {
      return NextResponse.json({ error: "Campaign has no email template configured" }, { status: 400 });
    }

    const pool = await resolveCampaignSmtpPool(campaign);
    if (pool.length === 0) {
      return NextResponse.json(
        { error: "No active SMTP account is available for this campaign" },
        { status: 400 }
      );
    }

    const account = pool[0];
    const template = campaign.steps[0].template;

    // Render with representative sample data so {{variables}} aren't left blank.
    const sampleLead = {
      firstName: "Alex",
      lastName: "Sample",
      email: to,
      companyName: "Acme Inc",
    };

    const subject = `[TEST] ${interpolate(template.subject, sampleLead)}`;
    const html = interpolate(template.bodyHtml, sampleLead);
    const text = template.bodyText ? interpolate(template.bodyText, sampleLead) : undefined;

    try {
      const { messageId } = await sendViaSmtpAccount(account, {
        to,
        subject,
        html,
        text,
        // Include unsubscribe headers/footer so the test reflects real sends.
        companyId: session.companyId,
        leadId: "test-preview",
      });

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to} via ${account.fromEmail}`,
        messageId,
        sender: account.fromEmail,
      });
    } catch (err: any) {
      console.error("Campaign test send failed:", err);
      return NextResponse.json(
        { error: "Failed to send test email", details: err?.message || "SMTP error" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/campaigns/[id]/test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
