import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreImage, isExternalBackendConfigured } from "@/lib/image-backend";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { deductCredits, CREDIT_COSTS } from "@/lib/credits";

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

    const { prompt, blogId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!blogId) {
      return NextResponse.json(
        { error: "blogId is required" },
        { status: 400 }
      );
    }

    // Check and deduct credits before generation
    const creditResult = await deductCredits({
      userId: dbUser.id,
      amount: CREDIT_COSTS.IMAGE_GENERATION,
      type: 'image_generation',
      description: 'AI image generation',
      metadata: {
        blogId: Number(blogId),
        imagePrompt: prompt.substring(0, 200),
      },
    });

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || "Insufficient credits",
        creditsRequired: CREDIT_COSTS.IMAGE_GENERATION,
        currentCredits: creditResult.newBalance,
      }, { status: 402 });
    }

    // Check if OpenAI API key is configured
    if (!isExternalBackendConfigured()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured for image generation", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

    // Verify blog exists and user owns it
    const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
    if (!blog || blog.userId !== dbUser.id) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Generate image and store in database
    const { imageId, imageUrl } = await generateAndStoreImage({
      prompt,
      blogId: Number(blogId),
      altText: prompt,
    });

    return NextResponse.json({ imageUrl, imageId, provider: "openai" });
  } catch (error) {
    console.error("Error generating image:", error);
    const message = (error as Error)?.message || "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
