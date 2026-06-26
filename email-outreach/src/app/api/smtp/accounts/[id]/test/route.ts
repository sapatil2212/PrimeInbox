import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { buildTransport } from "@/lib/campaign-sender";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Optional custom recipient (e.g. a mail-tester.com address). Defaults to the user.
    const body = await req.json().catch(() => ({}));
    const recipient: string = (body?.to && String(body.to).trim()) || session.email;

    // Fetch SMTP account details
    const account = await db.smtpAccount.findUnique({
      where: { id, companyId: session.companyId },
    });

    if (!account) {
      return NextResponse.json({ error: "SMTP Account not found" }, { status: 404 });
    }

    const transporter = buildTransport(account);

    // 2. Perform connection verify handshake
    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      console.error("Transporter verify failed:", verifyErr);
      
      const errMsg = verifyErr.message || "Connection verify handshake failed";
      
      // Update account status to show credentials issue
      await db.smtpAccount.update({
        where: { id },
        data: {
          status: "INVALID_CREDENTIALS",
          errorLog: errMsg,
        },
      });

      return NextResponse.json({
        success: false,
        error: "Verification failed",
        details: errMsg,
      }, { status: 400 });
    }

    // 3. Send test email to the chosen recipient
    try {
      await transporter.sendMail({
        from: `"${account.fromName}" <${account.fromEmail}>`,
        to: recipient,
        subject: "PrimeInbox — SMTP Account Verification Successful",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #6366f1; margin-top: 0;">Connection Success!</h2>
            <p>Hello,</p>
            <p>This is a test email confirming that your SMTP connection settings for <strong>${account.fromEmail}</strong> are correct.</p>
            <p>Your outreach engine is ready to start dispatching automated campaign sequences securely.</p>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 11px; color: #71717a;">Sent via PrimeInbox SMTP Diagnostics tool.</p>
          </div>
        `,
        text: `Connection success! Your SMTP settings for ${account.fromEmail} are correct. Sent via PrimeInbox SMTP Diagnostics.`,
      });

      // Update account status back to active if it was paused/invalid
      await db.smtpAccount.update({
        where: { id },
        data: {
          status: "ACTIVE",
          errorLog: null,
          lastCheckedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `SMTP handshake succeeded and verification email sent to ${recipient}`,
      });

    } catch (sendErr: any) {
      console.error("Failed to send verification email:", sendErr);
      return NextResponse.json({
        success: false,
        error: "SMTP verified, but failed to send verification email",
        details: sendErr.message || "Mail dispatch error",
      }, { status: 400 });
    }

  } catch (error) {
    console.error("SMTP Diagnostic Test API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
