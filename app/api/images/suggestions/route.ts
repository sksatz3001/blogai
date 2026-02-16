import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!title && !content) {
      return NextResponse.json(
        { error: "Title or content is required" },
        { status: 400 }
      );
    }

    // Extract a summary of the content for context (limit to avoid token issues)
    const contentSummary = content 
      ? content.replace(/<[^>]*>/g, ' ').slice(0, 1500).trim()
      : '';

    const prompt = `Based on this blog:
Title: "${title || 'Untitled'}"
${contentSummary ? `Content summary: "${contentSummary}"` : ''}

Generate image suggestions for this blog. Return a JSON object with:
1. "placeholder": A creative, specific placeholder text (50-80 words) describing an ideal image for this blog that would engage readers
2. "suggestions": An array of exactly 5 short image prompt suggestions (each 5-10 words) that would work well as images in this blog

Focus on professional, relevant visuals that match the blog's topic and tone.

Return ONLY valid JSON in this exact format:
{
  "placeholder": "Your detailed placeholder description here...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative visual consultant who suggests compelling image ideas for blog content. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      // Fallback to generic suggestions
      result = {
        placeholder: `A professional, high-quality image related to "${title || 'your blog topic'}". Consider including relevant visual elements that complement your content and engage readers.`,
        suggestions: [
          "Professional business illustration",
          "Modern infographic design",
          "Team collaboration scene",
          "Technology and innovation visual",
          "Abstract conceptual artwork",
        ],
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Image suggestions error:", error);
    // Return fallback suggestions on error
    return NextResponse.json({
      placeholder: "Describe the image you want to generate. Be specific about style, colors, composition, and mood for best results.",
      suggestions: [
        "Professional business scene",
        "Modern technology illustration",
        "Creative abstract design",
        "Nature landscape view",
        "Minimalist concept art",
      ],
    });
  }
}
