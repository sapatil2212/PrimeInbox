import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

// ─── Palette (all light / professional) ──────────────────────────────────────
const C = {
  black:     rgb(0.08, 0.08, 0.10),
  dark:      rgb(0.18, 0.20, 0.26),
  body:      rgb(0.30, 0.33, 0.40),
  muted:     rgb(0.52, 0.55, 0.62),
  subtle:    rgb(0.70, 0.72, 0.76),
  border:    rgb(0.88, 0.89, 0.92),
  bgLight:   rgb(0.97, 0.97, 0.98),
  bgFaint:   rgb(0.95, 0.96, 0.99),   // very faint indigo tint for header
  white:     rgb(1.00, 1.00, 1.00),
  accent:    rgb(0.25, 0.40, 0.85),   // medium indigo for accent text/lines
  accentFaint: rgb(0.90, 0.93, 0.99), // ultra-light indigo fill
  green:     rgb(0.08, 0.55, 0.38),
  greenFaint:rgb(0.93, 0.98, 0.95),
  redText:   rgb(0.70, 0.10, 0.10),
  redFaint:  rgb(0.99, 0.94, 0.94),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  description: string;
  period: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  internalInvoiceId: string;
  invoiceNumber: string;
  zohoTransactionId?: string;
  zohoSessionId?: string;
  zohoMandateId?: string;
  zohoCustomerId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;
  companyName: string;
  companySlug: string;
  companyEmail?: string;
  planId: string;
  planName: string;
  paymentMode?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeWinAnsi(str: string): string {
  return str.replace(/[^\x00-\xFF]/g, "?");
}

function formatINR(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function rect(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  color: ReturnType<typeof rgb>
) {
  page.drawRectangle({ x, y, width: w, height: h, color });
}

function borderedRect(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  fill: ReturnType<typeof rgb>,
  border: ReturnType<typeof rgb>,
  borderWidth = 0.5
) {
  page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: border, borderWidth });
}

function hline(
  page: PDFPage,
  x1: number, y: number, x2: number,
  color: ReturnType<typeof rgb>,
  thickness = 0.5
) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });
}

function drawText(
  page: PDFPage,
  str: string,
  x: number, y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  maxWidth?: number
) {
  const s = sanitizeWinAnsi((str ?? "").toString());
  let out = s;
  if (maxWidth) {
    while (out.length > 0 && font.widthOfTextAtSize(out, size) > maxWidth) {
      out = out.slice(0, -1);
    }
    if (out !== s) out += "...";
  }
  page.drawText(out, { x, y, font, size, color });
}

function tw(str: string, font: PDFFont, size: number) {
  return font.widthOfTextAtSize(sanitizeWinAnsi(str), size);
}

