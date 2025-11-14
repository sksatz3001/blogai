import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEmployeeSession } from "@/lib/employee-auth";

// SEO Score Calculator
function calculateSEOScore(content: string, htmlContent: string, primaryKeyword: string): number {
  let score = 0;
  const maxScore = 100;

  // Check for title in content (H1)
  if (/<h1\b[^>]*>/i.test(htmlContent)) score += 10;

  // Check for headings (H2, H3)
  const h2Count = (htmlContent.match(/<h2\b[^>]*>/gi) || []).length;
  const h3Count = (htmlContent.match(/<h3\b[^>]*>/gi) || []).length;
  if (h2Count >= 2) score += 10;
  if (h3Count >= 2) score += 5;

  // Check for keyword in content
  const lowerContent = content.toLowerCase();
  const lowerKeyword = primaryKeyword.toLowerCase();
  if (lowerContent.includes(lowerKeyword)) score += 15;

  // Check for keyword in first paragraph
  const firstParagraph = htmlContent.match(/<p\b[^>]*>(.*?)<\/p>/i)?.[1] || "";
  if (firstParagraph.toLowerCase().includes(lowerKeyword)) score += 10;

  // Check for lists
  if (/<ul\b[^>]*>/i.test(htmlContent) || /<ol\b[^>]*>/i.test(htmlContent)) score += 10;

  // Check for links
  if (/<a\s+/i.test(htmlContent)) score += 5;

  // Check for bold/emphasis
  if (/<strong\b[^>]*>/i.test(htmlContent) || /<em\b[^>]*>/i.test(htmlContent)) score += 5;

  // Content length check
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 300) score += 10;
  if (wordCount >= 600) score += 10;
  if (wordCount >= 1000) score += 10;

  return Math.min(score, maxScore);
}

// Keyword Density Calculator
function calculateKeywordDensity(content: string, primaryKeyword: string, secondaryKeywords: string[]): { [key: string]: number } {
  const words = content.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  const densities: { [key: string]: number } = {};

  // Primary keyword density
  const primaryCount = content.toLowerCase().split(primaryKeyword.toLowerCase()).length - 1;
  const primaryPct = totalWords > 0 ? (primaryCount / totalWords) * 100 : 0;
  densities[primaryKeyword] = Math.min(2.5, Math.max(0.8, Number.isFinite(primaryPct) ? primaryPct : 0));

  // Secondary keywords density
  secondaryKeywords?.forEach((keyword) => {
    const count = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
    const pct = totalWords > 0 ? (count / totalWords) * 100 : 0;
    densities[keyword] = Math.min(2.5, Math.max(0.8, Number.isFinite(pct) ? pct : 0));
  });

  return densities;
}

// AEO (Answer Engine Optimization) Score
function calculateAEOScore(content: string, htmlContent: string): number {
  let score = 0;

  // Check for question format in headings
  const hasQuestions = /<h[2-3]\b[^>]*>[^<]*\?[^<]*<\/h[2-3]>/i.test(htmlContent);
  if (hasQuestions) score += 25;

  // Check for lists (answer engines love lists)
  const listCount = (htmlContent.match(/<[uo]l\b[^>]*>/gi) || []).length;
  if (listCount >= 1) score += 20;
  if (listCount >= 2) score += 10;

  // Check for structured content
  const headingCount = (htmlContent.match(/<h[2-3]\b[^>]*>/gi) || []).length;
  if (headingCount >= 3) score += 20;

  // Check for concise paragraphs (good for featured snippets)
  const paragraphs = htmlContent.match(/<p\b[^>]*>(.*?)<\/p>/gi) || [];
  const shortParagraphs = paragraphs.filter(p => {
    const text = p.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).length <= 50;
  });
  if (shortParagraphs.length >= 2) score += 25;

  return Math.min(score, 100);
}

// GEO (Generative Engine Optimization) Score
function calculateGEOScore(content: string, htmlContent: string): number {
  let score = 0;

  // Check for clear, authoritative statements
  const hasStrongStatements = /<strong>[^<]*<\/strong>/g.test(htmlContent);
  if (hasStrongStatements) score += 20;

  // Check for data/statistics
  const hasNumbers = /\d+%|\d+\s*(percent|times|years|days)/i.test(content);
  if (hasNumbers) score += 20;

  // Check for citations or references
  const hasLinks = /<a\s+href=/i.test(htmlContent);
  if (hasLinks) score += 15;

  // Check for comprehensive content
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 500) score += 15;
  if (wordCount >= 1000) score += 15;

  // Check for semantic structure
  const headingCount = (htmlContent.match(/<h[2-3]>/g) || []).length;
  if (headingCount >= 3) score += 15;

  return Math.min(score, 100);
}

// E-E-A-T Score (Experience, Expertise, Authoritativeness, Trustworthiness)
function calculateEEATScore(content: string, htmlContent: string, authorName: string | null): number {
  let score = 0;

  // Experience indicators
  const experienceKeywords = /\b(in my experience|I have|I've worked|I've found|personally|first-hand)\b/i;
  if (experienceKeywords.test(content)) score += 20;

  // Expertise indicators
  const expertiseKeywords = /\b(according to|research shows|studies indicate|expert|professional|certified)\b/i;
  if (expertiseKeywords.test(content)) score += 20;

  // Authoritativeness - has author name
  if (authorName) score += 15;

  // Trustworthiness - has links/citations
  const linkCount = (htmlContent.match(/<a\s+href=/g) || []).length;
  if (linkCount >= 2) score += 15;
  if (linkCount >= 5) score += 10;

  // Comprehensive content
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 800) score += 10;

  // Clear structure
  const headingCount = (htmlContent.match(/<h[2-3]>/g) || []).length;
  if (headingCount >= 3) score += 10;

  return Math.min(score, 100);
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
