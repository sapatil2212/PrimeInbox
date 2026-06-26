import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("l");
  const companyId = searchParams.get("c");

  if (!leadId || !companyId) {
    return new NextResponse(
      `<div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2>Invalid Unsubscribe Request</h2>
        <p>The unsubscribe parameters are missing or corrupted.</p>
      </div>`,
      { headers: { "Content-Type": "text/html" }, status: 400 }
    );
  }

  try {
    const lead = await db.lead.findFirst({
      where: { id: leadId, companyId },
    });

    if (!lead) {
      return new NextResponse(
        `<div style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2>Lead Not Found</h2>
          <p>We could not find your subscription details in our records.</p>
        </div>`,
        { headers: { "Content-Type": "text/html" }, status: 404 }
      );
    }

    if (lead.status !== "UNSUBSCRIBED") {
      // Run database updates in transaction
      await db.$transaction([
        // Update Lead status
        db.lead.update({
          where: { id: leadId },
          data: { status: "UNSUBSCRIBED" },
        }),
        // Add to Suppression List
        db.suppressionList.create({
          data: {
            companyId,
            email: lead.email,
            reason: "UNSUBSCRIBED",
          },
        }),
        // Log Lead Activity
        db.leadActivity.create({
          data: {
            leadId,
            action: "UNSUBSCRIBED",
            details: "Opted out from outreach campaigns via unsubscribe link.",
          },
        }),
      ]);

      console.log(`[Unsubscribe Tracker] Lead ${lead.email} unsubscribed from Company ${companyId}`);
    }

    // Render beautiful confirmation page matching PrimeInbox landing page theme
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed — PrimeInbox</title>
        <style>
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background-color: rgba(24, 24, 27, 0.4);
            border: 1px solid rgba(63, 63, 70, 0.4);
            border-radius: 24px;
            padding: 40px 30px;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
            backdrop-filter: blur(12px);
          }
          .icon {
            background-color: rgba(99, 102, 241, 0.1);
            color: #818cf8;
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 24px;
            font-weight: bold;
          }
          h2 {
            font-size: 20px;
            font-weight: 800;
            margin: 0 0 12px;
            color: #ffffff;
            letter-spacing: -0.025em;
          }
          p {
            font-size: 13px;
            color: #a1a1aa;
            line-height: 1.6;
            margin: 0;
          }
          .footer {
            font-size: 10px;
            color: #52525b;
            margin-top: 32px;
            border-top: 1px solid rgba(63, 63, 70, 0.2);
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h2>Unsubscribe Confirmed</h2>
          <p>You have been successfully opted out from our email outreach lists. You will not receive any further automated emails from this sender.</p>
          <div class="footer">
            Powered by PrimeInbox Outreach Automation
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    console.error("[Unsubscribe Tracker] Failed to unsubscribe:", error);
    return new NextResponse(
      `<div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2>Internal Server Error</h2>
        <p>We encountered an error processing your unsubscribe request. Please try again later.</p>
      </div>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}
