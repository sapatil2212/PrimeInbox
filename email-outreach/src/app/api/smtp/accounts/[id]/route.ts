import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { SmtpStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const account = await db.smtpAccount.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!account) {
      return NextResponse.json({ error: "SMTP Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("GET /api/smtp/accounts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 550 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      host,
      port,
      username,
      password,
      secureType,
      fromName,
      fromEmail,
      replyTo,
      dailyLimit,
      hourlyLimit,
      priority,
      rotationWeight,
      status,
    } = body;

    const existing = await db.smtpAccount.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "SMTP Account not found" }, { status: 404 });
    }

    let passwordEncrypted = existing.passwordEncrypted;
    if (password && password.trim() !== "") {
      passwordEncrypted = encrypt(password);
    }

    const updated = await db.smtpAccount.update({
      where: { id },
      data: {
        host: host || undefined,
        port: port !== undefined ? Number(port) : undefined,
        username: username || undefined,
        passwordEncrypted,
        secureType: secureType || undefined,
        fromName: fromName || undefined,
        fromEmail: fromEmail || undefined,
        replyTo: replyTo !== undefined ? replyTo : undefined,
        dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined,
        hourlyLimit: hourlyLimit !== undefined ? Number(hourlyLimit) : undefined,
        priority: priority !== undefined ? Number(priority) : undefined,
        rotationWeight: rotationWeight !== undefined ? Number(rotationWeight) : undefined,
        status: status ? (status as SmtpStatus) : undefined,
      },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    console.error("PUT /api/smtp/accounts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.smtpAccount.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "SMTP Account not found" }, { status: 404 });
    }

    await db.smtpAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "SMTP Account deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/smtp/accounts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
