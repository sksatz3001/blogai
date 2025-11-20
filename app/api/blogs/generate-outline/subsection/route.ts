import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const { title, primaryKeyword, secondaryKeywords = [], targetWordCount = 1200, sectionTitle, currentSubTitle } = body;

    const sys = `You are an expert content strategist. Generate ONE improved subsection title for a blog outline in JSON.`;
    const usr = `Blog Title: ${title}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}
Target Word Count: ${targetWordCount}
Section Context (H2): ${sectionTitle}
Current Subsection: ${currentSubTitle}

Return ONLY JSON: { subsection: { title: string } }
- Keep it concise (H3)
- Actionable or question-style when fitting
- No extra commentary.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      messages: [ { role: "system", content: sys }, { role: "user", content: usr } ],
      response_format: { type: "json_object" } as any,
    });

    const content = completion.choices[0]?.message?.content || '{"subsection":{"title":""}}';
    return new Response(content, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("regen subsection error", e);
    return new Response("Internal server error", { status: 500 });
  }
}
