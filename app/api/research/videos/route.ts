import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/research/videos
 * Find relevant YouTube videos for a blog topic
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
    const { topic, keywords } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Use AI to suggest relevant YouTube search queries and video embed ideas
    const prompt = `For a blog article about "${topic}" with keywords: ${keywords?.join(", ") || "none specified"}, suggest relevant YouTube videos that would enhance the content.

Return a JSON response with:
{
  "videoSuggestions": [
    {
      "searchQuery": "exact YouTube search query to find this video",
      "description": "Why this video is relevant to the blog",
      "embedPlacement": "Which section of the blog this video should go in",
      "type": "Tutorial/Explainer/Case Study/Interview/Demo"
    }
  ],
  "stockPhotoSuggestions": [
    {
      "searchQuery": "search query for stock photo sites like Unsplash or Pexels",
      "description": "What the photo should show",
      "placement": "Which section this photo belongs in",
      "unsplashUrl": "https://unsplash.com/s/photos/{encoded-search-query}"
    }
  ]
}

Provide 3-5 video suggestions and 4-6 stock photo suggestions.
Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a content strategist specializing in multimedia content for blogs. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let mediaData;

    try {
      mediaData = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "Failed to parse media suggestions" }, { status: 500 });
    }

    // Try to find real YouTube video IDs via YouTube search
    if (mediaData.videoSuggestions) {
      for (const suggestion of mediaData.videoSuggestions) {
        try {
          const videoId = await searchYouTubeVideo(suggestion.searchQuery);
          if (videoId) {
            suggestion.videoId = videoId;
            suggestion.embedHtml = `<div class="video-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" title="${suggestion.searchQuery}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            suggestion.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        } catch (e) {
          // Continue without video ID
        }
      }
    }

    // Add Unsplash/Pexels direct URLs for stock photos
    if (mediaData.stockPhotoSuggestions) {
      for (const photo of mediaData.stockPhotoSuggestions) {
        const query = encodeURIComponent(photo.searchQuery);
        photo.unsplashUrl = `https://unsplash.com/s/photos/${query}`;
        photo.pexelsUrl = `https://www.pexels.com/search/${query}/`;
      }
    }

    return NextResponse.json(mediaData);
  } catch (error: any) {
    console.error("Video research error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to get media suggestions" },
      { status: 500 }
    );
  }
}

/**
 * Search YouTube for a video using the YouTube Data API or fallback to scraping
 */
async function searchYouTubeVideo(query: string): Promise<string | null> {
  // Try YouTube Data API if key is available
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&maxResults=1&key=${apiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.items?.[0]?.id?.videoId || null;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: Use YouTube search page scraping for video IDs
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodedQuery}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    if (response.ok) {
      const html = await response.text();
      // Extract first video ID from the search results
      const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      return videoIdMatch?.[1] || null;
    }
  } catch {
    // Return null if scraping fails
  }

  return null;
}
