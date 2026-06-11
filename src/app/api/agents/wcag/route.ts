// import { NextRequest, NextResponse } from "next/server";
// import Anthropic from "@anthropic-ai/sdk";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// export async function POST(req: NextRequest) {
//   const { url } = await req.json();

//   if (!url) {
//     return NextResponse.json({ error: "URL required" }, { status: 400 });
//   }

//   try {
//     const pageResponse = await fetch(url, {
//       headers: { "User-Agent": "Mozilla/5.0" },
//     });
//     const html = await pageResponse.text();

//     const message = await anthropic.messages.create({
//       model: "claude-sonnet-4-20250514",
//       max_tokens: 2000,
//       messages: [
//         {
//           role: "user",
//           content: `You are a WCAG accessibility expert. Analyze this HTML for accessibility violations.

// HTML:
// ${html.slice(0, 8000)}

// IMPORTANT: Respond with raw JSON only. No markdown, no backticks, no explanation. Just the JSON object starting with { and ending with }.

// {
//   "score": 75,
//   "summary": "Found X issues",
//   "passed": 10,
//   "violations": [
//     {
//       "id": "alt-text",
//       "severity": "critical",
//       "issue": "Image missing alt text",
//       "element": "<img src='x.jpg'>",
//       "fix": "Add alt attribute"
//     }
//   ]
// }`,
//         },
//       ],
//     });

//     const rawText =
//       message.content[0].type === "text" ? message.content[0].text : "";

//     // Extract JSON safely
//     const jsonMatch = rawText.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       return NextResponse.json(
//         { error: "Could not parse AI response" },
//         { status: 500 }
//       );
//     }

//     const result = JSON.parse(jsonMatch[0]);
//     return NextResponse.json({ status: "complete", ...result });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!pageRes.ok) return NextResponse.json({ error: `Could not fetch page: ${pageRes.status}` }, { status: 400 });
    const html = await pageRes.text();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are a WCAG 2.1 accessibility expert. Analyse this HTML and find real accessibility violations.

HTML (first 10000 chars):
${html.slice(0, 10000)}

Return ONLY valid JSON — no markdown, no backticks, no explanation:
{
  "score": <number 0-100>,
  "summary": "<one sentence>",
  "passed": <number of checks passed>,
  "violations": [
    {
      "id": "<unique-id>",
      "severity": "<critical|serious|warning|info>",
      "issue": "<what is wrong — be specific, include element details>",
      "fix": "<exact fix — include code example>",
      "codePreview": "<actual HTML that has the issue>",
      "codeFixed": "<corrected HTML>"
    }
  ]
}`
      }]
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    const result = JSON.parse(match[0]);
    return NextResponse.json({ status: "complete", scannedUrl: url, ...result });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}