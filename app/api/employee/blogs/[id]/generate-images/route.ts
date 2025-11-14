import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, employees, blogImages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEmployeeSession } from "@/lib/employee-auth";
import { externalGenerateSingleImage, isExternalBackendConfigured } from "@/lib/image-backend";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await db.query.employees.findFirst({
      where: eq(employees.id, session.employeeId),
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: "Employee not found or inactive" }, { status: 404 });
    }

    const params = await context.params;
    const blogId = parseInt(params.id);

    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.employeeId, employee.id)),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
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
      return NextResponse.json({ 
        message: "No image placeholders found",
        images: [] 
      });
    }

    if (!isExternalBackendConfigured()) {
      return NextResponse.json(
        { error: "External image backend not configured (set IMAGE_BACKEND_BASE)", code: "NO_BACKEND" },
        { status: 501 }
      );
    }

  const generatedImages: Array<{ id: number; url: string; s3Key?: string; prompt: string; position: number; placeholder: string; }> = [];

    for (const placeholder of placeholders) {
      try {
        const res = await externalGenerateSingleImage({ prompt: placeholder.description, userId: String(blog.userId), blogId: String(blog.id) });
        const s3Key = res.s3Key;
        const storageBase = process.env.IMAGE_STORAGE_BASE || process.env.IMAGE_S3_BASE;
        if (!storageBase) {
          throw new Error('IMAGE_STORAGE_BASE not set');
        }
        const imageUrl = `${storageBase.replace(/\/$/, '')}/${s3Key}`;
        
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
      return NextResponse.json({ error: "Failed to generate images via external backend" }, { status: 502 });
    }

    return NextResponse.json({ message: "Images generated", images: generatedImages });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
