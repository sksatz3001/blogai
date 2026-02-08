import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateAndStoreImage, isExternalBackendConfigured } from "@/lib/image-backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return new Response("User not found", { status: 404 });
    }

    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, parseInt(id)),
    });

    if (!blog || blog.userId !== dbUser.id) {
      return new Response("Blog not found", { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    // Extract image placeholder markers from content
    const imagePlaceholderRegex = /\[IMAGE_PLACEHOLDER:([^\]]+)\]/g;
    const placeholders: Array<{ match: string; description: string; position: number }> = [];
    let match;

    while ((match = imagePlaceholderRegex.exec(content)) !== null) {
      placeholders.push({
        match: match[0],
        description: match[1].trim(),
        position: placeholders.length,
      });
    }

    if (placeholders.length === 0) {
      return Response.json({ 
        message: "No image placeholders found",
        images: [] 
      });
    }

    if (!isExternalBackendConfigured()) {
      return Response.json(
        { error: "OPENAI_API_KEY not configured for image generation", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

    const generatedImages: Array<{ id: number; url: string; prompt: string; position: number; placeholder: string; }> = [];

    for (const placeholder of placeholders) {
      try {
        // Generate image and store directly in database
        const { imageId, imageUrl } = await generateAndStoreImage({
          prompt: placeholder.description,
          blogId: blog.id,
          altText: placeholder.description,
          position: placeholder.position,
        });

        generatedImages.push({
          id: imageId,
          url: imageUrl,
          prompt: placeholder.description,
          position: placeholder.position,
          placeholder: placeholder.match,
        });
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }

    if (generatedImages.length === 0) {
      return Response.json({ error: "Failed to generate images" }, { status: 502 });
    }

    return Response.json({ message: "Images generated", images: generatedImages });
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
