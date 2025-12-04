import { NextRequest, NextResponse } from "next/server";
import { externalPromptEditImage, isExternalBackendConfigured } from "@/lib/image-backend";
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

    const { sourceImageUrl, prompt, blogId } = await request.json();

    if (!sourceImageUrl || !prompt) {
      return NextResponse.json(
        { error: "sourceImageUrl and prompt are required" },
        { status: 400 }
      );
    }

    // Check and deduct credits before AI edit
    const creditResult = await deductCredits({
      userId: dbUser.id,
      amount: CREDIT_COSTS.IMAGE_EDIT,
      type: 'image_edit',
      description: 'AI image editing',
      metadata: {
        blogId: blogId ? Number(blogId) : undefined,
        imagePrompt: prompt.substring(0, 200),
      },
    });

    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || "Insufficient credits",
        creditsRequired: CREDIT_COSTS.IMAGE_EDIT,
        currentCredits: creditResult.newBalance,
      }, { status: 402 });
    }

    if (!isExternalBackendConfigured()) {
      return NextResponse.json(
        { error: "External image backend not configured (set IMAGE_BACKEND_BASE)", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

    // Resolve blog owner user id for contract (if blogId provided)
    let ownerUserId: string | undefined = undefined;
    let resolvedBlogId: string | undefined = undefined;
    if (blogId) {
      const b = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
      if (b) {
        ownerUserId = String(b.userId);
        resolvedBlogId = String(b.id);
      }
    }

    const { editedImageUrl, s3Key } = await externalPromptEditImage({
      sourceImageUrl,
      prompt,
      userId: ownerUserId,
      blogId: resolvedBlogId,
    });

    return NextResponse.json({ imageUrl: editedImageUrl, editedImageUrl, s3Key, provider: 'external' });
  } catch (error) {
    console.error("Error editing image with AI:", error);
    const message = (error as Error)?.message || "Failed to edit image with AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
