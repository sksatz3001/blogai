import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users, blogImages, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { externalGenerateSingleImage, isExternalBackendConfigured } from "@/lib/image-backend";
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
    const imageHtml = imgs.map(img => `<p class=\"brand-paragraph\"><img src=\"${img.url}\" alt=\"${img.alt}\" class=\"rounded-lg max-w-full h-auto my-4\"/></p>`).join('\n');
    out = out.replace(h2Regex, (m) => `${m}\n${imageHtml}`);
  }
  return out;
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

    const sys = `You are a world-class SEO Content Strategist and Expert Blog Writer. Your content consistently achieves high SEO scores and ranks well on search engines. You write engaging, authoritative, and valuable content that satisfies E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) criteria.`;
    const outlineText = outline.map((s: any, i: number) => `H2 ${i+1}. ${s.title}${(s.items||[]).length?"\n"+ (s.items||[]).filter((x:any)=>!x.isImage).map((x:any,j:number)=>`  H3 ${i+1}.${j+1}. ${x.title}`).join("\n"):""}`).join("\n");
    const usr = `Write a comprehensive, SEO-optimized blog article.

**ARTICLE DETAILS:**
- Title: ${title}
- Primary Keyword: ${primaryKeyword} (use this keyword 5-8 times naturally throughout the content)
- Secondary Keywords: ${secondaryKeywords.join(", ")} (use each 2-3 times)
- Target Word Count: ${targetWordCount} words
- Company/Author: ${(company?.companyName) || (dbUser.companyName || "Our Company")}

**OUTLINE TO FOLLOW:**
${outlineText}

**SEO REQUIREMENTS (CRITICAL - these affect the SEO score):**
1. Start with an H1 title containing the primary keyword
2. Use the primary keyword in the FIRST paragraph (within first 100 words)
3. Include the primary keyword in at least 2 H2 headings
4. Use <strong> tags to emphasize the primary keyword at least twice
5. Include at least 2 bulleted or numbered lists (<ul> or <ol>)
6. Write at least 6 paragraphs with substantive content
7. Add a FAQ section with H2 "Frequently Asked Questions" and 4-6 H3 questions (with ? at the end)
8. Include actionable tips, statistics, or data points where relevant
9. Write in an authoritative yet accessible tone

**HTML OUTPUT RULES:**
- Output ONLY the blog body HTML (no <html>, <head>, <body> tags)
- Allowed tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>
- Every paragraph MUST be: <p class="brand-paragraph">...</p>
- Headings MUST be: <h1 class="brand-primary-heading">, <h2 class="brand-secondary-heading">, <h3 class="brand-accent-heading">
- Add id attributes to all headings (slugified from text)
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
          prompt: `Professional blog header image for article titled "${title}". High-quality, modern, clean design with visual elements representing ${primaryKeyword}. Style: editorial photography or sleek illustration, vibrant colors, eye-catching composition suitable for social media sharing. No text overlay.`,
        });
      }
      
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
          prompts.push({
            type: 'section',
            after: h2,
            prompt: `Illustrative image for blog section: "${sec.title}". Context: Article about ${primaryKeyword}. Style: professional, modern, clean graphic or photograph. Visual should complement and enhance the written content. Suitable for web blog post. No text overlay.`,
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
          const gen = await externalGenerateSingleImage({
            prompt: p.prompt,
            userId: String(dbUser.id),
            blogId: blog.id,
          });
          console.log(`Image generation result:`, gen ? { s3Key: gen.s3Key } : 'null/undefined');
          if (!gen || !gen.s3Key) {
            console.error(`Skipping image - gen result was null or missing s3Key`);
            continue;
          }

          const storageBase = process.env.IMAGE_STORAGE_BASE || process.env.IMAGE_S3_BASE;
          console.log(`[DEBUG] Storage base for image URL: ${storageBase}`);
          console.log(`[DEBUG] IMAGE_STORAGE_BASE env: ${process.env.IMAGE_STORAGE_BASE}`);
          if (!storageBase) {
            console.error("IMAGE_STORAGE_BASE or IMAGE_S3_BASE not set; cannot form image URL");
            break;
          }

          const imageUrl = `${storageBase.replace(/\/$/, "")}/${gen.s3Key}`;
          console.log(`[DEBUG] Constructed image URL: ${imageUrl}`);

          await db.insert(blogImages).values({
            blogId: blog.id,
            imageUrl,
            s3Key: gen.s3Key,
            imagePrompt: p.prompt,
            altText: p.prompt,
            position: 0 as any,
            width: null as any,
            height: null as any,
          }).returning();
          
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
        const featuredImg = `<div class="featured-image-wrapper" style="margin: 2rem 0;"><img src="${featuredImageUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px;" /></div>`;
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
