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
    You are an expert copywriter specializing in personalized, permission-based email campaigns.
    
    Task: Generate ${type === "sequence" ? "a 2-step email sequence" : type} based on the following:
    - Tone: ${tone}
    - Company / Product Context: ${companyContext || "AI Email Campaign SaaS"}
    - Recipient / Target Audience: ${recipientContext || "Business and marketing contacts"}
    - Additional Instructions / Focus: ${prompt || "Generate a compelling, respectful email message"}
    
    Formatting Guidelines:
    - Avoid spam words and exaggerated or unverifiable claims like "guarantee", "risk-free", "double your sales".
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
    if (tone === "marketing") return `An easier way to run campaigns for ${recipient}`;
    return "Collaboration request: PrimeInbox";
  }

  if (type === "cta") {
    return "Do you have 10 minutes this Thursday at 3 PM to chat?";
  }

  // Sequence or Full Email
  return `Subject: A simpler way to run your email campaigns

Hello {{firstName}},

I noticed your team at {{companyName}} is growing its email marketing.

We built ${company} to help teams like ${recipient} create personalized campaigns, connect their own sending accounts, and track opens and clicks — all from one dashboard.

Would you be open to a quick 5-minute chat this Thursday at 10 AM to see if it's a fit?

Best regards,
{{senderName}}

--
[Step 2 - Follow Up (3 days later)]

Subject: Re: A simpler way to run your email campaigns

Hi {{firstName}},

I know things get busy, so I wanted to follow up in case my last note got buried.

If it's helpful, I'd be happy to share a short overview of how ${company} could fit your team's workflow.

Is this worth a quick look next week?

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
        console.log(`[AI-Generator] Probing Gemini endpoint: ${url.replace(apiKey, "HIDDEN_KEY")}`);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          success = true;
          break;
        } else {
          const errText = await response.text();
          console.warn(`[AI-Generator] Endpoint ${url.split("/models/")[1]?.split(":")[0]} failed:`, errText);
          lastError = errText;
        }
      } catch (err: any) {
        console.warn(`[AI-Generator] Fetch error on endpoint:`, err.message);
        lastError = err.message;
      }
    }

    if (!success) {
      console.error("[AI-Generator] All Gemini models failed. Last error:", lastError);
      throw new Error(`Failed to contact Gemini API. Details: ${lastError}`);
    }

    return NextResponse.json({ success: true, text: responseText.trim() });
  } catch (error: any) {
    console.error("POST /api/ai/generate error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
