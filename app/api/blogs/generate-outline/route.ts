import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, companyProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
    if (!dbUser) return new Response("User not found", { status: 404 });

    const body = await request.json();
    const { blogId, title, primaryKeyword, secondaryKeywords = [], targetWordCount = 1200, companyProfileId } = body;

    // Validate blog ownership if blogId provided
    if (blogId) {
      const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
      if (!blog || blog.userId !== dbUser.id) return new Response("Blog not found", { status: 404 });
    }

    let company: any = null;
    if (companyProfileId) {
      company = await db.query.companyProfiles.findFirst({ where: eq(companyProfiles.id, Number(companyProfileId)) });
    }

    const sys = `You are an elite Content Strategist. Create a clear, SEO-aligned blog outline as structured JSON.`;
    const usr = `Create an outline for a blog.
Title: ${title}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}
Target Word Count: ${targetWordCount}
Company: ${(company?.companyName) || (dbUser.companyName || "Our Company")}

Rules:
- 6 to 8 top-level sections (H2)
- Each section 2-4 subsections (H3) when appropriate
- Order for narrative flow: intro -> value -> how-to -> examples -> pitfalls -> conclusion -> FAQ
- Output ONLY valid JSON with shape: { outline: [{ title: string, items?: [{ title: string }] }] }
- No extra text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      messages: [ { role: "system", content: sys }, { role: "user", content: usr } ],
      response_format: { type: "json_object" } as any,
    });

    const content = completion.choices[0]?.message?.content || "{\"outline\":[]}";
    let json: any = { outline: [] };
    try { json = JSON.parse(content); } catch {}

    return new Response(JSON.stringify(json), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-outline error", e);
    return new Response("Internal server error", { status: 500 });
  }
}
