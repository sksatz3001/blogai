import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blogImages, blogs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

// Persist an externally edited image URL & s3 key to the blog_images row that had the original imageUrl
// Body: { blogId: number|string, originalImageUrl: string, editedImageUrl: string, s3Key?: string }
export async function POST(request: NextRequest) {
  try {
    const { blogId, originalImageUrl, editedImageUrl, s3Key } = await request.json();
    if (!blogId || !originalImageUrl || !editedImageUrl) {
      return NextResponse.json({ error: 'blogId, originalImageUrl, editedImageUrl are required' }, { status: 400 });
    }

    const blog = await db.query.blogs.findFirst({ where: eq(blogs.id, Number(blogId)) });
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Find matching image record
    const existing = await db.query.blogImages.findFirst({
      where: and(eq(blogImages.blogId, Number(blogId)), eq(blogImages.imageUrl, originalImageUrl)),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Original image record not found' }, { status: 404 });
    }

    await db.update(blogImages)
      .set({ imageUrl: editedImageUrl, s3Key: s3Key || existing.s3Key })
      .where(eq(blogImages.id, existing.id));

    return NextResponse.json({ updated: true, id: existing.id, imageUrl: editedImageUrl, s3Key: s3Key || existing.s3Key });
  } catch (e) {
    console.error('apply-edit error:', e);
    return NextResponse.json({ error: 'Failed to apply edit' }, { status: 500 });
  }
}