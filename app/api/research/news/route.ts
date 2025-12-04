import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
  relevance: string;
  publishedDate: string;
  source: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company info
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const companyName = dbUser.companyName || "your company";
    const companyDescription = dbUser.companyDescription || "";
    const industry = companyDescription ? `Industry context: ${companyDescription}` : "";

    const prompt = `You are a business news researcher. Generate 8 realistic, current trending news items and topics that would be highly relevant for a company called "${companyName}".
${industry}

For each news item, create content that:
1. Represents current industry trends, market developments, or relevant business topics
2. Would make excellent blog post material for this company
3. Includes actionable insights or interesting angles

Return a JSON array with exactly 8 news items in this format:
[
  {
    "id": "unique-id-1",
    "title": "Compelling news headline that could become a blog title",
    "summary": "2-3 sentence summary of the news/trend and why it matters (80-120 words)",
    "category": "One of: Industry Trends, Market Analysis, Technology, Best Practices, Case Study, How-To Guide, Opinion, Research",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "relevance": "Brief explanation of why this is relevant for the company (1 sentence)",
    "publishedDate": "Recent date in format: Dec 4, 2025",
    "source": "Source type like: Industry Report, Market Research, Tech Analysis, Business Insights"
  }
]

Make the news items diverse across categories. Focus on topics that would generate engaging, SEO-friendly blog content.
Return ONLY valid JSON array, no markdown formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a business intelligence analyst who identifies trending topics and news relevant to companies. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    let newsItems: NewsItem[];
    try {
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      console.error("Failed to parse news response:", responseText);
      // Return fallback news items
      newsItems = generateFallbackNews(companyName);
    }

    return NextResponse.json({ 
      news: newsItems,
      companyName,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Research news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", news: [] },
      { status: 500 }
    );
  }
}

function generateFallbackNews(companyName: string): NewsItem[] {
  const today = new Date();
  const formatDate = (daysAgo: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return [
    {
      id: "1",
      title: "Digital Transformation Strategies That Drive Real Business Results",
      summary: "Companies investing in digital transformation are seeing 2-3x returns. Learn the key strategies that separate successful transformations from failed initiatives.",
      category: "Industry Trends",
      keywords: ["digital transformation", "business strategy", "ROI"],
      relevance: `Essential reading for ${companyName} to stay competitive in the digital age.`,
      publishedDate: formatDate(0),
      source: "Industry Report",
    },
    {
      id: "2",
      title: "The Rise of AI-Powered Customer Experience",
      summary: "AI is revolutionizing how businesses interact with customers. From chatbots to personalization, discover how leading companies are leveraging AI for better customer outcomes.",
      category: "Technology",
      keywords: ["AI", "customer experience", "automation"],
      relevance: `Opportunities for ${companyName} to enhance customer engagement through AI.`,
      publishedDate: formatDate(1),
      source: "Tech Analysis",
    },
    {
      id: "3",
      title: "Sustainable Business Practices: A Competitive Advantage",
      summary: "Sustainability is no longer optional. Companies with strong ESG practices are outperforming peers. Here's how to build sustainability into your business model.",
      category: "Best Practices",
      keywords: ["sustainability", "ESG", "business strategy"],
      relevance: `Growing importance of sustainability for ${companyName}'s brand and operations.`,
      publishedDate: formatDate(2),
      source: "Business Insights",
    },
    {
      id: "4",
      title: "Remote Work Evolution: Hybrid Models That Actually Work",
      summary: "Two years into the remote work revolution, clear patterns are emerging. Learn which hybrid work models are driving productivity and employee satisfaction.",
      category: "How-To Guide",
      keywords: ["remote work", "hybrid work", "productivity"],
      relevance: `Relevant for ${companyName}'s workforce strategy and talent retention.`,
      publishedDate: formatDate(3),
      source: "Market Research",
    },
    {
      id: "5",
      title: "Content Marketing ROI: Metrics That Matter in 2025",
      summary: "Content marketing continues to evolve. Discover which metrics actually predict success and how to optimize your content strategy for maximum impact.",
      category: "Market Analysis",
      keywords: ["content marketing", "ROI", "metrics"],
      relevance: `Direct application for ${companyName}'s marketing efforts.`,
      publishedDate: formatDate(1),
      source: "Marketing Insights",
    },
    {
      id: "6",
      title: "Building Trust Through Thought Leadership",
      summary: "Thought leadership is becoming a key differentiator. Learn how to establish your brand as an industry authority through strategic content and engagement.",
      category: "Opinion",
      keywords: ["thought leadership", "brand authority", "content strategy"],
      relevance: `Opportunity for ${companyName} to establish industry expertise.`,
      publishedDate: formatDate(4),
      source: "Business Insights",
    },
    {
      id: "7",
      title: "Data Privacy Regulations: What Every Business Needs to Know",
      summary: "Privacy regulations are tightening globally. Stay compliant and build customer trust by understanding the latest requirements and best practices.",
      category: "Research",
      keywords: ["data privacy", "GDPR", "compliance"],
      relevance: `Critical compliance information for ${companyName}'s operations.`,
      publishedDate: formatDate(2),
      source: "Industry Report",
    },
    {
      id: "8",
      title: "The Future of B2B Sales: Personalization at Scale",
      summary: "B2B buyers expect B2C-level personalization. Discover how leading companies are using data and technology to deliver personalized experiences at scale.",
      category: "Case Study",
      keywords: ["B2B sales", "personalization", "customer experience"],
      relevance: `Actionable insights for ${companyName}'s sales and marketing teams.`,
      publishedDate: formatDate(1),
      source: "Market Research",
    },
  ];
}
