import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogImages, blogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { storeImageInDb, updateImageInDb } from "@/lib/image-backend";

// Upload a manually edited image (base64) directly to database
// Expects JSON: { imageData: string (data URL), blogId?: number, altText?: string, prompt?: string, imageId?: number }
export async function POST(request: NextRequest) {
  try {
    const { imageData, blogId, altText, prompt, imageId } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: "imageData is required" }, { status: 400 });
    }

    // If imageId is provided, update existing image
    if (imageId) {
      const { imageUrl } = await updateImageInDb({
        imageId: Number(imageId),
        imageData,
      });
      return NextResponse.json({ imageUrl, id: imageId });
    }

    // Otherwise, create new image
    // Resolve blog if blogId is provided
    let blog: any = null;
    if (blogId) {
      blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
    }

    if (!blog) {
      return NextResponse.json(
        { error: "blogId is required to store new images" },
        { status: 400 }
      );
    }

    // Store image in database
    const { imageId: newImageId, imageUrl } = await storeImageInDb({
      imageData,
      blogId: blog.id,
      altText: altText || null,
      prompt: prompt || null,
    });

    return NextResponse.json({ imageUrl, id: newImageId });
  } catch (error) {
    console.error("Image upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
