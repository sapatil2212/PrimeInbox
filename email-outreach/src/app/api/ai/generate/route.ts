import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

function buildSystemPrompt(
  type: string,
  tone: string,
  prompt: string,
  companyContext: string,
  recipientContext: string
): string {
  return `
    You are an expert copywriter specializing in high-converting cold email outreach.
    
    Task: Generate ${type === "sequence" ? "a 2-step cold email sequence" : type} based on the following:
    - Tone: ${tone}
    - Company / Product Context: ${companyContext || "AI Email Outreach SaaS"}
    - Recipient / Target Audience: ${recipientContext || "Sales leaders, DevRel managers"}
    - Additional Instructions / Focus: ${prompt || "Generate a compelling outreach message"}
    
    Formatting Guidelines:
    - Avoid spam words like "guarantee", "risk-free", "double your sales".
    - Keep emails under 150 words. Focus on a single clear call-to-action (CTA).
    - Use placeholders like {{firstName}} for personalization.
    - If generating a sequence, separate Step 1 and Step 2 clearly.
    - Write subjects as short, intrigue-driven titles.
    - Return ONLY the clean generated output (Subject and Body) without wrapping in Markdown blocks.
  `;
}

function generateMockAiResponse(
  type: string,
  tone: string,
  prompt: string,
  companyContext: string,
  recipientContext: string
): string {
  const company = companyContext || "PrimeInbox SaaS";
  const recipient = recipientContext || "Sales Executive";
  const focus = prompt || "interest in collaboration";

  if (type === "subject") {
    if (tone === "sales") return `Quick question regarding ${company}?`;
    if (tone === "marketing") return `Unlocking outreach scaling for ${recipient}`;
    return "Collaboration request: PrimeInbox";
  }

  if (type === "cta") {
    return "Do you have 10 minutes this Thursday at 3 PM to chat?";
  }

  // Sequence or Full Email
  return `Subject: Quick question regarding {{companyName}}?

Hello {{firstName}},

I noticed your team is actively looking to scale outbound pipeline. 

We built ${company} specifically to help teams targeting ${recipient} automate their email rotation and AI content generation without hitting spam limits.

Most developers see a 3x lift in reply rates within the first 14 days of connecting. 

Would you be open to a quick 5-minute feedback chat this Thursday at 10 AM?

Best regards,
{{senderName}}

--
[Step 2 - Follow Up (3 days later)]

Subject: Re: Quick question regarding {{companyName}}?

Hi {{firstName}},

I know things get busy. I wanted to share a quick case study: our partners at DevCorp increased meetings booked by 40% last month using ${company}.

Is this something worth exploring for your team next week?

Best,
{{senderName}}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, tone, prompt, companyContext, recipientContext } = body;

    if (!type || !tone) {
      return NextResponse.json({ error: "Type and tone are required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback: Generate context-aware mock content
      const mockResult = generateMockAiResponse(type, tone, prompt, companyContext, recipientContext);
      return NextResponse.json({ success: true, text: mockResult });
    }

    // Call Google Gemini API
    const systemPrompt = buildSystemPrompt(type, tone, prompt, companyContext, recipientContext);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API call failed:", errText);
      throw new Error("Failed to contact Gemini API");
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI Generation failed.";

    return NextResponse.json({ success: true, text: resultText.trim() });
  } catch (error: any) {
    console.error("POST /api/ai/generate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
