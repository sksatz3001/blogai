import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, parseInt(id)),
    });

    if (!blog || blog.userId !== dbUser.id) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['draft', 'processing', 'published', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db
      .update(blogs)
      .set({ status, updatedAt: new Date() })
      .where(eq(blogs.id, blog.id));

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, parseInt(id)),
    });

    if (!blog || blog.userId !== dbUser.id) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: blog.status,
      hasContent: !!blog.content && blog.content.length > 100,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
