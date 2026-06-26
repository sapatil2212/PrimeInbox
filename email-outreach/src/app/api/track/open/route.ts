import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 1x1 transparent GIF buffer
const GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("e");

    if (!eventId) {
      return new NextResponse(GIF_BUFFER, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }

    // Retrieve email event metadata
    const event = await db.emailEvent.findUnique({
      where: { id: eventId },
      include: { lead: true },
    });

    if (event) {
      const ipAddress = req.headers.get("x-forwarded-for") || null;
      const userAgent = req.headers.get("user-agent") || null;

      // Run database operations in transaction
      await db.$transaction([
        // Create Open tracking record
        db.openTracking.create({
          data: {
            emailEventId: eventId,
            ipAddress,
            userAgent,
          },
        }),
        // Update EmailEvent status to OPENED if it was SENT
        db.emailEvent.update({
          where: { id: eventId },
          data: {
            eventType: "OPENED",
          },
        }),
        // Record Lead Activity
        db.leadActivity.create({
          data: {
            leadId: event.leadId,
            action: "EMAIL_OPENED",
            details: `Email opened. Browser/Agent: ${userAgent?.slice(0, 100) || "Unknown"}`,
          },
        }),
      ]);

      console.log(`[Open Tracker] Tracked open event for Lead ${event.lead.email}`);
    }

  } catch (error) {
    console.error("[Open Tracker] Tracking failed:", error);
  }

  // Always return the pixel image, even on failure, to avoid warning blocks
  return new NextResponse(GIF_BUFFER, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
