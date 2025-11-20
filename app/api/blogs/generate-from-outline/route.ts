import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { db } from "@/db";
import { blogs, users, blogImages, companyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { externalGenerateSingleImage, isExternalBackendConfigured } from "@/lib/image-backend";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, organization: process.env.OPENAI_ORG_ID });

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
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
    if (!dbUser) return new Response("User not found", { status: 404 });

    const body = await request.json();
    const { blogId, title, primaryKeyword, secondaryKeywords = [], targetWordCount = 1200, outline = [], featuredImage = true, companyProfileId } = body as any;

    const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
    if (!blog || blog.userId !== dbUser.id) return new Response("Blog not found", { status: 404 });

    let company: any = null;
    if (companyProfileId) {
      company = await db.query.companyProfiles.findFirst({ where: eq(companyProfiles.id, Number(companyProfileId)) });
    }

    const sys = `You are a Senior Content Strategist and Expert Blog Creator. Write a complete, SEO-optimized blog as clean semantic HTML according to a provided outline.`;
    const outlineText = outline.map((s: any, i: number) => `H2 ${i+1}. ${s.title}${(s.items||[]).length?"\n"+ (s.items||[]).filter((x:any)=>!x.isImage).map((x:any,j:number)=>`  H3 ${i+1}.${j+1}. ${x.title}`).join("\n"):""}`).join("\n");
    const usr = `Title: ${title}
Primary Keyword: ${primaryKeyword}
Secondary Keywords: ${secondaryKeywords.join(", ")}
Target Word Count: ${targetWordCount}
Company: ${(company?.companyName) || (dbUser.companyName || "Our Company")}

OUTLINE (strictly follow):\n${outlineText}

OUTPUT RULES:
- Output ONLY the blog body HTML (no <html>, <head>, <body>)
- Tags allowed: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>
- Every paragraph must be <p class="brand-paragraph"> ... </p>
- Headings must be:
  <h1 class="brand-primary-heading">, <h2 class="brand-secondary-heading">, <h3 class="brand-accent-heading">
- Add ids to headings from their text
- Do NOT include images or placeholders (we will add images separately)
- Rich, authoritative tone with E-E-A-T, actionable detail
- Keep keyword density 0.8%–2.5%, use secondary and LSI variations naturally
- Include a short FAQ H2 with 4–6 H3 Q&A
- Clean, production-ready HTML only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.65,
      max_tokens: Math.ceil(targetWordCount * 2.5),
      messages: [ { role: "system", content: sys }, { role: "user", content: usr } ],
      stream: false,
    });

    let html = completion.choices[0]?.message?.content || "";
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
          prompt: `${title}. High-quality illustrative header image related to: ${primaryKeyword}.`,
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
            prompt: `Illustration for section: ${sec.title}. Context: ${title}. Style: clean, professional blog graphic.`,
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
          if (!storageBase) {
            console.error("IMAGE_STORAGE_BASE or IMAGE_S3_BASE not set; cannot form image URL");
            break;
          }

          const imageUrl = `${storageBase.replace(/\/$/, "")}/${gen.s3Key}`;

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
      }
      
      // Inject section images after their respective H2s
      if (sectionImages.length) {
        html = injectImages(html, sectionImages);
        console.log(`Section images injected. Updating blog content...`);
      }
      
      await db.update(blogs)
        .set({ content: html, htmlContent: html, updatedAt: new Date() })
        .where(eq(blogs.id, blog.id));
    }

    return new Response(JSON.stringify({ htmlContent: html }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-from-outline error", e);
    return new Response("Internal server error", { status: 500 });
  }
}
