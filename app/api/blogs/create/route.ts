import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { title, primaryKeyword, secondaryKeywords, targetWordCount, companyProfileId, status } = body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create blog entry - status can be 'draft' or 'processing'
    // Handle secondaryKeywords - can be array or string
    const secondaryKeywordsArray = Array.isArray(secondaryKeywords) 
      ? secondaryKeywords 
      : (secondaryKeywords ? secondaryKeywords.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    
    const [newBlog] = await db
      .insert(blogs)
      .values({
        userId: dbUser.id,
        companyProfileId: companyProfileId || null,
        title,
        slug,
        content: '', // Empty content initially
        primaryKeyword: primaryKeyword || null,
        targetKeywords: `${primaryKeyword}${secondaryKeywordsArray.length > 0 ? ',' + secondaryKeywordsArray.join(',') : ''}`, // Store keywords
        secondaryKeywords: secondaryKeywordsArray,
        wordCount: targetWordCount || 1000,
        status: status || "draft",
      })
      .returning();

    return NextResponse.json({ blogId: newBlog.id, success: true });
  } catch (error) {
    console.error("Blog creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
