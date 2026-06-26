import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.apiKey.findMany({
      where: { companyId: session.companyId, isActive: true },
      select: {
        id: true,
        name: true,
        keyHash: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error("GET /api/settings/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    // Generate a secure random token (e.g. pi_live_...)
    const token = crypto.randomBytes(24).toString("hex");
    const apiKeyString = `pi_live_${token}`;

    // Hash the token with SHA-256 for secure DB storage
    const keyHash = crypto.createHash("sha256").update(apiKeyString).digest("hex");

    const keyRecord = await db.apiKey.create({
      data: {
        companyId: session.companyId,
        userId: session.userId,
        name: name.trim(),
        keyHash,
        scopes: "read,write",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      keyId: keyRecord.id,
      apiKeyString, // Display once in frontend
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/settings/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 });
    }

    // Revoke the key
    await db.apiKey.deleteMany({
      where: {
        id: keyId,
        companyId: session.companyId,
      },
    });

    return NextResponse.json({ success: true, message: "API Key revoked successfully" });
  } catch (error) {
    console.error("DELETE /api/settings/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
