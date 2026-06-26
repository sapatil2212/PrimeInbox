import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, dragDropData } = body;

    if (!prompt || !dragDropData) {
      return NextResponse.json({ error: "Prompt and dragDropData are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in environment variables." }, { status: 400 });
    }

    const systemInstructions = `
      You are an expert JSON-to-JSON editor assistant for email templates.
      You are editing a JSON structure named \`dragDropData\`.
      
      Structure specification of \`dragDropData\`:
      - globalSettings: Object containing:
        - fontFamily (string)
        - emailWidth (number)
        - backgroundColor (string)
        - contentBackgroundColor (string)
        - brandColors (array of strings)
        - buttonStyle (object: backgroundColor, textColor, borderRadius, padding)
      - sections: Array of objects containing:
        - id (string)
        - backgroundColor (string)
        - padding (object: top, bottom, left, right)
        - margin (object: top, bottom)
        - borderRadius (number)
        - visibility ("all" | "desktop" | "mobile")
        - columns: Array of objects containing:
          - id (string)
          - width (string, e.g. "100%", "50%", "33.33%")
          - blocks: Array of blocks containing:
            - id (string)
            - type ("heading" | "text" | "image" | "button" | "divider" | "spacer" | "logo" | "social" | "footer" | "signature" | "html")
            - content: Object varying by type. E.g. for heading/text, it has "text", alignment "align", "style" object (fontSize, color, fontWeight, padding). E.g. for button, it has "text", "url", alignment "align", "style" object (backgroundColor, textColor, borderRadius, padding).
      
      Task: Modify this JSON structure according to the user's prompt instruction.
      Instructions:
      1. Analyze the input JSON structure.
      2. Apply the user's changes (e.g., changing colors, text content, alignments, margins, padding, default button designs, adding blocks, duplicating elements, re-ordering, etc.).
      3. Return ONLY a single raw valid JSON block representing the updated \`dragDropData\` structure. Do NOT include markdown styling blocks, explanations, backticks, or any trailing/leading text.
      4. Ensure all existing block IDs and structures remain valid unless explicitly instructed to add/delete/reorder.
      5. The output must be parseable via JSON.parse().
    `;

    // Support dynamic fallback to guarantee api model compatibility across regions
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    ];

    let lastError = "No endpoints attempted";
    let responseText = "";
    let success = false;

    for (const url of endpoints) {
      try {
        console.log(`[AI-Editor] Probing Gemini endpoint: ${url.replace(apiKey, "HIDDEN_KEY")}`);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: systemInstructions },
                  { text: `Input dragDropData JSON: ${JSON.stringify(dragDropData)}` },
                  { text: `User request instruction: ${prompt}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          success = true;
          break; // Found working model endpoint!
        } else {
          const errText = await response.text();
          console.warn(`[AI-Editor] Endpoint ${url.split("/models/")[1]?.split(":")[0]} failed:`, errText);
          lastError = errText;
        }
      } catch (err: any) {
        console.warn(`[AI-Editor] Fetch error on endpoint:`, err.message);
        lastError = err.message;
      }
    }

    if (!success) {
      console.error("[AI-Editor] All Gemini models failed. Last error:", lastError);
      throw new Error(`Failed to contact Gemini API. Details: ${lastError}`);
    }

    // Clean JSON output
    let resultText = responseText.trim();
    if (resultText.startsWith("```json")) {
      resultText = resultText.slice(7);
    }
    if (resultText.endsWith("```")) {
      resultText = resultText.slice(0, -3);
    }
    resultText = resultText.trim();

    try {
      const parsedData = JSON.parse(resultText);
      return NextResponse.json({ success: true, dragDropData: parsedData });
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", resultText);
      return NextResponse.json({ error: "AI response did not return valid JSON. Please try rephrasing your request." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("POST /api/ai/edit-template error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
