import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEmployeeSession } from "@/lib/employee-auth";

// Comprehensive SEO Score Calculator (0-100 scale with precise weighting)
function calculateSEOScore(content: string, htmlContent: string, primaryKeyword: string): number {
  if (!primaryKeyword || !content || content.trim().length === 0) {
    return 0;
  }

  const lowerContent = content.toLowerCase();
  const lowerKeyword = primaryKeyword.toLowerCase().trim();
  const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  
  let totalScore = 0;

  // 1. TITLE/H1 OPTIMIZATION (12 points)
  const h1Match = htmlContent.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match) {
    totalScore += 4; // Has H1
    const h1Text = h1Match[1].toLowerCase();
    if (h1Text.includes(lowerKeyword)) {
      totalScore += 5; // Keyword in H1
      // Keyword in first half of H1 (front-loaded)
      const keywordPos = h1Text.indexOf(lowerKeyword);
      if (keywordPos >= 0 && keywordPos < h1Text.length / 2) {
        totalScore += 3;
      }
    }
  }

  // 2. KEYWORD DENSITY & PLACEMENT (18 points)
  const keywordMatches = lowerContent.match(new RegExp(escapedKeyword, 'gi')) || [];
  const keywordCount = keywordMatches.length;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  
  // Optimal density is 0.8% - 2.5%
  if (density >= 0.5 && density <= 3.0) {
    if (density >= 0.8 && density <= 2.5) {
      totalScore += 8; // Perfect density
    } else {
      totalScore += 5; // Acceptable density
    }
  } else if (keywordCount >= 1) {
    totalScore += 2; // At least keyword exists
  }

  // Keyword in first 100 words (intro optimization)
  const first100Words = content.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
  if (first100Words.includes(lowerKeyword)) {
    totalScore += 5;
  }

  // Keyword in last 100 words (conclusion)
  const last100Words = content.split(/\s+/).slice(-100).join(' ').toLowerCase();
  if (last100Words.includes(lowerKeyword)) {
    totalScore += 5;
  }

  // 3. HEADING STRUCTURE (15 points)
  const h2Count = (htmlContent.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (htmlContent.match(/<h3[^>]*>/gi) || []).length;
  
  // H2 scoring (max 7 points)
  if (h2Count >= 1) totalScore += 2;
  if (h2Count >= 3) totalScore += 2;
  if (h2Count >= 5) totalScore += 3;

  // H3 scoring (max 4 points)
  if (h3Count >= 2) totalScore += 2;
  if (h3Count >= 4) totalScore += 2;

  // Keyword in headings (max 4 points)
  const allHeadings = htmlContent.match(/<h[2-3][^>]*>([^<]*)<\/h[2-3]>/gi) || [];
  const headingsWithKeyword = allHeadings.filter(h => h.toLowerCase().includes(lowerKeyword)).length;
  if (headingsWithKeyword >= 1) totalScore += 2;
  if (headingsWithKeyword >= 2) totalScore += 2;

  // 4. CONTENT LENGTH & QUALITY (15 points)
  if (wordCount >= 300) totalScore += 3;
  if (wordCount >= 600) totalScore += 3;
  if (wordCount >= 1000) totalScore += 3;
  if (wordCount >= 1500) totalScore += 3;
  if (wordCount >= 2000) totalScore += 3;

  // 5. CONTENT FORMATTING (10 points)
  // Lists
  const listCount = (htmlContent.match(/<[uo]l[^>]*>/gi) || []).length;
  if (listCount >= 1) totalScore += 3;
  if (listCount >= 2) totalScore += 2;

  // Bold/Strong emphasis
  const strongCount = (htmlContent.match(/<strong[^>]*>/gi) || []).length;
  if (strongCount >= 2) totalScore += 2;
  if (strongCount >= 5) totalScore += 1;

  // Paragraphs (content structure)
  const paragraphs = htmlContent.match(/<p[^>]*>/gi) || [];
  if (paragraphs.length >= 5) totalScore += 2;

  // 6. LINKS (8 points)
  const links = htmlContent.match(/<a[^>]*href=["'][^"']+["'][^>]*>/gi) || [];
  const externalLinks = links.filter(l => !l.includes('href="#') && !l.includes("href='#"));
  if (externalLinks.length >= 1) totalScore += 3;
  if (externalLinks.length >= 3) totalScore += 3;
  if (externalLinks.length >= 5) totalScore += 2;

  // 7. MEDIA & IMAGES (7 points)
  const imageCount = (htmlContent.match(/<img[^>]*>/gi) || []).length;
  if (imageCount >= 1) totalScore += 3;
  if (imageCount >= 2) totalScore += 2;
  if (imageCount >= 3) totalScore += 2;

  // 8. READABILITY SIGNALS (8 points)
  // Short paragraphs (under 150 words each on average)
  const paragraphTexts = (htmlContent.match(/<p[^>]*>([^<]*)<\/p>/gi) || [])
    .map(p => p.replace(/<[^>]*>/g, ''));
  const avgParagraphLength = paragraphTexts.length > 0 
    ? paragraphTexts.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphTexts.length 
    : 0;
  if (avgParagraphLength > 0 && avgParagraphLength <= 150) totalScore += 4;
  else if (avgParagraphLength > 0 && avgParagraphLength <= 200) totalScore += 2;

  // Sentence variety (has both short and longer sentences)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 10) {
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    if (avgLength >= 10 && avgLength <= 25) totalScore += 4;
    else if (avgLength >= 8 && avgLength <= 30) totalScore += 2;
  }

  // 9. SEMANTIC RICHNESS (7 points)
  // Question headings (good for featured snippets)
  const questionHeadings = allHeadings.filter(h => h.includes('?')).length;
  if (questionHeadings >= 1) totalScore += 3;
  if (questionHeadings >= 2) totalScore += 2;

  // Numbers/statistics
  const hasStats = /\d+%|\d+\s*(percent|times|years|months|days|hours|million|billion|thousand)/i.test(content);
  if (hasStats) totalScore += 2;

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

