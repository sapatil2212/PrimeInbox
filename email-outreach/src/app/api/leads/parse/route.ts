import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as xlsx from "xlsx";
import mammoth from "mammoth";

// Polyfill missing DOM globals for pdf-parse/pdfjs under Node.js
if (typeof global !== "undefined") {
  if (typeof (global as any).DOMMatrix === "undefined") {
    (global as any).DOMMatrix = class DOMMatrix {};
  }
  if (typeof (global as any).ImageData === "undefined") {
    (global as any).ImageData = class ImageData {};
  }
  if (typeof (global as any).Path2D === "undefined") {
    (global as any).Path2D = class Path2D {};
  }
}

const pdf = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let headers: string[] = [];
    let rows: string[][] = [];

    // Helper to extract emails from raw text
    const extractEmails = (text: string) => {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const found = text.match(emailRegex) || [];
      // Deduplicate emails
      const uniqueEmails = Array.from(new Set(found.map(e => e.toLowerCase())));
      return uniqueEmails.map(email => [email]);
    };

    // Parse Excel/CSV
    if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to array of arrays
      const data = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });
      
      if (data.length > 0) {
        // First row is headers
        headers = data[0].map(h => String(h).trim());
        // Remaining are rows
        rows = data.slice(1).map(row => 
          // ensure row length matches headers
          headers.map((_, i) => String(row[i] || "").trim())
        );
      }
    } 
    // Parse PDF
    else if (fileName.endsWith(".pdf")) {
      const data = await pdf(buffer);
      headers = ["email"];
      rows = extractEmails(data.text);
    }
    // Parse Word
    else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      headers = ["email"];
      rows = extractEmails(result.value);
    } 
    else {
      return NextResponse.json({ error: "Unsupported file format. Please upload CSV, Excel, PDF, or Word." }, { status: 400 });
    }

    return NextResponse.json({ headers, rows });
  } catch (error: any) {
    console.error("POST /api/leads/parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse document" }, { status: 500 });
  }
}
