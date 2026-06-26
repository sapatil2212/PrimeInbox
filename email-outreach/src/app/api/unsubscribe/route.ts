import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/unsubscribe";

async function processUnsubscribe(companyId: string, leadId: string): Promise<boolean> {
  const lead = await db.lead.findFirst({ where: { id: leadId, companyId } });
  if (!lead) return false;

  await db.$transaction([
    db.lead.update({ where: { id: leadId }, data: { status: "UNSUBSCRIBED" } }),
    db.suppressionList.upsert({
      where: { companyId_email: { companyId, email: lead.email } },
      update: { reason: "UNSUBSCRIBED" },
      create: { companyId, email: lead.email, reason: "UNSUBSCRIBED" },
    }),
    db.campaignLead.updateMany({
      where: { leadId, campaign: { companyId } },
      data: { status: "UNSUBSCRIBED" },
    }),
  ]);
  return true;
}

// One-click unsubscribe (List-Unsubscribe-Post). Must succeed without further interaction.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? verifyUnsubToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  await processUnsubscribe(payload.companyId, payload.leadId);
  return NextResponse.json({ success: true });
}

// Browser visit: unsubscribe and show a simple confirmation page.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = token ? verifyUnsubToken(token) : null;

  const ok = payload ? await processUnsubscribe(payload.companyId, payload.leadId) : false;

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;margin:0;padding:48px 16px;color:#27272a;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;">${ok ? "You're unsubscribed" : "Unable to process request"}</h1>
<p style="font-size:14px;color:#52525b;line-height:1.5;margin:0;">${
    ok
      ? "You will no longer receive emails from this sender. We're sorry to see you go."
      : "This unsubscribe link is invalid or has expired."
  }</p>
</div>
</body></html>`;

  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
