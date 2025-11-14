import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogImages, blogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { externalUploadImage, isExternalBackendConfigured } from "@/lib/image-backend";

// Upload a manually edited image (base64) to external storage and persist a DB record
// Expects JSON: { imageData: string (data URL), blogId?: number, altText?: string, prompt?: string }
export async function POST(request: NextRequest) {
  try {
    const { imageData, blogId, altText, prompt } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: "imageData is required" }, { status: 400 });
    }

    if (!isExternalBackendConfigured()) {
      return NextResponse.json(
        { error: "External image backend is not configured (set IMAGE_BACKEND_BASE)", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

    const { imageUrl, s3Key } = await externalUploadImage({ imageData, altText, prompt, blogId });

    let saved: { id: number } | null = null;
    if (blogId) {
      // Ensure blog exists before inserting
      const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
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
    }

    return NextResponse.json({ imageUrl, s3Key, id: saved?.id });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
