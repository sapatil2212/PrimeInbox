import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildReportData, RANGE_DAYS, RangeKey, ReportData } from "@/lib/reports";

export const runtime = "nodejs";

type Format = "xlsx" | "pdf" | "docx";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = (req.nextUrl.searchParams.get("format") || "xlsx") as Format;
    const rangeParam = req.nextUrl.searchParams.get("range") as RangeKey | null;
    const range: RangeKey = rangeParam && rangeParam in RANGE_DAYS ? rangeParam : "14d";

    const data = await buildReportData(session.companyId, range);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `analytics_report_${range}_${stamp}`;

    if (format === "xlsx") {
      const buffer = buildXlsx(data);
      return fileResponse(buffer, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
    if (format === "docx") {
      const buffer = await buildDocx(data);
      return fileResponse(buffer, `${filename}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }
    if (format === "pdf") {
      const buffer = await buildPdf(data);
      return fileResponse(buffer, `${filename}.pdf`, "application/pdf");
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/reports/export error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}

function fileResponse(buffer: Buffer | Uint8Array, filename: string, contentType: string) {
  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/* --------------------------------- Excel --------------------------------- */

function buildXlsx(data: ReportData): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const XLSX = require("xlsx");
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["PrimeInbox Analytics Report"],
    ["Range", data.range, "Generated", new Date(data.generatedAt).toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Emails Sent", data.summary.sent],
    ["Opened", data.summary.opened],
    ["Clicked", data.summary.clicked],
    ["Replied", data.summary.replied],
    ["Bounced", data.summary.bounced],
    ["Unsubscribed", data.summary.unsubscribed],
    ["Open Rate %", data.summary.openRate],
    ["Click Rate %", data.summary.clickRate],
    ["Reply Rate %", data.summary.replyRate],
    ["Bounce Rate %", data.summary.bounceRate],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  const campaignHeader = [
    "Campaign", "Status", "Leads", "Sent", "Opens", "Clicks", "Replies",
    "Bounces", "Unsub", "Open Rate %", "Click Rate %", "Reply Rate %",
  ];
  const campaignRows = data.campaigns.map((c) => [
    c.name, c.status, c.leadsCount, c.sent, c.opened, c.clicked, c.replied,
    c.bounced, c.unsubscribed, c.openRate, c.clickRate, c.replyRate,
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([campaignHeader, ...campaignRows]),
    "Campaigns"
  );

  const smtpHeader = ["From Email", "Host", "Status", "Health %", "Daily Used", "Daily Limit", "Total Sent", "Total Bounced"];
  const smtpRows = data.smtp.map((s) => [
    s.fromEmail, s.host, s.status, s.healthScore, s.currentDailyCount, s.dailyLimit, s.totalSent, s.totalBounced,
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([smtpHeader, ...smtpRows]),
    "SMTP Health"
  );

  const dailyHeader = ["Date", "Sends", "Opens", "Clicks", "Replies"];
  const dailyRows = data.dailySends.map((d) => [d.date, d.sends, d.opens, d.clicks, d.replies]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]),
    "Daily Timeline"
  );

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/* ---------------------------------- Word --------------------------------- */

async function buildDocx(data: ReportData): Promise<Buffer> {
  const {
    Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell,
    TextRun, WidthType, AlignmentType,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = require("docx");

  const headerRow = (cells: string[]) =>
    new TableRow({
      children: cells.map(
        (c) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 18 })] })],
            shading: { fill: "EEF2FF" },
          })
      ),
    });

  const bodyRow = (cells: (string | number)[]) =>
    new TableRow({
      children: cells.map(
        (c) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 18 })] })],
          })
      ),
    });

  const table = (header: string[], rows: (string | number)[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow(header), ...rows.map(bodyRow)],
    });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "PrimeInbox Analytics Report", bold: true, size: 40, color: "4F46E5" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Range: ${data.range}  •  Generated: ${new Date(data.generatedAt).toLocaleString()}`,
                size: 18,
                color: "71717A",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
          table(
            ["Metric", "Value"],
            [
              ["Emails Sent", data.summary.sent],
              ["Opened", `${data.summary.opened} (${data.summary.openRate}%)`],
              ["Clicked", `${data.summary.clicked} (${data.summary.clickRate}%)`],
              ["Replied", `${data.summary.replied} (${data.summary.replyRate}%)`],
              ["Bounced", `${data.summary.bounced} (${data.summary.bounceRate}%)`],
              ["Unsubscribed", data.summary.unsubscribed],
            ]
          ),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Campaign Performance", heading: HeadingLevel.HEADING_2 }),
          table(
            ["Campaign", "Status", "Sent", "Open %", "Reply %", "Bounce"],
            data.campaigns.map((c) => [c.name, c.status, c.sent, c.openRate, c.replyRate, c.bounced])
          ),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "SMTP Delivery Health", heading: HeadingLevel.HEADING_2 }),
          table(
            ["From Email", "Status", "Health %", "Daily Used / Limit", "Total Sent"],
            data.smtp.map((s) => [s.fromEmail, s.status, s.healthScore, `${s.currentDailyCount} / ${s.dailyLimit}`, s.totalSent])
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/* ---------------------------------- PDF ---------------------------------- */

async function buildPdf(data: ReportData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFDocument = require("pdfkit");

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const indigo = "#4f46e5";
    const gray = "#71717a";

    doc.fillColor(indigo).fontSize(22).text("PrimeInbox Analytics Report", { align: "center" });
    doc
      .fillColor(gray)
      .fontSize(9)
      .text(`Range: ${data.range}   •   Generated: ${new Date(data.generatedAt).toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    // Summary
    doc.fillColor("#18181b").fontSize(14).text("Summary");
    doc.moveDown(0.5);
    const summaryLines: [string, string][] = [
      ["Emails Sent", `${data.summary.sent}`],
      ["Opened", `${data.summary.opened} (${data.summary.openRate}%)`],
      ["Clicked", `${data.summary.clicked} (${data.summary.clickRate}%)`],
      ["Replied", `${data.summary.replied} (${data.summary.replyRate}%)`],
      ["Bounced", `${data.summary.bounced} (${data.summary.bounceRate}%)`],
      ["Unsubscribed", `${data.summary.unsubscribed}`],
    ];
    doc.fontSize(10).fillColor("#3f3f46");
    summaryLines.forEach(([k, v]) => doc.text(`${k}:  ${v}`));
    doc.moveDown(1);

    // Campaign table
    doc.fillColor("#18181b").fontSize(14).text("Campaign Performance");
    doc.moveDown(0.5);
    drawTable(
      doc,
      ["Campaign", "Status", "Sent", "Open%", "Reply%", "Bounce"],
      data.campaigns.map((c) => [
        truncate(c.name, 26), c.status, `${c.sent}`, `${c.openRate}`, `${c.replyRate}`, `${c.bounced}`,
      ]),
      [170, 70, 50, 55, 55, 55]
    );
    doc.moveDown(1);

    // SMTP table
    if (doc.y > 680) doc.addPage();
    doc.fillColor("#18181b").fontSize(14).text("SMTP Delivery Health");
    doc.moveDown(0.5);
    drawTable(
      doc,
      ["From Email", "Status", "Health%", "Daily", "Sent"],
      data.smtp.map((s) => [
        truncate(s.fromEmail, 30), s.status, `${s.healthScore}`, `${s.currentDailyCount}/${s.dailyLimit}`, `${s.totalSent}`,
      ]),
      [200, 80, 60, 80, 60]
    );

    doc.end();
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function drawTable(doc: any, header: string[], rows: string[][], widths: number[]) {
  const startX = doc.x;
  let y = doc.y;
  const rowH = 20;

  // Header
  doc.fontSize(9).fillColor("#ffffff");
  let x = startX;
  doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill("#4f46e5");
  header.forEach((h, i) => {
    doc.fillColor("#ffffff").text(h, x + 4, y + 6, { width: widths[i] - 8 });
    x += widths[i];
  });
  y += rowH;

  // Rows
  doc.fontSize(9);
  rows.forEach((row, idx) => {
    if (y > 790) {
      doc.addPage();
      y = doc.y;
    }
    if (idx % 2 === 0) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill("#f4f4f5");
    }
    x = startX;
    row.forEach((cell, i) => {
      doc.fillColor("#3f3f46").text(cell, x + 4, y + 6, { width: widths[i] - 8 });
      x += widths[i];
    });
    y += rowH;
  });
  doc.x = startX;
  doc.y = y + 4;
}