// Keyword Density Calculator - Returns REAL accurate percentages
function calculateKeywordDensity(content: string, primaryKeyword: string, secondaryKeywords: string[]): { [key: string]: number } {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const densities: { [key: string]: number } = {};

  if (totalWords === 0 || !primaryKeyword) {
    return densities;
  }

  // Helper to count keyword occurrences (handles multi-word keywords)
  const countKeyword = (text: string, keyword: string): number => {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, 'gi'));
    return matches ? matches.length : 0;
  };

  // Primary keyword density - REAL percentage
  const primaryLower = primaryKeyword.toLowerCase().trim();
  const primaryCount = countKeyword(lowerContent, primaryLower);
  const primaryWordsInKeyword = primaryLower.split(/\s+/).length;
  const primaryPct = totalWords > 0 ? ((primaryCount * primaryWordsInKeyword) / totalWords) * 100 : 0;
  densities[primaryKeyword] = Number(primaryPct.toFixed(2));

  // Secondary keywords density - REAL percentages
  if (secondaryKeywords && secondaryKeywords.length > 0) {
    secondaryKeywords.forEach((keyword) => {
      if (!keyword || !keyword.trim()) return;
      const keywordLower = keyword.toLowerCase().trim();
      const count = countKeyword(lowerContent, keywordLower);
      const wordsInKeyword = keywordLower.split(/\s+/).length;
      const pct = totalWords > 0 ? ((count * wordsInKeyword) / totalWords) * 100 : 0;
      densities[keyword] = Number(pct.toFixed(2));
    });
  }

  return densities;
}

