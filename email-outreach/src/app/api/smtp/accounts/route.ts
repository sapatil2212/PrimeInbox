import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { SmtpStatus } from "@prisma/client";
import { getPlanLimits } from "@/lib/plans";

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

    // Never expose encrypted secrets to the client.
    const safeAccounts = accounts.map(({ passwordEncrypted, dkimPrivateKey, ...rest }) => ({
      ...rest,
      hasDkim: !!(rest.dkimDomain && rest.dkimSelector && dkimPrivateKey),
    }));

    return NextResponse.json({ success: true, accounts: safeAccounts });
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
      dkimDomain = null,
      dkimSelector = null,
      dkimPrivateKey = null,
    } = body;

    if (!host || !port || !username || !password || !fromName || !fromEmail) {
      return NextResponse.json({ error: "Missing required connection credentials" }, { status: 400 });
    }

    // Enforce the plan's SMTP account limit.
    const company = await db.company.findUnique({
      where: { id: session.companyId },
      select: { subscriptionPlan: true },
    });
    const limits = getPlanLimits(company?.subscriptionPlan);
    const existingCount = await db.smtpAccount.count({ where: { companyId: session.companyId } });
    if (existingCount >= limits.smtpLimit) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${limits.smtpLimit} SMTP sender ${limits.smtpLimit === 1 ? "account" : "accounts"}. Upgrade your plan to add more.`,
        },
        { status: 403 }
      );
    }

    // Encrypt the password securely
    const passwordEncrypted = encrypt(password);

    // Optional app-level DKIM: only store when all three parts are provided.
    const dkimReady = !!(dkimDomain && dkimSelector && dkimPrivateKey);

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
        dkimDomain: dkimReady ? dkimDomain : null,
        dkimSelector: dkimReady ? dkimSelector : null,
        dkimPrivateKey: dkimReady ? encrypt(dkimPrivateKey) : null,
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

    const { passwordEncrypted: _pw, dkimPrivateKey: _dk, ...safeAccount } = account;
    return NextResponse.json({ success: true, account: safeAccount }, { status: 201 });
  } catch (error) {
    console.error("POST /api/smtp/accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
