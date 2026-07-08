import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  try {
    const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!pageRes.ok) return NextResponse.json({ error: `Could not fetch page: ${pageRes.status}` }, { status: 400 });
    const html = await pageRes.text();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are an SEO expert. Analyse this HTML and find real SEO issues.

HTML (first 8000 chars):
${html.slice(0, 8000)}

Return ONLY valid JSON — no markdown, no backticks, no explanation. Just the raw JSON object:
{
  "score": <number 0-100>,
  "summary": "<one sentence>",
  "passed": <number of checks passed>,
  "issues": [
    {
      "id": "<unique-id>",
      "severity": "<critical|serious|warning|info>",
      "issue": "<what is wrong — be specific>",
      "fix": "<exact fix>",
      "codePreview": "<actual HTML causing the issue>",
      "codeFixed": "<corrected HTML>"
    }
  ]
}`
      }]
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    const result = JSON.parse(match[0]);
    return NextResponse.json({ status: "complete", scannedUrl: url, ...result });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}