// AEO (Answer Engine Optimization) Score - For AI/Voice search optimization
function calculateAEOScore(content: string, htmlContent: string): number {
  let score = 0;

  // 1. Question-format headings (25 points) - Critical for voice search
  const questionHeadings = (htmlContent.match(/<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>/gi) || []).length;
  if (questionHeadings >= 1) score += 10;
  if (questionHeadings >= 2) score += 8;
  if (questionHeadings >= 3) score += 7;

  // 2. Direct answer paragraphs (20 points) - Short, concise answers after questions
  const paragraphs = htmlContent.match(/<p[^>]*>([^<]*)<\/p>/gi) || [];
  const shortAnswerParagraphs = paragraphs.filter(p => {
    const text = p.replace(/<[^>]*>/g, '').trim();
    const wordCount = text.split(/\s+/).length;
    return wordCount >= 20 && wordCount <= 60; // Ideal snippet length
  });
  if (shortAnswerParagraphs.length >= 1) score += 8;
  if (shortAnswerParagraphs.length >= 3) score += 7;
  if (shortAnswerParagraphs.length >= 5) score += 5;

  // 3. Structured lists (18 points) - Highly favored by answer engines
  const ulCount = (htmlContent.match(/<ul[^>]*>/gi) || []).length;
  const olCount = (htmlContent.match(/<ol[^>]*>/gi) || []).length;
  const listItems = (htmlContent.match(/<li[^>]*>/gi) || []).length;
  if (ulCount >= 1 || olCount >= 1) score += 6;
  if (ulCount >= 2 || olCount >= 2) score += 6;
  if (listItems >= 10) score += 6;

  // 4. Clear heading hierarchy (12 points)
  const h2Count = (htmlContent.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (htmlContent.match(/<h3[^>]*>/gi) || []).length;
  if (h2Count >= 3 && h3Count >= 2) score += 7;
  else if (h2Count >= 2) score += 4;
  if (h2Count >= 5) score += 5;

  // 5. FAQ Schema potential (15 points) - "FAQ" section detection
  const hasFAQSection = /faq|frequently asked|common questions/i.test(htmlContent);
  if (hasFAQSection) score += 10;
  // Multiple Q&A patterns
  const qaPatterns = (htmlContent.match(/<h[2-3][^>]*>[^<]*\?[^<]*<\/h[2-3]>\s*<p/gi) || []).length;
  if (qaPatterns >= 3) score += 5;

  // 6. Definition/How-to patterns (10 points)
  const hasDefinitions = /\b(is defined as|refers to|means that|is a|are the)\b/i.test(content);
  const hasHowTo = /\b(how to|steps to|guide to|ways to|tips for)\b/i.test(content);
  if (hasDefinitions) score += 5;
  if (hasHowTo) score += 5;

  return Math.min(100, Math.max(0, score));
}

// GEO (Generative Engine Optimization) Score - For AI-generated search results
function calculateGEOScore(content: string, htmlContent: string): number {
  let score = 0;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // 1. Authoritative & factual content (20 points)
  const strongStatements = (htmlContent.match(/<strong[^>]*>[^<]+<\/strong>/gi) || []).length;
  if (strongStatements >= 3) score += 10;
  else if (strongStatements >= 1) score += 5;
  
  // Definitive statements
  const definitivePatterns = /\b(research shows|studies indicate|data suggests|according to|experts say|it is proven|evidence shows)\b/gi;
  const definitiveMatches = (content.match(definitivePatterns) || []).length;
  if (definitiveMatches >= 2) score += 10;
  else if (definitiveMatches >= 1) score += 5;

  // 2. Data & statistics (18 points)
  const statsPatterns = /\d+(\.\d+)?\s*(%|percent|million|billion|thousand)|\d{4}\s*(study|report|survey)|\$\d+/gi;
  const statsCount = (content.match(statsPatterns) || []).length;
  if (statsCount >= 5) score += 18;
  else if (statsCount >= 3) score += 12;
  else if (statsCount >= 1) score += 6;

  // 3. Citations & external references (15 points)
  const externalLinks = (htmlContent.match(/<a[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi) || []).length;
  if (externalLinks >= 5) score += 15;
  else if (externalLinks >= 3) score += 10;
  else if (externalLinks >= 1) score += 5;

  // 4. Content comprehensiveness (17 points)
  if (wordCount >= 2000) score += 17;
  else if (wordCount >= 1500) score += 14;
  else if (wordCount >= 1000) score += 10;
  else if (wordCount >= 600) score += 6;
  else if (wordCount >= 300) score += 3;

  // 5. Semantic structure & organization (15 points)
  const h2Count = (htmlContent.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (htmlContent.match(/<h3[^>]*>/gi) || []).length;
  if (h2Count >= 5 && h3Count >= 3) score += 15;
  else if (h2Count >= 4) score += 10;
  else if (h2Count >= 2) score += 5;

  // 6. Entity mentions & specificity (10 points)
  const entityPattern = /(?<!^|[.!?]\s)[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g;
  const entities = (content.match(entityPattern) || []).length;
  if (entities >= 10) score += 10;
  else if (entities >= 5) score += 6;
  else if (entities >= 2) score += 3;

  // 7. Quotations & expert citations (5 points)
  const hasBlockquotes = /<blockquote[^>]*>/i.test(htmlContent);
  const hasQuotes = /"[^"]{20,}"/g.test(content);
  if (hasBlockquotes) score += 3;
  if (hasQuotes) score += 2;

  return Math.min(100, Math.max(0, score));
}

// E-E-A-T Score (Experience, Expertise, Authoritativeness, Trustworthiness)
function calculateEEATScore(content: string, htmlContent: string, authorName: string | null): number {
  let score = 0;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // 1. EXPERIENCE (25 points) - First-hand knowledge indicators
  const experiencePatterns = [
    /\b(in my experience|from my experience|i('ve| have) (seen|found|learned|discovered|noticed))\b/gi,
    /\b(when i (worked|tried|tested|used)|i personally|first-hand|hands-on)\b/gi,
    /\b(over the (years|months)|after (years|months) of|my journey)\b/gi,
    /\b(i recommend|what i('ve| have) found|based on my)\b/gi
  ];
  let experienceCount = 0;
  experiencePatterns.forEach(pattern => {
    experienceCount += (content.match(pattern) || []).length;
  });
  if (experienceCount >= 5) score += 25;
  else if (experienceCount >= 3) score += 18;
  else if (experienceCount >= 1) score += 10;

  // 2. EXPERTISE (25 points) - Technical knowledge & industry terminology
  const expertisePatterns = [
    /\b(research (shows|indicates|suggests)|studies (show|indicate|suggest)|data (shows|indicates))\b/gi,
    /\b(according to|experts (say|recommend|suggest)|industry (standard|best practice))\b/gi,
    /\b(certified|qualified|professional|specialist|expert in)\b/gi,
    /\b(methodology|framework|analysis|optimization|strategy|implementation)\b/gi
  ];
  let expertiseCount = 0;
  expertisePatterns.forEach(pattern => {
    expertiseCount += (content.match(pattern) || []).length;
  });
  if (expertiseCount >= 8) score += 25;
  else if (expertiseCount >= 5) score += 18;
  else if (expertiseCount >= 2) score += 10;
  else if (expertiseCount >= 1) score += 5;

  // 3. AUTHORITATIVENESS (25 points)
  // Author attribution
  if (authorName && authorName.trim().length > 0) score += 10;
  
  // External citations & references
  const externalLinks = (htmlContent.match(/<a[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi) || []).length;
  if (externalLinks >= 5) score += 10;
  else if (externalLinks >= 3) score += 7;
  else if (externalLinks >= 1) score += 4;

  // Comprehensive depth
  if (wordCount >= 1500) score += 5;
  else if (wordCount >= 1000) score += 3;

  // 4. TRUSTWORTHINESS (25 points)
  // Clear, organized structure
  const h2Count = (htmlContent.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (htmlContent.match(/<h3[^>]*>/gi) || []).length;
  if (h2Count >= 4 && h3Count >= 3) score += 8;
  else if (h2Count >= 3) score += 5;

  // Transparency patterns
  const transparencyPatterns = /\b(disclaimer|disclosure|note:|important:|updated|last (updated|modified)|sources?)\b/gi;
  if ((content.match(transparencyPatterns) || []).length >= 1) score += 5;

  // Balanced perspective (pros and cons, advantages/disadvantages)
  const balancedPatterns = /\b(however|on the other hand|pros and cons|advantages and disadvantages|benefits and (challenges|drawbacks)|while|although)\b/gi;
  const balancedCount = (content.match(balancedPatterns) || []).length;
  if (balancedCount >= 3) score += 7;
  else if (balancedCount >= 1) score += 4;

  // Specific, verifiable claims (numbers, dates, names)
  const specificClaims = /\d{4}|\d+%|\$\d+/g;
  if ((content.match(specificClaims) || []).length >= 5) score += 5;
  else if ((content.match(specificClaims) || []).length >= 2) score += 3;

  return Math.min(100, Math.max(0, score));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

    const params = await context.params;
    const blogId = parseInt(params.id);

    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.employeeId, employee.id)),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    if (!blog.content || !blog.htmlContent) {
      return NextResponse.json({ error: "Blog has no content" }, { status: 400 });
    }

    // Calculate all SEO metrics
    const seoScore = calculateSEOScore(
      blog.content,
      blog.htmlContent,
      blog.primaryKeyword || ""
    );

    const keywordDensity = calculateKeywordDensity(
      blog.content,
      blog.primaryKeyword || "",
      (blog.secondaryKeywords as string[]) || []
    );

    const aeoScore = calculateAEOScore(blog.content, blog.htmlContent);
    const geoScore = calculateGEOScore(blog.content, blog.htmlContent);
    const eeatScore = calculateEEATScore(blog.content, blog.htmlContent, employee.username);

    // Update blog with calculated metrics
    await db
      .update(blogs)
      .set({
        seoScore,
        keywordDensity,
        aeoScore,
        geoScore,
        eeatScore,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, blog.id));

    return NextResponse.json({
      message: "SEO metrics calculated successfully",
      metrics: {
        seoScore,
        keywordDensity,
        aeoScore,
        geoScore,
        eeatScore,
      },
    });
  } catch (error) {
    console.error("SEO calculation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
