import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users, blogImages, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateAndStoreImage, isExternalBackendConfigured } from "@/lib/image-backend";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";
import { NextResponse } from "next/server";

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });
  }
  return openai;
}

function slugify(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,80); }

function injectImages(html: string, images: Array<{ afterH2: string; url: string; alt: string }>) {
  let out = html;
  // Group images by their target H2 to inject them all together
  const imagesByH2 = new Map<string, Array<{ url: string; alt: string }>>();
  for (const img of images) {
    const existing = imagesByH2.get(img.afterH2) || [];
    existing.push({ url: img.url, alt: img.alt });
    imagesByH2.set(img.afterH2, existing);
  }
  
  // Now inject all images for each H2 at once
  for (const [h2Text, imgs] of imagesByH2.entries()) {
    const h2Regex = new RegExp(`<h2[^>]*>(?:\\s*)${h2Text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<\\/h2>`, 'i');
    const imageHtml = imgs.map(img => `<p class="brand-paragraph"><img src="${img.url}" alt="${img.alt}" class="rounded-lg max-w-full h-auto my-4" style="display: block; margin: 1rem auto;" loading="lazy"/></p>`).join('\n');
    out = out.replace(h2Regex, (m) => `${m}\n${imageHtml}`);
  }
  return out;
}

/**
 * Find relevant YouTube videos and inject embed code into blog HTML
 * Tries to find 1-2 relevant videos and places them in the middle/end of content
 */
