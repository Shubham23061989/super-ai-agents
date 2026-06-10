import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const pageResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await pageResponse.text();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a WCAG accessibility expert. Analyze this HTML for accessibility violations.

HTML:
${html.slice(0, 8000)}

IMPORTANT: Respond with raw JSON only. No markdown, no backticks, no explanation. Just the JSON object starting with { and ending with }.

{
  "score": 75,
  "summary": "Found X issues",
  "passed": 10,
  "violations": [
    {
      "id": "alt-text",
      "severity": "critical",
      "issue": "Image missing alt text",
      "element": "<img src='x.jpg'>",
      "fix": "Add alt attribute"
    }
  ]
}`,
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON safely
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ status: "complete", ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}