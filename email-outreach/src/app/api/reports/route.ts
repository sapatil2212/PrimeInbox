import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildReportData, RANGE_DAYS, RangeKey } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rangeParam = req.nextUrl.searchParams.get("range") as RangeKey | null;
    const range: RangeKey = rangeParam && rangeParam in RANGE_DAYS ? rangeParam : "14d";

    const data = await buildReportData(session.companyId, range);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
