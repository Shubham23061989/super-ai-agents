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
//       model: "claude-sonnet-4-5",
//       max_tokens: 2000,
//       messages: [
//         {
//           role: "user",
//           content: `You are an SEO expert. Analyze this HTML for SEO issues.

// HTML:
// ${html.slice(0, 8000)}

// IMPORTANT: Respond with raw JSON only. No markdown, no backticks, no explanation. Just the JSON object starting with { and ending with }.

// {
//   "score": 70,
//   "summary": "Found X issues",
//   "passed": 8,
//   "issues": [
//     {
//       "id": "meta-desc",
//       "severity": "critical",
//       "issue": "Missing meta description",
//       "fix": "Add <meta name='description' content='...'>"
//     }
//   ]
// }`,
//         },
//       ],
//     });

//     const rawText =
//       message.content[0].type === "text" ? message.content[0].text : "";

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
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{
        role: "user",
        content: `You are an SEO expert. Analyse this HTML and find real SEO issues.

HTML (first 10000 chars):
${html.slice(0, 10000)}

Return ONLY valid JSON — no markdown, no backticks, no explanation:
{
  "score": <number 0-100>,
  "summary": "<one sentence>",
  "passed": <number of checks passed>,
  "issues": [
    {
      "id": "<unique-id>",
      "severity": "<critical|serious|warning|info>",
      "issue": "<what is wrong — be specific>",
      "fix": "<exact fix — include code example>",
      "codePreview": "<actual HTML causing the issue>",
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