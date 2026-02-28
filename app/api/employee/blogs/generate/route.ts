import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";
import { db } from "@/db";
import { blogs, employees, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employee
    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
      with: {
        user: true,
      },
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

  const { blogId, title, primaryKeyword, secondaryKeywords, targetWordCount } = await req.json();

    if (!blogId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user's company info
    const user = employee.user;

    // Build the prompt
  const systemPrompt = `You are an expert SEO blog writer. Generate a comprehensive, engaging, and SEO-optimized blog post with STRICT semantic HTML formatting.

Company: ${user.companyName || "the company"}
${user.companyDescription ? `About: ${user.companyDescription}` : ""}
Primary Keyword: ${primaryKeyword || title}
${secondaryKeywords && secondaryKeywords.length > 0 ? `Secondary Keywords: ${secondaryKeywords.join(", ")}` : ""}
Target Word Count: ${targetWordCount || 1000}

STRICT FORMAT RULES:
- Use ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>
- EVERY paragraph MUST be inside <p class="brand-paragraph"> ... </p>
- Headings MUST include brand classes:
  * <h1 class="brand-primary-heading">
  * <h2 class="brand-secondary-heading">
  * <h3 class="brand-accent-heading">
- No images, no <div>, <section>, <article>, <span>, inline styles, or style/script tags.
- Lists must be properly wrapped in <ul>/<ol> with <li>.
- Include a featured snippet style quote using <blockquote> if applicable.
- Maintain keyword density between 0.8% and 2.5% for the primary keyword.
- Provide clean, production-ready HTML with spacing (newline after block closing tags).
- NO meta description comment, NO placeholders.
- Hyperlinks only for authoritative citations (max 5).`;

  const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let accumulatedContent = "";

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Write a complete, SEO-optimized blog post about: "${title}"`,
              },
            ],
            temperature: 0.7,
            max_tokens: Math.ceil((targetWordCount || 1000) * 2.5),
            stream: true,
          });

          // Formatting helper similar to admin route
          const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,80);
          const promoteHeadings = (html: string) => {
            return html.replace(/<p class=\"brand-paragraph\">([^<]+)<\/p>/g, (m, text) => {
              const t = String(text).trim();
              const wordCount = t.split(/\s+/).length;
              const endsWithPunct = /[\.!]$/.test(t);
              const isQuestion = /\?$/.test(t);
              const hasColon = /:\s*$/.test(t);
              const knownH2 = [
                'Why This Topic Matters',
                'Benefits & Advantages',
                'Challenges & Solutions',
                'Best Practices & Pro Tips',
                'Tools & Resources',
                'Case Studies/Examples',
                'Future Trends & Insights',
                'Benefits vs. Challenges Analysis',
                'Step-by-Step Implementation Guide',
                'Expert Tips & Best Practices',
                'Real-World Examples & Case Studies',
                'Conclusion & Next Steps',
                'Frequently Asked Questions',
                'FAQ'
              ];
              if (knownH2.includes(t.replace(/:$/, ''))) {
                return `<h2 class=\"brand-secondary-heading\">${t.replace(/:$/, '')}</h2>`;
              }
              if (isQuestion && wordCount <= 18) {
                return `<h3 class=\"brand-accent-heading\">${t}</h3>`;
              }
              if ((hasColon || (!endsWithPunct && wordCount <= 12 && /^[A-Z][A-Za-z0-9 &()\-\/,:]+$/.test(t)))) {
                return `<h2 class=\"brand-secondary-heading\">${t.replace(/:$/, '')}</h2>`;
              }
              return m;
            });
          };
          const applyFormatting = (raw: string) => {
            let output = raw;
            // Strip markdown code block markers if present (```html ... ```)
            output = output
              .replace(/^\s*```(?:html)?\s*\n?/i, '')
              .replace(/\n?\s*```\s*$/i, '')
              .trim();
            output = output.replace(/<!DOCTYPE[^>]*>/gi, '')
              .replace(/<head>[\s\S]*?<\/head>/gi, '')
              .replace(/<\/?(html|body|article|section|main|header|footer|nav|div|span)[^>]*>/gi, '');
            // Ensure heading classes
            output = output.replace(/<h1(?![^>]*brand-primary-heading)[^>]*>/gi, '<h1 class="brand-primary-heading">');
            output = output.replace(/<h2(?![^>]*brand-secondary-heading)[^>]*>/gi, '<h2 class="brand-secondary-heading">');
            output = output.replace(/<h3(?![^>]*brand-accent-heading)[^>]*>/gi, '<h3 class="brand-accent-heading">');
            const lines = output.split(/\n+/).map(l => l.trim());
            output = lines.map(l => {
              if (!l) return '';
              if (/^<h[1-3]|^<p|^<ul|^<ol|^<blockquote|^<li|^<strong|^<em|^<a /i.test(l)) return l;
              return `<p class="brand-paragraph">${l}</p>`;
            }).join('\n');
            output = output.replace(/<p(?![^>]*brand-paragraph)[^>]*>/gi, '<p class=\"brand-paragraph\">');
            output = promoteHeadings(output);
            output = output.replace(/<h([1-3]) class="([^"]*)">([^<]+)<\/h\1>/g,(m,l,cls,text)=>{
              const id = slugify(text);
              return `<h${l} id="${id}" class="${cls}">${text}</h${l}>`;
            });
            return output.trim();
          };

          for await (const chunk of completion) {
            const contentDelta = chunk.choices[0]?.delta?.content || "";
            if (contentDelta) {
              accumulatedContent += contentDelta;
              // Stream a formatted incremental version (basic throttling could be added if needed)
              const formattedPartial = applyFormatting(accumulatedContent);
              controller.enqueue(encoder.encode(formattedPartial));
            }
          }

          const finalFormatted = applyFormatting(accumulatedContent);

          await db
            .update(blogs)
            .set({
              content: finalFormatted,
              htmlContent: finalFormatted,
            })
            .where(eq(blogs.id, blogId));

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate blog error:", error);
    return NextResponse.json(
      { error: "Failed to generate blog" },
      { status: 500 }
    );
  }
}
