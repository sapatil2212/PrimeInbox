import nodemailer from "nodemailer";
import { SmtpAccount } from "@prisma/client";
import { decrypt } from "./encryption.service";

export interface SendMailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  eventId: string;
  campaignId: string;
  leadId: string;
  stepId: string;
}

export class EmailSenderService {
  /**
   * Dispatches an email using NodeMailer via the decrypted SMTP configuration.
   * Sets custom tracking headers to identify replies and bounces easily.
   */
  static async sendEmail(
    smtpAccount: SmtpAccount,
    payload: SendMailPayload
  ): Promise<{ messageId: string }> {
    // Decrypt password
    const password = decrypt(smtpAccount.passwordEncrypted);

    // Setup nodemailer transport
    const secure = smtpAccount.secureType === "SSL" || smtpAccount.port === 465;
    
    const transporter = nodemailer.createTransport({
      host: smtpAccount.host,
      port: smtpAccount.port,
      secure: secure,
      auth: {
        user: smtpAccount.username,
        pass: password,
      },
      tls: {
        // Do not fail on self-signed certificates
        rejectUnauthorized: false,
      },
    });

    // Create a deterministic tracking Message-ID
    const customMessageId = `<${payload.eventId}@primeinbox-track.com>`;

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${smtpAccount.fromName}" <${smtpAccount.fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || undefined,
      replyTo: smtpAccount.replyTo || undefined,
      messageId: customMessageId,
      headers: {
        "X-Campaign-Id": payload.campaignId,
        "X-Lead-Id": payload.leadId,
        "X-Step-Id": payload.stepId,
        "X-Event-Id": payload.eventId,
      },
    };

    // Dispatch email
    await transporter.sendMail(mailOptions);

    return {
      messageId: customMessageId,
    };
  }
}
