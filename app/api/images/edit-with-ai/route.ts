import { NextRequest, NextResponse } from "next/server";
import { externalPromptEditImage, isExternalBackendConfigured } from "@/lib/image-backend";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { sourceImageUrl, prompt, blogId } = await request.json();

    if (!sourceImageUrl || !prompt) {
      return NextResponse.json(
        { error: "sourceImageUrl and prompt are required" },
        { status: 400 }
      );
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
