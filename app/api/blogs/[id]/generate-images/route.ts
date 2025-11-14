import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blogs, users, blogImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { externalGenerateSingleImage, isExternalBackendConfigured } from "@/lib/image-backend";

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
        { error: "External image backend not configured (set IMAGE_BACKEND_BASE)", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

  const generatedImages: Array<{ id: number; url: string; s3Key?: string; prompt: string; position: number; placeholder: string; }> = [];

    for (const placeholder of placeholders) {
      try {
        // Prefer external backend generation when configured
        const res = await externalGenerateSingleImage({ prompt: placeholder.description, userId: String(dbUser.id), blogId: String(blog.id) });
        const s3Key = res.s3Key;
        const storageBase = process.env.IMAGE_STORAGE_BASE || process.env.IMAGE_S3_BASE;
        if (!storageBase) {
          throw new Error('IMAGE_STORAGE_BASE not set');
        }
        const imageUrl = `${storageBase.replace(/\/$/, '')}/${s3Key}`;
  const width = undefined;
  const height = undefined;
        
        // Save to database
        const [savedImage] = await db
          .insert(blogImages)
          .values({
            blogId: blog.id,
            imageUrl,
            s3Key,
            imagePrompt: placeholder.description,
            altText: placeholder.description,
            position: placeholder.position,
            width: null as any,
            height: null as any,
          })
          .returning();

        generatedImages.push({
          id: savedImage.id,
          url: imageUrl,
          s3Key: savedImage.s3Key || s3Key,
          prompt: placeholder.description,
          position: placeholder.position,
          placeholder: placeholder.match,
        });
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }

    if (generatedImages.length === 0) {
      return Response.json({ error: "Failed to generate images via external backend" }, { status: 502 });
    }

    return Response.json({ message: "Images generated", images: generatedImages });
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
