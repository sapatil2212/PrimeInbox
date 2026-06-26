import { NextResponse } from "next/server";
import { destroyAdminSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    await destroyAdminSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Super Admin logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
