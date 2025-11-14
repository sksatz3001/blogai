import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { website } = await req.json();

    if (!website) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    // Use OpenAI to fetch and summarize company details
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes company websites and provides concise, professional company descriptions. Extract the company's main purpose, products/services, and value proposition from the given website URL. Keep the description under 200 words and make it professional and engaging.",
        },
        {
          role: "user",
          content: `Please analyze this company website and provide a brief, professional description of the company: ${website}
          
          Include:
          - What the company does
          - Their main products/services
          - Their value proposition or unique selling points
          
          Keep it concise (under 200 words) and professional.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const description = completion.choices[0]?.message?.content?.trim() || "";

    if (!description) {
      return NextResponse.json(
        { error: "Failed to generate company description" },
        { status: 500 }
      );
    }

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("Company details fetch error:", error);
    
    // Handle specific OpenAI errors
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI API key is invalid or missing" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
