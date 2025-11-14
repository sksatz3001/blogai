import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }

    const body = await request.json();
    const { blogId, title, primaryKeyword, secondaryKeywords, targetWordCount, companyProfile } = body;

    // Verify blog belongs to user
    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, blogId),
    });

    if (!blog || blog.userId !== dbUser.id) {
      return new Response("Blog not found", { status: 404 });
    }

    // Get company details (either from profile or user)
    const companyName = companyProfile?.companyName || dbUser.companyName || "Our Company";
    const companyWebsite = companyProfile?.companyWebsite || dbUser.companyWebsite || "";
    const companyDescription = companyProfile?.description || dbUser.companyDescription || "";

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = `You are a Senior Content Strategist and Expert Blog Creator with 15+ years of experience crafting authoritative, SEO-optimized, long-form content that ranks on the first page of Google.

WRITING STYLE RULES:
- Use a rich, detailed, authoritative tone demonstrating E-E-A-T (Experience, Expertise, Authority, Trust)
- Write like a thought leader and industry expert
- Provide comprehensive insights and actionable guidance
- Each section must be thorough, valuable, and complete
- Use real-world examples, case studies, and data-driven insights
- Balance technical depth with accessibility
- Incorporate storytelling elements for engagement

CONTENT DEPTH REQUIREMENTS:
- Minimum 4-6 paragraphs per H2 section, 3-4 paragraphs per H3 subsection
- Each paragraph: 3-5 sentences of substantive content
- Include statistical data with inline citations
- Real-world case studies and success stories
- Common mistakes to avoid with solutions
- Step-by-step processes where applicable
- Expert quotes and industry insights
- Practical takeaways and action items
- Maintain overall keyword density between 0.8% and 2.5% (stay within this range)

SEO OPTIMIZATION:
- Primary keyword density: 0.8%–2.5% with natural placement
- Secondary keywords: 3-5 variations throughout
- LSI keywords: 8-12 semantic variations
- Target featured snippet with direct answer formats
- Use power words in headings
- Include "People Also Ask" style questions as H3 headings

FORMATTING STANDARDS:
- Output clean, valid, semantic HTML5
- Use proper semantic tags where helpful but DO NOT wrap everything in extra <div> or <section> wrappers; keep it lean
- Headings: <h1>-<h3> (maintain hierarchy, never skip levels)
- Every paragraph MUST be enclosed in a <p> tag. No stray text nodes.
- Lists must use <ul>/<ol> with <li>
- Quotes must use <blockquote>
- Emphasis: <strong>, <em>
- NO placeholder symbols or markdown
- NO image tags or image placeholders
- NO inline styles
- Add classes to heading tags for theming:
  * <h1 class="brand-primary-heading">
  * <h2 class="brand-secondary-heading">
  * <h3 class="brand-accent-heading">
- Add class "brand-paragraph" to every <p>
- Ensure a blank line (i.e. closing tag followed by newline) between major sections for readability.`;

          const userPrompt = `Create a complete, production-ready, beautifully formatted SEO-optimized blog post:

**Blog Title:** ${title}
**Primary Keyword:** ${primaryKeyword}
**Secondary Keywords:** ${secondaryKeywords?.join(", ") || "None"}
**Target Word Count:** ${targetWordCount} words (±5%)
**Company:** ${companyName}
**Company Website:** ${companyWebsite}
**Company Description:** ${companyDescription}
**Author:** ${dbUser.authorName || "Content Team"}

**STRUCTURE REQUIREMENTS:**

1. **SEO Title (H1)**
   - Include primary keyword in first 60 characters
   - Benefit-driven and solution-focused
   - Format: "[Primary Benefit]: [Solution] [Year/Guide]"

2. **Introduction (200-250 words)**
   - Compelling hook (statistic/question/problem)
   - 3-4 sentences context-setting
   - Featured Snippet Box (40-60 words):
     <div class="featured-snippet"><em>Quick Answer:</em> [Direct answer with primary keyword]</div>
   - List 4-6 specific outcomes reader will learn
   - Include trust signals
   - End with smooth transition

3. **Why This Topic Matters (H2)**
   - Present 3-4 current statistics with authoritative sources
   - Market context and relevance
   - Cost of inaction or missed opportunities

4. **Main Content Sections (4-6 H2s)** - Each with 2-3 H3 subsections:
   - Comprehensive Guide/How-To
   - Benefits & Advantages
   - Challenges & Solutions
   - Best Practices & Pro Tips
   - Tools & Resources
   - Case Studies/Examples
   - Future Trends & Insights

5. **Benefits vs. Challenges Analysis (H2)**
   - Key Benefits: 4 benefits with measurable outcomes
   - Common Challenges & Solutions: 3 challenges with actionable solutions

6. **Step-by-Step Implementation Guide (H2)**
   - 5-7 numbered steps with clear actions
   - Key considerations and expected outcomes
   - Success metrics

7. **Expert Tips & Best Practices (H2)**
   - 6-8 advanced strategies
   - Data-backed recommendations
   - Tools and resources

8. **Real-World Examples & Case Studies (H2)**
   - 2-3 mini case studies with challenge, solution, result

9. **Conclusion & Next Steps (150-200 words)**
   - 4-5 key takeaways
   - Reinforce value proposition with primary keyword
   - Clear, compelling call-to-action (don't mention "CTA")
   - Forward-looking statement

10. **FAQ Section (H2)**
  - Heading: <h2>Frequently Asked Questions</h2>
  - Provide 4-6 distinct H3 questions (concise, user-intent style) each followed by 1-2 <p> answers.
  - Avoid duplicating earlier headings; focus on actionable clarifications.

**OUTPUT FORMAT (STRICT):**
- Generate ONLY the blog body (NO <html>, <head>, or <body>)
- Start directly with <h1 class="brand-primary-heading"> ...
- USE ONLY these tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>. Nothing else.
- NO <article>, <section>, <div>, <span>, <style>, <script>, inline styles, or custom attributes beyond required classes.
- EVERY paragraph enclosed in <p class="brand-paragraph"> ... </p>
- Headings must include the proper brand heading class as specified.
- No images, captions, or placeholders.
- Hyperlinks ONLY for authoritative citations (max 6); use <a href="URL">Anchor</a>.
- Keyword density must be between 0.8% and 2.5% (stay in range).
- Return fully structured HTML with clear separation of sections (newline after each closing heading and after blocks of paragraphs).

**QUALITY TARGETS:**
- Content Score: 85+
- Readability: Flesch Reading Ease 50-70
- Time on Page: 4+ minutes target
- Professional formatting through semantic HTML
- Rich, engaging content with proper structure

Write the complete blog post now:`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: Math.ceil(targetWordCount * 2.5),
            stream: true,
          });

          let fullContent = "";

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              const data = JSON.stringify({ content, done: false });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Post-processing formatting utility
          const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,80);
          const promoteHeadings = (html: string) => {
            // Promote likely headings from paragraphs using heuristics
            return html.replace(/<p class="brand-paragraph">([^<]+)<\/p>/g, (m, text) => {
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
                return `<h2 class="brand-secondary-heading">${t.replace(/:$/, '')}</h2>`;
              }
              if (isQuestion && wordCount <= 18) {
                return `<h3 class="brand-accent-heading">${t}</h3>`;
              }
              if ((hasColon || (!endsWithPunct && wordCount <= 12 && /^[A-Z][A-Za-z0-9 &()\-\/,:]+$/.test(t)))) {
                return `<h2 class="brand-secondary-heading">${t.replace(/:$/, '')}</h2>`;
              }
              return m;
            });
          };
          const applyFormatting = (raw: string) => {
            let output = raw;
            // Remove any accidental high level wrappers
            output = output.replace(/<!DOCTYPE[^>]*>/gi, '')
              .replace(/<head>[\s\S]*?<\/head>/gi, '')
              .replace(/<\/?(html|body|article|section|main|header|footer|nav)[^>]*>/gi, '');
            // Normalize headings & later add IDs
            output = output.replace(/<h1(?![^>]*brand-primary-heading)[^>]*>/gi, '<h1 class="brand-primary-heading">');
            output = output.replace(/<h2(?![^>]*brand-secondary-heading)[^>]*>/gi, '<h2 class="brand-secondary-heading">');
            output = output.replace(/<h3(?![^>]*brand-accent-heading)[^>]*>/gi, '<h3 class="brand-accent-heading">');
            // Wrap bare lines (text not inside tags) into paragraphs
            const lines = output.split(/\n+/).map(l => l.trim());
            output = lines.map(l => {
              if (!l) return '';
              if (/^<h[1-3]|^<p|^<ul|^<ol|^<blockquote|^<li|^<strong|^<em|^<a /i.test(l)) return l; // already tagged
              return `<p class="brand-paragraph">${l}</p>`;
            }).join('\n');
            // Ensure all <p> have class brand-paragraph then promote headings
            output = output.replace(/<p(?![^>]*brand-paragraph)[^>]*>/gi, '<p class="brand-paragraph">');
            output = promoteHeadings(output);
            // Add IDs to headings if missing
            output = output.replace(/<h([1-3]) class="([^"]*)">([^<]+)<\/h\1>/g,(m,l,cls,text)=>{
              const id = slugify(text);
              return `<h${l} id="${id}" class="${cls}">${text}</h${l}>`;
            });
            // Collapse multiple spaces
            output = output.replace(/\s{2,}/g, ' ');
            return output.trim();
          };

          let cleanedContent = applyFormatting(fullContent);
          
          // (Further cleaning already handled by applyFormatting)

          // Save the generated content to database
          await db
            .update(blogs)
            .set({
              content: cleanedContent,
              htmlContent: cleanedContent,
              wordCount: cleanedContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
              updatedAt: new Date(),
            })
            .where(eq(blogs.id, blogId));

          // Send completion signal
          const doneData = JSON.stringify({ content: "", done: true });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Blog generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
