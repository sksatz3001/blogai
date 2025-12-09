import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured", section: { title: "", items: [] } }, { status: 500 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, primaryKeyword, secondaryKeywords = [], targetWordCount = 1200, currentSectionTitle } = body;

    const sys = `You are an expert content strategist. Generate ONE improved section for a blog outline in JSON.`;
    const usr = `Blog Title: ${title}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}
Target Word Count: ${targetWordCount}
Current Section: ${currentSectionTitle}

Return ONLY JSON: { section: { title: string, items: [{ title: string }] } }
- The section title should be concise and powerful (H2 level)
- Include 2-4 subsections (H3 level) as 'items'
- No extra commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      messages: [ { role: "system", content: sys }, { role: "user", content: usr } ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || '{"section":{"title":"","items":[]}}';
    let json: any;
    try { 
      json = JSON.parse(content); 
    } catch {
      json = { section: { title: currentSectionTitle, items: [] } };
    }
    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    console.error("regen section error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to regenerate section", section: { title: "", items: [] } }, { status: 500 });
  }
}
