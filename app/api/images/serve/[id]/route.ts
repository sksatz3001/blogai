import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { blogImages } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/images/serve/[id]
 * Serve an image from the database by its ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
    }

    // Fetch the image from database
    const image = await db.query.blogImages.findFirst({
      where: eq(blogImages.id, imageId),
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (!image.imageData) {
      // If no imageData, try to redirect to imageUrl (for legacy S3 images)
      if (image.imageUrl) {
        return NextResponse.redirect(image.imageUrl);
      }
      return NextResponse.json({ error: "Image data not available" }, { status: 404 });
    }

    // Convert base64 to binary
    const imageBuffer = Buffer.from(image.imageData, "base64");

    // Return the image with proper headers
    // Use ETag for cache validation so edited images can be refreshed
    const etag = `"${imageId}-${image.imageData.length}"`;
    
    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": image.contentType || "image/png",
        "Content-Length": String(imageBuffer.length),
        "Cache-Control": "public, max-age=3600, must-revalidate", // Cache for 1 hour, but revalidate
        "ETag": etag,
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
