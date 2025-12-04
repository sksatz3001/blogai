import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";

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

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = `You are a Senior Content Strategist and Expert Blog Creator with 15+ years of experience crafting authoritative, SEO-optimized, long-form content that ranks on the first page of Google and scores 85+ on SEO metrics.

CRITICAL SEO REQUIREMENTS (Must achieve 85+ SEO Score):
1. PRIMARY KEYWORD PLACEMENT:
   - Include primary keyword in H1 title (within first half for front-loading)
   - Use primary keyword in first 100 words of introduction
   - Include primary keyword in conclusion/last 100 words
   - Use primary keyword in 2-3 H2/H3 headings naturally
   - Maintain keyword density between 0.8% - 2.5% (approximately 8-15 mentions per 1000 words)
   - Bold/emphasize the primary keyword at least 2-3 times using <strong> tags

2. HEADING STRUCTURE (Critical for SEO score):
   - Must have exactly ONE <h1> tag containing the primary keyword
   - Use 5-7 <h2> headings (main sections)
   - Use 4-6 <h3> headings (subsections)
   - Include 2-3 question-format headings ending with "?" (important for AEO/voice search)
   - Every heading must be descriptive and include relevant keywords

3. CONTENT FORMATTING (Maximum points):
   - Use 2-3 bulleted/numbered lists (<ul> or <ol> with <li> items)
   - Use <strong> tags to emphasize key points (minimum 5 uses)
   - Every paragraph must be wrapped in <p class="brand-paragraph"> tags
   - Keep paragraphs concise (3-5 sentences, under 150 words each)
   - Vary sentence length for readability

4. E-E-A-T SIGNALS (Experience, Expertise, Authority, Trust):
   - Include phrases like "In my experience", "I've found that", "From our research"
   - Use "According to studies", "Research shows", "Data indicates", "Experts recommend"
   - Include specific statistics with numbers (e.g., "78% of businesses", "3x improvement")
   - Add authoritative external links (2-5 links to reputable sources)
   - Include balanced perspectives with "However", "On the other hand", "While"

5. AEO OPTIMIZATION (Answer Engine/Voice Search):
   - Include a "Frequently Asked Questions" section with 4-6 Q&A pairs
   - Format FAQ questions as <h3> headings with "?" ending
   - Provide direct, concise answers (40-60 words) after each question
   - Include "how to", "what is", "why", "when" question patterns

6. GEO OPTIMIZATION (Generative Engine/AI Search):
   - Include verifiable statistics and data points
   - Use specific numbers, percentages, and dates
   - Reference authoritative sources and studies
   - Provide comprehensive, well-structured information

WRITING STYLE RULES:
- Write with authority and expertise as a thought leader
- Use a conversational yet professional tone
- Include real-world examples and case studies
- Provide actionable insights and practical takeaways
- Balance technical depth with accessibility

OUTPUT REQUIREMENTS:
- Generate ONLY the blog body HTML (NO <html>, <head>, <body> tags)
- Start directly with <h1 class="brand-primary-heading">
- Use ONLY: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>
- NO <article>, <section>, <div>, <span>, inline styles, or scripts
- Every <p> must have class="brand-paragraph"
- Headings must have appropriate brand classes
- External links: <a href="URL" target="_blank" rel="noopener">Anchor Text</a>`;

          const userPrompt = `Create a complete, production-ready, SEO-optimized blog post that will score 85+ on SEO metrics:

**Blog Details:**
- Title: ${title}
- Primary Keyword: ${primaryKeyword} (MUST appear 8-15 times for optimal density)
- Secondary Keywords: ${secondaryKeywords?.join(", ") || "None"}
- Target Word Count: ${targetWordCount} words (±5%)
- Company: ${companyName}
- Company Website: ${companyWebsite}
- Company Description: ${companyDescription}
- Author: ${dbUser.authorName || "Content Team"}

**MANDATORY STRUCTURE (Follow exactly for maximum SEO score):**

1. **H1 Title** (Include "${primaryKeyword}" in first half)
   - Benefit-driven, solution-focused title
   - Format: "[Primary Benefit]: [Solution Involving ${primaryKeyword}] [Year/Guide]"

2. **Introduction** (200-250 words, "${primaryKeyword}" in first 2 sentences)
   - Hook with compelling statistic or question
   - State the problem and solution clearly
   - Include: "In my experience..." or "I've found that..." (E-E-A-T signal)
   - Featured Snippet Box:
     <p class="brand-paragraph"><strong>Quick Answer:</strong> [40-60 word direct answer with "${primaryKeyword}"]</p>
   - List 4-5 reader takeaways
   - Smooth transition to main content

3. **Why ${primaryKeyword} Matters** (H2 - Include keyword)
   - 3-4 current statistics with sources (use specific numbers: "73%", "2.5x")
   - Market context and relevance
   - Include: "Research shows..." or "According to studies..." (E-E-A-T)

4. **Main Content Sections** (4-5 H2s with 2-3 H3 subsections each):
   - **How to [Action with ${primaryKeyword}]** (H2)
   - **Key Benefits of ${primaryKeyword}** (H2 with bulleted list)
   - **Common ${primaryKeyword} Challenges and Solutions** (H2)
   - **Best Practices for ${primaryKeyword}** (H2 with numbered list)
   - **${primaryKeyword} Tools and Resources** (H2)

5. **Step-by-Step Implementation Guide** (H2)
   - 5-7 numbered steps with <ol> and <li>
   - Include "${primaryKeyword}" naturally in 2-3 steps
   - Add expected outcomes for each step

6. **Expert Tips & Best Practices** (H2)
   - 6-8 tips using <ul> and <li>
   - Use <strong> to emphasize key phrases
   - Include "Experts recommend..." phrases

7. **Real-World Examples & Case Studies** (H2)
   - 2-3 brief case studies with challenge → solution → result format
   - Include specific metrics: "increased by 45%", "reduced by 30%"

8. **Conclusion & Next Steps** (H2 - Include "${primaryKeyword}")
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

Write the complete, optimized blog post now:`;

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
