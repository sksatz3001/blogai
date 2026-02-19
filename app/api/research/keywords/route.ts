import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOpenRouterClient } from "@/lib/openrouter";

interface KeywordSuggestion {
  keyword: string;
  searchVolume: string; // estimated: "High", "Medium", "Low"
  difficulty: string; // "Easy", "Medium", "Hard"
  cpc: string; // estimated CPC range
  intent: string; // "Informational", "Commercial", "Transactional", "Navigational"
  trend: string; // "Rising", "Stable", "Declining"
  relatedQuestions: string[];
  longTailVariations: string[];
}

/**
 * POST /api/research/keywords
 * Get keyword research suggestions using AI + Google autocomplete
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { seedKeyword, industry, companyName } = body;

    if (!seedKeyword) {
      return NextResponse.json({ error: "Seed keyword is required" }, { status: 400 });
    }

    // Step 1: Fetch Google autocomplete suggestions
    const autocompleteSuggestions = await getGoogleAutocompleteSuggestions(seedKeyword);

    // Step 2: Use AI to generate comprehensive keyword research
    const companyContext = companyName || dbUser.companyName || "a business";
    const industryContext = industry || dbUser.companyDescription || "";

    const prompt = `You are an expert SEO keyword researcher with access to search engine data. Analyze the seed keyword "${seedKeyword}" and provide comprehensive keyword research.

Company Context: ${companyContext}
Industry: ${industryContext}
Google Autocomplete Suggestions: ${autocompleteSuggestions.join(", ")}
Current Date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Provide a JSON response with this EXACT structure:
{
  "primaryKeyword": {
    "keyword": "${seedKeyword}",
    "searchVolume": "High/Medium/Low (estimate based on topic popularity)",
    "difficulty": "Easy/Medium/Hard (estimate based on competition)",
    "cpc": "$X.XX - $X.XX (estimated CPC range)",
    "intent": "Informational/Commercial/Transactional/Navigational",
    "trend": "Rising/Stable/Declining"
  },
  "relatedKeywords": [
    {
      "keyword": "related keyword phrase",
      "searchVolume": "High/Medium/Low",
      "difficulty": "Easy/Medium/Hard",
      "cpc": "$X.XX - $X.XX",
      "intent": "Informational/Commercial/Transactional/Navigational",
      "trend": "Rising/Stable/Declining",
      "relatedQuestions": ["Question 1?", "Question 2?"],
      "longTailVariations": ["long tail keyword 1", "long tail keyword 2"]
    }
  ],
  "topQuestions": [
    "What is ${seedKeyword}?",
    "How to use ${seedKeyword}?",
    "Why is ${seedKeyword} important?"
  ],
  "contentIdeas": [
    {
      "title": "Blog post title idea",
      "primaryKeyword": "suggested primary keyword",
      "secondaryKeywords": ["kw1", "kw2", "kw3"],
      "estimatedTraffic": "High/Medium/Low",
      "contentType": "How-To/Listicle/Guide/Comparison/Case Study"
    }
  ],
  "trendingTopics": [
    "Current trending topic related to ${seedKeyword}"
  ]
}

Rules:
- Generate 10-15 related keywords
- Include 6-8 questions people ask
- Generate 5-6 content ideas with full blog titles
- Include 3-5 trending topics
- Make search volume, difficulty, and CPC estimates realistic
- Focus on keywords relevant to ${companyContext}
- Include a mix of head terms and long-tail keywords
- Prioritize keywords with commercial or informational intent
- Return ONLY valid JSON, no markdown`;

    const client = getOpenRouterClient();
    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO keyword researcher. Always respond with valid JSON only. Provide realistic estimates for search metrics based on your knowledge of search trends.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let keywordData;
    
    try {
      keywordData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse keyword research response:", responseText);
      return NextResponse.json({ error: "Failed to parse keyword data" }, { status: 500 });
    }

    // Merge Google autocomplete suggestions
    keywordData.autocompleteSuggestions = autocompleteSuggestions;

    return NextResponse.json(keywordData);
  } catch (error: any) {
    console.error("Keyword research error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate keyword research" },
      { status: 500 }
    );
  }
}

/**
 * Fetch Google autocomplete suggestions for a keyword
 */
async function getGoogleAutocompleteSuggestions(keyword: string): Promise<string[]> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodedKeyword}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    // Google autocomplete returns [query, [suggestions]]
    const suggestions = data[1] || [];
    return suggestions.slice(0, 10);
  } catch (error) {
    console.error("Google autocomplete error:", error);
    return [];
  }
}