// ─── Main PDF generator ────────────────────────────────────────────────────────
export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([595, 842]); // A4

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const oblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const W  = 595;
  const H  = 842;
  const ML = 48;
  const MR = 48;
  const CW = W - ML - MR;

  let y = H;

  // ── HEADER BAND (faint indigo tint, no dark background) ──────────────────────
  rect(page, 0, H - 88, W, 88, C.bgFaint);
  // Thin accent line at very top
  rect(page, 0, H - 2, W, 2, C.accent);
  // Thin separator at bottom of header
  hline(page, 0, H - 88, W, C.border, 0.8);

  // Logo
  let logoEmbedded = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo", "primeinbox-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg   = await pdfDoc.embedPng(logoBytes);
      const dims      = logoImg.scaleToFit(120, 36);
      page.drawImage(logoImg, {
        x:      ML,
        y:      H - 88 + (88 - dims.height) / 2,
        width:  dims.width,
        height: dims.height,
      });
      logoEmbedded = true;
    }
  } catch (_) { /* fallback below */ }

  if (!logoEmbedded) {
    drawText(page, "PrimeInbox", ML, H - 48, bold, 16, C.accent);
    drawText(page, "Email Outreach Platform", ML, H - 63, reg, 8, C.muted);
  }

  // Right side of header: "TAX INVOICE" label + invoice number + status
  const labelX = W - MR;
  drawText(page, "TAX INVOICE", labelX - tw("TAX INVOICE", bold, 14), H - 40, bold, 14, C.dark);
  drawText(page, data.invoiceNumber, labelX - tw(data.invoiceNumber, bold, 9), H - 57, bold, 9, C.accent);

  // Status chip
  const statusLabel  = data.status;
  const statusColor  = data.status === "PAID" ? C.green : data.status === "FAILED" ? C.redText : C.muted;
  const statusWidth  = tw(statusLabel, bold, 8) + 14;
  const statusX      = W - MR - statusWidth;
  const statusBg     = data.status === "PAID" ? C.greenFaint : data.status === "FAILED" ? C.redFaint : C.bgLight;
  const statusBorder = data.status === "PAID" ? rgb(0.65, 0.90, 0.78) : data.status === "FAILED" ? rgb(0.90, 0.70, 0.70) : C.border;
  borderedRect(page, statusX, H - 76, statusWidth, 15, statusBg, statusBorder);
  drawText(page, statusLabel, statusX + 7, H - 73, bold, 8, statusColor);

  y = H - 88 - 22;

  // ── META INFO ROW (Invoice Date, Due Date, Workspace) ─────────────────────
  const col1 = ML;
  const col2 = ML + 150;
  const col3 = ML + 310;

  drawText(page, "INVOICE DATE",    col1, y, bold, 6.5, C.muted);
  drawText(page, "DUE DATE",        col2, y, bold, 6.5, C.muted);
  drawText(page, "WORKSPACE",       col3, y, bold, 6.5, C.muted);
  y -= 14;
  drawText(page, formatDate(data.invoiceDate),                               col1, y, bold, 10, C.dark);
  drawText(page, data.dueDate ? formatDate(data.dueDate) : "N/A",           col2, y, reg,  10, C.body);
  drawText(page, "/" + data.companySlug,                                     col3, y, reg,  10, C.body, CW - 310 - 10);
  y -= 22;

  hline(page, ML, y, W - MR, C.border, 0.6);
  y -= 18;

  // ── BILLED TO ──────────────────────────────────────────────────────────────
  drawText(page, "BILLED TO", ML, y, bold, 6.5, C.muted);
  y -= 14;
  drawText(page, data.companyName, ML, y, bold, 13, C.dark, CW - 120);
  y -= 14;
  if (data.companyEmail) {
    drawText(page, data.companyEmail, ML, y, reg, 9, C.body, 260);
    y -= 13;
  }
  y -= 12;

  hline(page, ML, y, W - MR, C.border, 0.6);
  y -= 18;

  // ── LINE ITEMS TABLE ───────────────────────────────────────────────────────
  // A4 content width = 499pt (595 - 48*2)
  // Col layout: DESC(0-160) | PERIOD(168-308) | QTY(316-340) | UNIT(348-440) | TOTAL(448-499)
  const tDesc    = ML;           // left-aligned, max 155pt
  const tPeriod  = ML + 168;    // left-aligned, max 130pt
  const tQtyC    = ML + 334;    // center of QTY col (±14)
  const tUnitR   = ML + 446;    // RIGHT edge of UNIT PRICE col
  const tTotalR  = W - MR;      // RIGHT edge of TOTAL col (= 547)

  // Header row background
  rect(page, ML - 6, y - 4, CW + 12, 20, C.bgLight);
  hline(page, ML - 6, y - 4,  W - MR + 6, C.border, 0.4);
  hline(page, ML - 6, y + 16, W - MR + 6, C.border, 0.4);

  const thY = y + 3;
  drawText(page, "DESCRIPTION", tDesc,   thY, bold, 6.5, C.muted);
  drawText(page, "PERIOD",      tPeriod, thY, bold, 6.5, C.muted);
  // Right-align QTY, UNIT PRICE, TOTAL headers to match value alignment
  const qtyHdr   = "QTY";
  const unitHdr  = "UNIT PRICE";
  const totalHdr = "TOTAL";
  drawText(page, qtyHdr,   tQtyC  - tw(qtyHdr,   bold, 6.5) / 2, thY, bold, 6.5, C.muted);
  drawText(page, unitHdr,  tUnitR - tw(unitHdr,   bold, 6.5),     thY, bold, 6.5, C.muted);
  drawText(page, totalHdr, tTotalR - tw(totalHdr, bold, 6.5),     thY, bold, 6.5, C.muted);
  y -= 24;

  for (let i = 0; i < data.lineItems.length; i++) {
    const item = data.lineItems[i];
    if (i % 2 === 0) {
      rect(page, ML - 6, y - 5, CW + 12, 22, rgb(0.99, 0.99, 1.00));
    }
    // Description — left-aligned, max 155pt
    drawText(page, item.description, tDesc,   y, bold, 9.5, C.dark, 155);
    // Period — left-aligned, max 130pt
    drawText(page, item.period,      tPeriod, y, reg,  9,   C.body, 130);
    // QTY — centered
    const qtyStr = String(item.quantity);
    drawText(page, qtyStr, tQtyC - tw(qtyStr, reg, 9.5) / 2, y, reg, 9.5, C.dark);
    // Unit Price — right-aligned to tUnitR
    const upStr = formatINR(item.unitPrice);
    drawText(page, upStr, tUnitR - tw(upStr, reg, 9.5), y, reg, 9.5, C.body);
    // Total — right-aligned to tTotalR
    const totStr = formatINR(item.total);
    drawText(page, totStr, tTotalR - tw(totStr, bold, 9.5), y, bold, 9.5, C.dark);
    hline(page, ML - 6, y - 5, W - MR + 6, C.border, 0.3);
    y -= 24;
  }


  hline(page, ML - 6, y + 20, W - MR + 6, C.border, 0.5);
  y -= 10;

  // ── TOTAL SECTION (right-aligned) ─────────────────────────────────────────
  const totLX  = W - MR - 195;   // left edge of totals block
  const totRX  = W - MR;         // right edge

  // Note line
  drawText(page, "* Price is inclusive of all applicable taxes.", ML, y, oblique, 7.5, C.muted);
  y -= 20;

  // Thin rule above total
  hline(page, totLX, y + 14, totRX, C.border, 0.5);
  y -= 2;

  // Grand total row — faint accent bg
  rect(page, totLX - 4, y - 6, totRX - totLX + 8, 24, C.accentFaint);
  borderedRect(page, totLX - 4, y - 6, totRX - totLX + 8, 24, C.accentFaint, C.accent, 0.6);
  drawText(page, "TOTAL AMOUNT",        totLX, y + 4, bold, 8.5, C.accent);
  const gtStr = formatINR(data.grandTotal);
  drawText(page, gtStr, totRX - tw(gtStr, bold, 13), y + 3, bold, 13, C.accent);
  const curStr = data.currency.toUpperCase();
  drawText(page, curStr, totLX + tw("TOTAL AMOUNT", bold, 8.5) + 6, y + 4, reg, 7.5, C.subtle);
  y -= 36;

  // ── PAID / STATUS STAMP ───────────────────────────────────────────────────
  if (data.status === "PAID") {
    const stampW = 64; const stampH = 18;
    borderedRect(page, ML, y - 4, stampW, stampH, C.greenFaint, rgb(0.65, 0.90, 0.78), 0.8);
    drawText(page, "PAID", ML + stampW / 2 - tw("PAID", bold, 9) / 2, y + 1, bold, 9, C.green);
  } else if (data.status === "FAILED") {
    const stampW = 70; const stampH = 18;
    borderedRect(page, ML, y - 4, stampW, stampH, C.redFaint, rgb(0.90, 0.70, 0.70), 0.8);
    drawText(page, "FAILED", ML + stampW / 2 - tw("FAILED", bold, 9) / 2, y + 1, bold, 9, C.redText);
  }
  y -= 30;

  // ── REFERENCE IDS ─────────────────────────────────────────────────────────
  hline(page, ML, y, W - MR, C.border, 0.6);
  y -= 16;

  drawText(page, "PAYMENT & TRANSACTION REFERENCE", ML, y, bold, 6.5, C.muted);
  y -= 14;

  const refs: [string, string][] = [];
  refs.push(["Internal Invoice ID", data.internalInvoiceId]);
  if (data.zohoTransactionId) refs.push(["Zoho Transaction ID",  data.zohoTransactionId]);
  if (data.zohoSessionId)     refs.push(["Zoho Session ID",      data.zohoSessionId]);
  if (data.zohoMandateId)     refs.push(["Zoho Mandate ID",      data.zohoMandateId]);
  if (data.zohoCustomerId)    refs.push(["Zoho Customer ID",     data.zohoCustomerId]);
  if (data.paymentMode)       refs.push(["Payment Mode",         data.paymentMode]);
  if (data.periodStart && data.periodEnd) {
    refs.push(["Subscription Period",
      `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`]);
  }
  refs.push(["Plan", `PrimeInbox ${data.planName}`]);

  // Two-column grid
  const rCol1 = ML;
  const rCol2 = ML + CW / 2 + 8;
  const colW  = CW / 2 - 16;

  // Faint bg for reference block
  const refBlockH = Math.ceil(refs.length / 2) * 30 + 10;
  rect(page, ML - 6, y - refBlockH + 24, CW + 12, refBlockH, C.bgLight);
  borderedRect(page, ML - 6, y - refBlockH + 24, CW + 12, refBlockH, C.bgLight, C.border, 0.4);

  for (let i = 0; i < refs.length; i += 2) {
    const [l1, v1] = refs[i];
    drawText(page, l1, rCol1, y,      bold, 6.5, C.muted);
    drawText(page, v1, rCol1, y - 11, reg,  9,   C.dark, colW);
    if (refs[i + 1]) {
      const [l2, v2] = refs[i + 1];
      drawText(page, l2, rCol2, y,      bold, 6.5, C.muted);
      drawText(page, v2, rCol2, y - 11, reg,  9,   C.dark, colW);
    }
    y -= 30;
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  // Light footer line
  hline(page, 0, 40, W, C.border, 0.8);
  rect(page, 0, 0, W, 40, C.bgFaint);

  drawText(page,
    "System-generated document. For support: support@primeinbox.com",
    ML, 24, oblique, 7, C.muted);

  const genStr = `Generated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;
  drawText(page, genStr, W - MR - tw(genStr, reg, 7), 24, reg, 7, C.subtle);
  drawText(page, "primeinbox.com", ML, 12, reg, 7, C.subtle);
  const pgStr = "Page 1 of 1";
  drawText(page, pgStr, W - MR - tw(pgStr, reg, 7), 12, reg, 7, C.subtle);

  return pdfDoc.save();
}