async function findAndInjectVideos(title: string, keyword: string, html: string): Promise<string | null> {
  try {
    // Search for a relevant YouTube video
    const searchQuery = `${keyword} tutorial guide ${new Date().getFullYear()}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodedQuery}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    
    if (!response.ok) return null;
    
    const pageHtml = await response.text();
    // Extract video IDs from search results
    const videoIdMatches = [...pageHtml.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const uniqueIds = [...new Set(videoIdMatches.map(m => m[1]))].slice(0, 2);
    
    if (uniqueIds.length === 0) return null;
    
    // Find H2 headings to inject video after (prefer middle-to-end sections)
    const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi));
    if (h2Matches.length < 3) return null;
    
    // Place video after 60% of the content (roughly)
    const targetH2Index = Math.floor(h2Matches.length * 0.6);
    const targetH2 = h2Matches[targetH2Index];
    
    if (!targetH2) return null;
    
    const videoId = uniqueIds[0];
    const videoEmbed = `\n<p class="brand-paragraph"><strong>📹 Related Video:</strong> Watch this helpful video about ${keyword}:</p>\n<div class="video-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" title="Video about ${keyword}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>\n`;
    
    // Insert video after the target H2 and its first paragraph
    const h2FullMatch = targetH2[0];
    const h2Pos = html.indexOf(h2FullMatch);
    if (h2Pos === -1) return null;
    
    // Find the next </p> after this H2 to place video after the first paragraph
    const afterH2 = html.substring(h2Pos + h2FullMatch.length);
    const firstPEnd = afterH2.indexOf('</p>');
    if (firstPEnd === -1) return null;
    
    const insertPos = h2Pos + h2FullMatch.length + firstPEnd + 4; // 4 = '</p>'.length
    const result = html.substring(0, insertPos) + videoEmbed + html.substring(insertPos);
    
    return result;
  } catch (error) {
    console.error("Video search/injection error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json({ error: "AI service not configured", success: false }, { status: 500 });
    }
    
    const client = getOpenAI();
    if (!client) {
      return NextResponse.json({ error: "AI service initialization failed", success: false }, { status: 500 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
    if (!dbUser) return new Response("User not found", { status: 404 });

    const body = await request.json();
    const { blogId, title, primaryKeyword, secondaryKeywords = [], targetWordCount = 1200, outline = [], featuredImage = true, companyProfileId } = body as any;

    const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
    if (!blog || blog.userId !== dbUser.id) return new Response("Blog not found", { status: 404 });

    // Calculate total credits needed
    // 1 credit for blog generation + 0.5 credits per image
    let imageCount = 0;
    if (isExternalBackendConfigured()) {
      // Featured image if enabled
      if (featuredImage) imageCount += 1;
      // Section images (one per section where sectionImage is not false)
      imageCount += outline.filter((s: any) => s.sectionImage !== false).length;
    }
    const totalCreditsNeeded = CREDIT_COSTS.BLOG_GENERATION + (imageCount * CREDIT_COSTS.IMAGE_GENERATION);

    // Deduct credits upfront
    const creditResult = await deductCredits({
      userId: dbUser.id,
      amount: totalCreditsNeeded,
      type: 'blog_generation',
      description: `Blog generation with ${imageCount} images: ${title}`,
      metadata: { blogId: blog.id, blogTitle: title },
    });

    if (!creditResult.success) {
      return new Response(JSON.stringify({
        error: "Insufficient credits",
        message: creditResult.error,
        creditsRequired: totalCreditsNeeded,
        currentBalance: creditResult.newBalance,
      }), { status: 402, headers: { "Content-Type": "application/json" } });
    }

    let company: any = null;
    if (companyProfileId) {
      company = await db.query.companyProfiles.findFirst({ where: eq(companyProfiles.id, Number(companyProfileId)) });
    }

    const sys = `You are a world-class Content Writer and SEO Strategist who writes like a seasoned journalist, NOT like AI. Your content reads as if written by a human expert with real-world experience.

CRITICAL WRITING STYLE RULES (Content Quality):
- Write in a natural, conversational tone — like you're explaining to a smart colleague over coffee
- NEVER use these AI cliche phrases: "In today's fast-paced world", "It's important to note", "In conclusion", "Let's dive in", "game-changer", "landscape", "leverage", "unlock the power", "delve into", "Navigate the complexities", "It's worth noting", "In the realm of", "At the end of the day"
- Use contractions naturally (don't, won't, can't, it's, you'll)
- Vary sentence length dramatically — mix 5-word punchy sentences with 25-word detailed ones
- Start some paragraphs with "But", "And", "So", "Here's the thing" — real writers do this
- Include personal observations: "I've seen teams struggle with...", "What most people miss is..."
- Use specific, concrete examples instead of vague generalizations
- Write with opinion and perspective — don't hedge everything with "might", "could", "possibly"
- Avoid repetitive paragraph structures — don't start every paragraph the same way
- Use rhetorical questions occasionally to engage the reader
- Include surprising facts, counterintuitive insights, or "myth-busting" moments
- Reference real tools, platforms, methodologies, and brands where relevant

Your content must satisfy E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) criteria.`;
    const outlineText = outline.map((s: any, i: number) => `H2 ${i+1}. ${s.title}${(s.items||[]).length?"\n"+ (s.items||[]).filter((x:any)=>!x.isImage).map((x:any,j:number)=>`  H3 ${i+1}.${j+1}. ${x.title}`).join("\n"):""}`).join("\n");
    const usr = `Write a comprehensive, SEO-optimized blog article that reads like it was written by a human expert, NOT by AI.

**ARTICLE DETAILS:**
- Title: ${title}
- Primary Keyword: ${primaryKeyword} (use this keyword 5-8 times naturally throughout the content)
- Secondary Keywords: ${secondaryKeywords.join(", ")} (use each 2-3 times)
- Target Word Count: ${targetWordCount} words
- Company/Author: ${(company?.companyName) || (dbUser.companyName || "Our Company")}
- Current Date Context: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

**OUTLINE TO FOLLOW:**
${outlineText}

**MANDATORY CONTENT SECTIONS:**

1. **KEY TAKEAWAYS BOX** (Right after the H1 title and intro paragraph):
   Insert a key takeaways section using this EXACT HTML format:
   <div class="key-takeaways-box">
   <h3>⚡ Key Takeaways</h3>
   <ul>
   <li><strong>[Takeaway 1]</strong> - [Brief explanation]</li>
   <li><strong>[Takeaway 2]</strong> - [Brief explanation]</li>
   <li><strong>[Takeaway 3]</strong> - [Brief explanation]</li>
   <li><strong>[Takeaway 4]</strong> - [Brief explanation]</li>
   <li><strong>[Takeaway 5]</strong> - [Brief explanation]</li>
   </ul>
   </div>
   Include 4-6 takeaways that summarize the most valuable insights from the article.

2. **FACTS & STATISTICS** (Sprinkled throughout):
   - Include at least 5-8 specific, verifiable statistics with year and source
   - Use this format for standout facts: <div class="fact-callout"><p class="brand-paragraph"><strong>[Statistic]</strong> — [Context and source, year]</p></div>
   - Include at least 2-3 fact-callout boxes throughout the article
   - Reference recent data (2024-2026) wherever possible
   - Cite specific sources: "According to [Source Name] (2025)..." or "A [Organization] study found..."

3. **TRENDING CONTENT** (Weave into relevant sections):
   - Reference current industry trends and developments related to ${primaryKeyword}
   - Mention recent innovations, tools, or changes in the field
   - Include forward-looking insights: "In 2026, we're seeing..." or "The latest trend in..."
   - Connect trends to practical implications for the reader

**SEO REQUIREMENTS (CRITICAL - these affect the SEO score):**
1. Start with an H1 title containing the primary keyword
2. Use the primary keyword in the FIRST paragraph (within first 100 words)
3. Include the primary keyword in at least 2 H2 headings
4. Use <strong> tags to emphasize the primary keyword at least twice
5. Include at least 2 bulleted or numbered lists (<ul> or <ol>)
6. Write at least 6 paragraphs with substantive content
7. Add a FAQ section with H2 "Frequently Asked Questions" and 4-6 H3 questions (with ? at the end)
8. Include actionable tips, statistics, or data points where relevant
9. Write in an authoritative yet accessible tone — conversational, not robotic

**HTML OUTPUT RULES:**
- Output ONLY the blog body HTML (no <html>, <head>, <body> tags)
- Allowed tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>, <div>
- Every paragraph MUST be: <p class="brand-paragraph">...</p>
- Headings MUST be: <h1 class="brand-primary-heading">, <h2 class="brand-secondary-heading">, <h3 class="brand-accent-heading">
- Add id attributes to all headings (slugified from text)
- For key-takeaways-box and fact-callout divs, use the exact class names specified above
- Do NOT include images or image placeholders
- Output clean, production-ready HTML only`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.65,
      max_tokens: Math.ceil(targetWordCount * 2.5),
      messages: [ { role: "system", content: sys }, { role: "user", content: usr } ],
      stream: false,
    });

    let html = completion.choices[0]?.message?.content || "";
    // Strip markdown code block markers if present (```html ... ```)
    html = html
      .replace(/^\s*```(?:html)?\s*\n?/i, '')
      .replace(/\n?\s*```\s*$/i, '')
      .trim();
    // Normalize heading classes and add ids
    html = html
      .replace(/<h1(?![^>]*brand-primary-heading)[^>]*>/gi, '<h1 class="brand-primary-heading">')
      .replace(/<h2(?![^>]*brand-secondary-heading)[^>]*>/gi, '<h2 class="brand-secondary-heading">')
      .replace(/<h3(?![^>]*brand-accent-heading)[^>]*>/gi, '<h3 class="brand-accent-heading">')
      .replace(/<p(?![^>]*brand-paragraph)[^>]*>/gi, '<p class="brand-paragraph">');

    // Add ids to headings
    html = html.replace(/<h([1-3])([^>]*)>([^<]+)<\/h\1>/g, (m, lvl, attrs, text) => {
      const id = slugify(String(text));
      const clsFixed = String(attrs).includes("id=") ? attrs : `${attrs} id="${id}"`;
      return `<h${lvl}${clsFixed}>${text}</h${lvl}>`;
    });

    // Persist base content first
    const plainWords = html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    await db.update(blogs).set({ content: html, htmlContent: html, wordCount: plainWords, updatedAt: new Date() }).where(eq(blogs.id, blog.id));

    // Generate images
    if (isExternalBackendConfigured()) {
      const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)).map(m => (m[1] || "").trim());

      const prompts: Array<{ type: 'featured' | 'section'; after: string; prompt: string }> = [];
      
      // Featured image (insert at the very beginning before first H2)
      if (featuredImage && h2Matches.length) {
        prompts.push({
          type: 'featured',
          after: '', // Will be inserted at the beginning
          prompt: `A clean, professional editorial photograph for a blog about "${title}". 
The image should look like a high-end stock photo you'd find on a premium business website. 
Style: Realistic photograph, NOT a digital illustration or 3D render. 
Subject: A real-world scene that naturally represents ${primaryKeyword} — such as people working, a workspace, real objects, or a relevant real-life scenario. 
Composition: Simple, uncluttered, with one clear focal point. Lots of negative space. 
Lighting: Soft, natural light. No dramatic neon glows or lens flares. 
Colors: Muted, professional tones — whites, grays, soft blues, warm neutrals. No oversaturated neon colors. 
Format: Landscape, suitable as a blog header. 
IMPORTANT: Absolutely NO text, NO letters, NO words, NO icons, NO abstract shapes, NO floating graphics. Just a clean photograph.`,
        });
      }
      
      // Determine image style based on section content — always aim for clean, professional, stock-photo look
      const getImageStyle = (sectionTitle: string): string => {
        const title = sectionTitle.toLowerCase();
        // Data/statistics sections
        if (title.includes('statistic') || title.includes('data') || title.includes('number') || 
            title.includes('metric') || title.includes('growth') || title.includes('trend') ||
            title.includes('analysis') || title.includes('comparison') || title.includes('percentage')) {
          return 'a clean, realistic photo of a professional looking at charts on a laptop screen or printed report in a modern office';
        }
        // Process/how-to sections
        if (title.includes('how to') || title.includes('step') || title.includes('process') || 
            title.includes('guide') || title.includes('tutorial') || title.includes('implement') ||
            title.includes('workflow') || title.includes('method')) {
          return 'a realistic photo of someone working hands-on — at a desk, whiteboard, or using tools relevant to the topic';
        }
        // Benefits/advantages sections
        if (title.includes('benefit') || title.includes('advantage') || title.includes('feature') || 
            title.includes('reason') || title.includes('why') || title.includes('pro')) {
          return 'a bright, optimistic photo showing successful outcomes — happy professionals, growing business, or positive results';
        }
        // Challenges/problems sections
        if (title.includes('challenge') || title.includes('problem') || title.includes('issue') || 
            title.includes('risk') || title.includes('pitfall') || title.includes('con')) {
          return 'a photo showing a thoughtful professional problem-solving — looking at a screen, having a discussion, or reviewing documents';
        }
        // Future/prediction sections
        if (title.includes('future') || title.includes('predict') || title.includes('upcoming') || 
            title.includes('next') || title.includes('evolution') || title.includes('2025') || title.includes('2026')) {
          return 'a clean, modern photo of innovative technology or a forward-looking workspace — minimal, sleek, real-world setting';
        }
        // Examples/case study sections
        if (title.includes('example') || title.includes('case') || title.includes('real-world') || 
            title.includes('application') || title.includes('use case')) {
          return 'a candid, documentary-style photo of real people in a professional setting — meeting room, workshop, or presentation';
        }
        // Tools/resources sections
        if (title.includes('tool') || title.includes('resource') || title.includes('software') || 
            title.includes('platform') || title.includes('solution')) {
          return 'a clean overhead or angle shot of a neat workspace with laptop, notebook, and tools on a desk';
        }
        // FAQ sections
        if (title.includes('faq') || title.includes('question') || title.includes('asked')) {
          return 'a friendly photo of a professional having a one-on-one conversation or Q&A session';
        }
        // Default — generic professional stock photo
        return 'a clean, professional editorial photo of people working in a modern environment relevant to the topic';
      };

      // Get subsections for context
      const getSubsectionContext = (sec: any): string => {
        const items = (sec.items || []).filter((x: any) => !x.isImage).map((x: any) => x.title);
        if (items.length === 0) return '';
        return `Subtopics covered: ${items.slice(0, 3).join(', ')}.`;
      };

      // One image for each section where sectionImage is true
      outline.forEach((sec: any, secIdx: number) => {
        // Match section title to H2 by finding the H2 that contains the section title
        const h2 = h2Matches.find(h2Text => {
          const cleanH2 = h2Text.replace(/^\d+\.\s*/, '').trim().toLowerCase();
          const cleanSec = sec.title.trim().toLowerCase();
          return cleanH2 === cleanSec || cleanH2.includes(cleanSec) || cleanSec.includes(cleanH2);
        });
        if (!h2) {
          console.warn(`No matching H2 found for section: "${sec.title}"`);
          return;
        }
        // Generate one image per section if sectionImage is true
        if (sec.sectionImage !== false) {
          const imageStyle = getImageStyle(sec.title);
          const subsectionContext = getSubsectionContext(sec);
          prompts.push({
            type: 'section',
            after: h2,
            prompt: `A professional, realistic photograph for a blog section titled "${sec.title}".
Blog topic: ${title} (${primaryKeyword}).
${subsectionContext}
Scene: ${imageStyle}.
Photography style: Clean editorial stock photography. Shot on a professional camera. Soft natural lighting. 
Composition: Simple and uncluttered with clear focal point and generous negative space.
Color palette: Muted, professional — soft whites, grays, light blues, warm neutrals. NO neon, NO oversaturated colors.
Mood: Professional, trustworthy, approachable.
IMPORTANT: Absolutely NO text, NO letters, NO words, NO numbers, NO icons, NO abstract shapes, NO floating graphics overlaid on the image. This must look like a real photograph, not a digital illustration or 3D render.`,
          });
        }
      });

      console.log("generate-from-outline image prompts", {
        blogId: blog.id,
        totalH2: h2Matches.length,
        totalSections: outline.length,
        sectionsWithImages: outline.filter((s: any) => s.sectionImage !== false).length,
        totalPrompts: prompts.length,
        h2Matches,
        outline: outline.map((s: any, i: number) => ({
          idx: i,
          title: s.title,
          sectionImage: s.sectionImage,
        })),
        prompts: prompts.map(p => ({ after: p.after, prompt: p.prompt.substring(0, 80) }))
      });

      const sectionImages: Array<{ afterH2: string; url: string; alt: string }> = [];
      let featuredImageUrl = '';
      
      for (const p of prompts) {
        try {
          console.log(`Generating ${p.type} image${p.after ? ` for: "${p.after}"` : ''} with prompt: "${p.prompt.substring(0, 60)}..."`);
          
          // Generate and store image directly in database
          const { imageId, imageUrl } = await generateAndStoreImage({
            prompt: p.prompt,
            blogId: blog.id,
            altText: p.prompt,
          });
          
          console.log(`Image generation result: imageId=${imageId}, imageUrl=${imageUrl}`);
          
          if (p.type === 'featured') {
            featuredImageUrl = imageUrl;
            console.log(`Featured image generated: ${imageUrl}`);
          } else {
            sectionImages.push({ afterH2: p.after, url: imageUrl, alt: p.prompt });
            console.log(`Section image inserted. Total section images so far: ${sectionImages.length}`);
          }
        } catch (e) {
          console.error("image gen failed for prompt:", p.prompt.substring(0, 60), e);
        }
      }

      console.log(`Total section images: ${sectionImages.length}. Now injecting into HTML...`);
      
      // Inject featured image at the very beginning
      if (featuredImageUrl) {
        const featuredImg = `<figure class="featured-image-wrapper" style="margin: 2rem 0; text-align: center;"><img src="${featuredImageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" loading="lazy" /></figure>`;
        html = featuredImg + html;
        console.log(`Featured image injected at the beginning`);
        
        // Update featured image in blog record
        await db.update(blogs)
          .set({ featuredImage: featuredImageUrl })
          .where(eq(blogs.id, blog.id));
      }
      
      // Inject section images after their respective H2s
      if (sectionImages.length) {
        html = injectImages(html, sectionImages);
        console.log(`Section images injected. Updating blog content...`);
      }
      
      // Try to inject relevant YouTube videos into the content
      try {
        const videoEmbeds = await findAndInjectVideos(title, primaryKeyword, html);
        if (videoEmbeds) {
          html = videoEmbeds;
          console.log("YouTube video embeds injected");
        }
      } catch (videoErr) {
        console.error("Video injection failed (non-critical):", videoErr);
      }
      
      await db.update(blogs)
        .set({ content: html, htmlContent: html, status: 'draft', updatedAt: new Date() })
        .where(eq(blogs.id, blog.id));
    } else {
      // No image backend - just update status to draft
      await db.update(blogs)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(blogs.id, blog.id));
    }

    return new Response(JSON.stringify({ htmlContent: html, success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("generate-from-outline error:", e?.message || e);
    
    // Try to update blog status to failed
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body?.blogId) {
        await db.update(blogs)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(blogs.id, Number(body.blogId)));
      }
    } catch (statusErr) {
      console.error("Failed to update blog status:", statusErr);
    }
    
    return new Response(JSON.stringify({ 
      error: e?.message || "Failed to generate blog",
      success: false 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
