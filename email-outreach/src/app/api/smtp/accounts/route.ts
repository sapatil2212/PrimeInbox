import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { SmtpStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await db.smtpAccount.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("GET /api/smtp/accounts error:", error);
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
    const {
      host,
      port,
      username,
      password,
      secureType = "TLS",
      fromName,
      fromEmail,
      replyTo = null,
      dailyLimit = 200,
      hourlyLimit = 25,
      priority = 1,
      rotationWeight = 1,
    } = body;

    if (!host || !port || !username || !password || !fromName || !fromEmail) {
      return NextResponse.json({ error: "Missing required connection credentials" }, { status: 400 });
    }

    // Encrypt the password securely
    const passwordEncrypted = encrypt(password);

    const account = await db.smtpAccount.create({
      data: {
        companyId: session.companyId,
        host,
        port: Number(port),
        username,
        passwordEncrypted,
        secureType,
        fromName,
        fromEmail,
        replyTo: replyTo || null,
        dailyLimit: Number(dailyLimit),
        hourlyLimit: Number(hourlyLimit),
        priority: Number(priority),
        rotationWeight: Number(rotationWeight),
        status: "ACTIVE",
        healthScore: 100.0,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: "SMTP_ACCOUNT_ADD",
        ipAddress: req.headers.get("x-forwarded-for"),
      },
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error) {
    console.error("POST /api/smtp/accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
