import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { sendMail } from "@/lib/mail";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, bodyHtml, smtpAccountId = null } = body;

    if (!to || !subject || !bodyHtml) {
      return NextResponse.json({ error: "Recipient email, subject, and email body are required." }, { status: 400 });
    }

    // Realistic simulation variables to replace placeholders in test email
    const variablesMap: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      companyName: "Acme Corp",
      email: to,
      website: "www.acmeoutreach.co",
      linkedin: "linkedin.com/in/johndoe",
      location: "San Francisco",
      country: "United States",
      senderName: session.name || "Alex (PrimeInbox Team)",
    };

    let parsedSubject = subject;
    let parsedBodyHtml = bodyHtml;

    // Substitute standard variables e.g. {{firstName}}
    for (const [key, val] of Object.entries(variablesMap)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      parsedSubject = parsedSubject.replace(regex, val);
      parsedBodyHtml = parsedBodyHtml.replace(regex, val);
    }

    // Find custom SMTP account if specified, or auto-fallback to first active account
    let transporter = null;
    let fromName = process.env.SMTP_FROM || "PrimeInbox";
    let fromEmail = process.env.SMTP_USER || "noreply@primeinbox.dev";
    let smtpAccount = null;

    if (smtpAccountId) {
      smtpAccount = await db.smtpAccount.findUnique({
        where: { id: smtpAccountId, companyId: session.companyId },
      });
    } else {
      smtpAccount = await db.smtpAccount.findFirst({
        where: { companyId: session.companyId, status: "ACTIVE" },
      });
    }

    if (smtpAccount) {
      const password = decrypt(smtpAccount.passwordEncrypted);
      const secure = smtpAccount.secureType === "SSL" || smtpAccount.port === 465;

      transporter = nodemailer.createTransport({
        host: smtpAccount.host,
        port: smtpAccount.port,
        secure: secure,
        auth: {
          user: smtpAccount.username,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
      });

      fromName = smtpAccount.fromName;
      fromEmail = smtpAccount.fromEmail;
    }

    const textVersion = parsedBodyHtml.replace(/<[^>]*>/g, "");

    if (transporter) {
      const domain = fromEmail.split("@")[1] || "primeinbox.com";
      const uniqueId = `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: parsedSubject,
        html: parsedBodyHtml,
        text: textVersion,
        headers: {
          "X-Mailer": "PrimeInbox",
          "X-Priority": "1",
          "Importance": "high",
          "X-Entity-Ref-ID": uniqueId,
          "X-PM-Message-Stream": "outbound",
        },
        messageId: `<${uniqueId}@${domain}>`,
      });

      return NextResponse.json({
        success: true,
        message: `Test email sent via connected SMTP account (${fromEmail})`,
      });
    } else {
      // Fallback to default system SMTP configured in .env
      const success = await sendMail({
        to,
        subject: parsedSubject,
        html: parsedBodyHtml,
        text: textVersion,
      });

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Test email sent via default system SMTP settings",
        });
      } else {
        return NextResponse.json({ error: "Failed to dispatch email via system fallback SMTP" }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error("POST /api/templates/test error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
