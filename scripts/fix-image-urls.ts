/**
 * Script to fix all image URLs in the database.
 * Converts absolute URLs like:
 *   http://localhost:3000/api/images/serve/187
 *   https://blogai-p9jdn164x-....vercel.app/api/images/serve/187
 * To relative URLs:
 *   /api/images/serve/187
 */

import { db } from "@/db";
import { blogImages, blogs } from "@/db/schema";
import { sql } from "drizzle-orm";

async function fixImageUrls() {
  console.log("🔧 Fixing image URLs in database...\n");

  // 1. Fix imageUrl in blogImages table
  const allImages = await db.select().from(blogImages);
  console.log(`Found ${allImages.length} images in blogImages table`);

  let fixedCount = 0;
  for (const img of allImages) {
    if (!img.imageUrl) continue;

    // Extract the relative path /api/images/serve/{id}
    const match = img.imageUrl.match(/\/api\/images\/serve\/\d+/);
    if (match && img.imageUrl !== match[0]) {
      const newUrl = match[0];
      await db
        .update(blogImages)
        .set({ imageUrl: newUrl })
        .where(sql`id = ${img.id}`);
      console.log(`  ✅ Image #${img.id}: ${img.imageUrl} → ${newUrl}`);
      fixedCount++;
    }
  }
  console.log(`\nFixed ${fixedCount} image URLs in blogImages table`);

  // 2. Fix image src URLs embedded in blog content (HTML)
  const allBlogs = await db.select().from(blogs);
  console.log(`\nChecking ${allBlogs.length} blogs for embedded image URLs...`);

  let blogFixedCount = 0;
  for (const blog of allBlogs) {
    if (!blog.content) continue;

    // Replace any absolute URLs pointing to /api/images/serve/ with relative ones
    const fixed = blog.content.replace(
      /https?:\/\/[^"'\s]*?(\/api\/images\/serve\/\d+)/g,
      "$1"
    );

    if (fixed !== blog.content) {
      await db
        .update(blogs)
        .set({ content: fixed })
        .where(sql`id = ${blog.id}`);
      console.log(`  ✅ Blog #${blog.id}: Fixed embedded image URLs`);
      blogFixedCount++;
    }
  }
  console.log(`Fixed embedded URLs in ${blogFixedCount} blogs`);

  console.log("\n✅ Done!");
  process.exit(0);
}

fixImageUrls().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
