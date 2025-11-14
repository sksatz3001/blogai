import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, parseInt(id)), eq(blogs.userId, dbUser.id)),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const body = await request.json();
  const { content, htmlContent } = body;

    await db
      .update(blogs)
      .set({
        content,
        htmlContent,
        wordCount: content ? content.split(/\s+/).length : 0,
        // Mark as saved (published) upon successful save
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save blog error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
