import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getEmployeeSession } from "@/lib/employee-auth";
import { generateAndStoreImage, isExternalBackendConfigured } from "@/lib/image-backend";

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
      return NextResponse.json({ error: "Failed to generate images" }, { status: 502 });
    }

    return NextResponse.json({ message: "Images generated", images: generatedImages });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
