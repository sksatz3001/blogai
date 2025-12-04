import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogImages, blogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadToS3, isS3Configured } from "@/lib/s3-upload";

// Upload a manually edited image (base64) directly to S3 and persist a DB record
// Expects JSON: { imageData: string (data URL), blogId?: number, altText?: string, prompt?: string }
export async function POST(request: NextRequest) {
  try {
    const { imageData, blogId, altText, prompt } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: "imageData is required" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 is not configured (set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME)", code: "NO_S3" },
        { status: 501 }
      );
    }

    // Resolve userId from blog if blogId is provided
    let userId: string = "0";
    let blog: any = null;
    if (blogId) {
      blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
      if (blog) {
        userId = String(blog.userId);
      }
    }

    // Upload directly to S3
    const { imageUrl, s3Key } = await uploadToS3({ 
      base64Data: imageData, 
      userId, 
      blogId: blogId || "0" 
    });

    let saved: { id: number } | null = null;
    if (blog) {
      const [rec] = await db.insert(blogImages).values({
        blogId: blog.id,
        imageUrl,
        s3Key,
        imagePrompt: prompt || null as any,
        altText: altText || null as any,
      }).returning({ id: blogImages.id });
      saved = rec;
    }

    return NextResponse.json({ imageUrl, s3Key, id: saved?.id });
  } catch (error) {
    console.error("Image upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
