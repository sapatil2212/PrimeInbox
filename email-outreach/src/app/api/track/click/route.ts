import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("e");
  const encodedUrl = searchParams.get("u");

  let destinationUrl = "/"; // Fallback URL

  // Decode destination URL
  if (encodedUrl) {
    try {
      destinationUrl = Buffer.from(encodedUrl, "base64url").toString("utf8");
    } catch (e) {
      console.error("[Click Tracker] Failed to decode URL:", encodedUrl, e);
    }
  }

  if (!eventId) {
    return NextResponse.redirect(new URL(destinationUrl, req.url));
  }

  try {
    // Fetch email event metadata
    const event = await db.emailEvent.findUnique({
      where: { id: eventId },
      include: { lead: true },
    });

    if (event) {
      const ipAddress = req.headers.get("x-forwarded-for") || null;
      const userAgent = req.headers.get("user-agent") || null;

      await db.$transaction([
        // Create Click tracking record
        db.clickTracking.create({
          data: {
            emailEventId: eventId,
            url: destinationUrl,
            ipAddress,
            userAgent,
          },
        }),
        // Update EmailEvent status to CLICKED
        db.emailEvent.update({
          where: { id: eventId },
          data: {
            eventType: "CLICKED",
          },
        }),
        // Record Lead Activity
        db.leadActivity.create({
          data: {
            leadId: event.leadId,
            action: "EMAIL_CLICKED",
            details: `Clicked link: ${destinationUrl}`,
          },
        }),
      ]);

      console.log(`[Click Tracker] Tracked click event for Lead ${event.lead.email} on url: ${destinationUrl}`);
    }
  } catch (error) {
    console.error("[Click Tracker] Tracking failed:", error);
  }

  // Redirect to final destination
  return NextResponse.redirect(destinationUrl);
}
