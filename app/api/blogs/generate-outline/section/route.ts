import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

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
      response_format: { type: "json_object" } as any,
    });

    const content = completion.choices[0]?.message?.content || '{"section":{"title":"","items":[]}}';
    return new Response(content, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("regen section error", e);
    return new Response("Internal server error", { status: 500 });
  }
}
