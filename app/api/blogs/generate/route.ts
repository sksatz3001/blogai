import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { getSystemPrompt } from "@/lib/system-prompts";

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

    // Check and deduct credits before generation
    const creditResult = await deductCredits({
      userId: dbUser.id,
      amount: CREDIT_COSTS.BLOG_GENERATION,
      type: 'blog_generation',
      description: 'Blog content generation',
      metadata: {
        blogId: blogId,
        blogTitle: title,
      },
    });

    if (!creditResult.success) {
      return new Response(JSON.stringify({ 
        error: creditResult.error || "Insufficient credits",
        creditsRequired: CREDIT_COSTS.BLOG_GENERATION,
        currentCredits: creditResult.newBalance,
      }), { 
        status: 402,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get company details (either from profile or user)
    const companyName = companyProfile?.companyName || dbUser.companyName || "Our Company";
    const companyWebsite = companyProfile?.companyWebsite || dbUser.companyWebsite || "";
    const companyDescription = companyProfile?.description || dbUser.companyDescription || "";

    // Fetch system prompt from DB (falls back to default)
    const blogSystemPrompt = await getSystemPrompt("blog_generation");

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = blogSystemPrompt;

          const userPrompt = `Create a complete, production-ready, SEO-optimized blog post that will score 85+ on SEO metrics.
Write like a human expert, NOT like AI. Use conversational tone, contractions, varied sentence lengths, and specific examples.

**Blog Details:**
- Title: ${title}
- Primary Keyword: ${primaryKeyword} (MUST appear 8-15 times for optimal density)
- Secondary Keywords: ${secondaryKeywords?.join(", ") || "None"}
- **STRICT Word Count: ${targetWordCount} words** (MANDATORY — you must write at least ${Math.floor(targetWordCount * 0.9)} words and no more than ${Math.ceil(targetWordCount * 1.1)} words of actual text content, not counting HTML tags)
- Company: ${companyName}
- Company Website: ${companyWebsite}
- Company Description: ${companyDescription}
- Author: ${dbUser.authorName || "Content Team"}
- Current Date Context: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

**MANDATORY STRUCTURE (Follow exactly for maximum SEO score):**

1. **H1 Title** (Include "${primaryKeyword}" in first half)
   - Benefit-driven, solution-focused title

2. **Introduction** (200-250 words, "${primaryKeyword}" in first 2 sentences)
   - Hook with a surprising statistic or provocative question
   - State the problem and solution clearly
   - Use natural E-E-A-T signals: "I've seen...", "From working with clients..."
   - Featured Snippet Box:
     <p class="brand-paragraph"><strong>Quick Answer:</strong> [40-60 word direct answer with "${primaryKeyword}"]</p>

3. **KEY TAKEAWAYS** (Right after introduction — MANDATORY):
   <div class="key-takeaways-box">
   <h3>⚡ Key Takeaways</h3>
   <ul>
   <li><strong>[Takeaway]</strong> - [Brief explanation]</li>
   </ul>
   </div>
   Include 4-6 takeaways summarizing the article's most valuable insights.

4. **Why ${primaryKeyword} Matters** (H2 - Include keyword)
   - 3-4 current statistics with sources (use specific numbers: "73%", "2.5x")
   - Include 1-2 fact callouts: <div class="fact-callout"><p class="brand-paragraph"><strong>[Stat]</strong> — [Source, year]</p></div>
   - Reference current trends in ${new Date().getFullYear()}
   - Include: "Research shows..." or "According to studies..." (E-E-A-T)

5. **Main Content Sections** (4-5 H2s with 2-3 H3 subsections each):
   - **How to [Action with ${primaryKeyword}]** (H2)
   - **Key Benefits of ${primaryKeyword}** (H2 with bulleted list)
   - **Common ${primaryKeyword} Challenges and Solutions** (H2)
   - **Best Practices for ${primaryKeyword}** (H2 with numbered list)
   - **${primaryKeyword} Tools and Resources** (H2)
   - Sprinkle 2-3 more <div class="fact-callout"> boxes in these sections with relevant statistics

6. **Step-by-Step Implementation Guide** (H2)
   - 5-7 numbered steps with <ol> and <li>
   - Include "${primaryKeyword}" naturally in 2-3 steps
   - Add expected outcomes for each step

7. **Expert Tips & Best Practices** (H2)
   - 6-8 tips using <ul> and <li>
   - Use <strong> to emphasize key phrases
   - Reference real tools, platforms, and methodologies

8. **Real-World Examples & Case Studies** (H2)
   - 2-3 brief case studies with challenge → solution → result format
   - Include specific metrics: "increased by 45%", "reduced by 30%"

9. **Conclusion & Next Steps** (H2 - Include "${primaryKeyword}")
   - 4-5 key takeaways in a bulleted list
   - Reinforce value with "${primaryKeyword}"
   - Clear call-to-action (don't say "CTA")
   - Include "${primaryKeyword}" in final sentence

9. **Frequently Asked Questions** (H2)
   - <h2 class="brand-secondary-heading">Frequently Asked Questions</h2>
   - 5-6 questions as H3 headings (each ending with "?")
   - Example formats: "What is ${primaryKeyword}?", "How does ${primaryKeyword} work?", "Why is ${primaryKeyword} important?"
   - Each answer: 1-2 <p> tags, 40-60 words, direct and concise

**SEO CHECKLIST (MUST ACHIEVE ALL):**
✓ Primary keyword "${primaryKeyword}" appears 8-15 times (0.8%-2.5% density)
✓ "${primaryKeyword}" in H1 (first half), first 100 words, and last 100 words
✓ "${primaryKeyword}" in 2-3 H2/H3 headings
✓ 5-7 H2 headings, 4-6 H3 headings
✓ 2-3 question headings ending with "?"
✓ 2-3 lists (ul/ol) with multiple items
✓ 5+ uses of <strong> for emphasis (include "${primaryKeyword}" at least twice)
✓ 2-5 external links to authoritative sources
✓ E-E-A-T phrases: "In my experience", "Research shows", "Experts recommend"
✓ Specific statistics and numbers throughout
✓ Short paragraphs (under 150 words each)

**OUTPUT FORMAT:**
- Start with: <h1 class="brand-primary-heading">[Title with ${primaryKeyword}]</h1>
- All headings with proper classes (brand-primary-heading, brand-secondary-heading, brand-accent-heading)
- All paragraphs: <p class="brand-paragraph">
- No images, no inline styles, no div/section/article tags
- External links: <a href="URL" target="_blank" rel="noopener">text</a>

Write the complete, optimized blog post now.

**⚠️ FINAL REMINDER — WORD COUNT IS NON-NEGOTIABLE:** You MUST write exactly ~${targetWordCount} words (minimum ${Math.floor(targetWordCount * 0.9)} words). Each H2 section needs substantial content with 3-5 detailed paragraphs per subsection. Do NOT write a short article. Expand each point with examples, statistics, practical advice, and real-world scenarios.`;

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
            max_tokens: Math.max(8000, Math.ceil(targetWordCount * 3)),
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
            // Strip markdown code block markers if present (```html ... ```)
            output = output
              .replace(/^[\s\n]*```(?:html)?[\s\n]*/i, '')
              .replace(/[\s\n]*```[\s\n]*$/i, '')
              .trim();
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

          // Strip markdown code block markers if present (```html ... ```)
          let strippedContent = fullContent
            .replace(/^\s*```(?:html)?\s*\n?/i, '')
            .replace(/\n?\s*```\s*$/i, '')
            .trim();
          
          let cleanedContent = applyFormatting(strippedContent);

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
