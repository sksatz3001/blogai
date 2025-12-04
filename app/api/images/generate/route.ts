import { NextRequest, NextResponse } from "next/server";
import { externalGenerateSingleImage, isExternalBackendConfigured } from "@/lib/image-backend";
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

    // Check and deduct credits before generation
    const creditResult = await deductCredits({
      userId: dbUser.id,
      amount: CREDIT_COSTS.IMAGE_GENERATION,
      type: 'image_generation',
      description: 'AI image generation',
      metadata: {
        blogId: blogId ? Number(blogId) : undefined,
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

    // Try external backend first if configured, else fall back
    if (!isExternalBackendConfigured()) {
      return NextResponse.json(
        { error: "External image backend not configured (set IMAGE_BACKEND_BASE)", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

    // Resolve numeric userId from blog if provided (to pass to backend)
    let ownerUserId: string | undefined = undefined;
    let resolvedBlogId: string | undefined = undefined;
    if (blogId) {
      const b = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
      if (b) {
        ownerUserId = String(b.userId);
        resolvedBlogId = String(b.id);
      }
    }

    // Use external backend only (contract returns s3_key)
    const { s3Key } = await externalGenerateSingleImage({ prompt, userId: ownerUserId, blogId: resolvedBlogId });

    // Strict: require S3 base configured; do NOT fall back to by-key proxy
    const storageBase = process.env.IMAGE_STORAGE_BASE || process.env.IMAGE_S3_BASE;
    if (!storageBase) {
      return NextResponse.json({ error: 'IMAGE_STORAGE_BASE not set; configure it to form final image URL', code: 'NO_STORAGE_BASE' }, { status: 500 });
    }
    const imageUrl = `${storageBase.replace(/\/$/, '')}/${s3Key}`;

    return NextResponse.json({ imageUrl, s3Key, provider: "external" });
  } catch (error) {
    console.error("Error generating image:", error);
    const message = (error as Error)?.message || "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
