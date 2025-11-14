import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { isNull, or, eq } from "drizzle-orm";

// This endpoint fixes blogs that are missing the slug field after migration
export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find blogs with null or empty slugs
    const blogsToFix = await db.query.blogs.findMany({
      where: or(isNull(blogs.slug), eq(blogs.slug, "")),
    });

    let fixed = 0;
    for (const blog of blogsToFix) {
      // Generate slug from title
      const slug = blog.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      await db
        .update(blogs)
        .set({ slug })
        .where(eq(blogs.id, blog.id));

      fixed++;
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} blogs with missing slugs`,
    });
  } catch (error) {
    console.error("Fix blogs error:", error);
    return NextResponse.json(
      { error: "Failed to fix blogs" },
      { status: 500 }
    );
  }
}
