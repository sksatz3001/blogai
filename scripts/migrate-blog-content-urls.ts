import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/db";
import { blogs } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to update S3 URLs in blog HTML content
 * 
 * This script updates any S3 URLs embedded in the blog htmlContent field
 * from the old bucket to the new bucket
 */

const OLD_BUCKET = "jagratiblogai";
const NEW_BUCKET = process.env.S3_BUCKET_NAME || "contendodev";
const AWS_REGION = process.env.AWS_DEFAULT_REGION || "ap-south-1";

async function migrateBlogContentUrls() {
  console.log(`Starting blog content URL migration...`);
  console.log(`Old bucket: ${OLD_BUCKET}`);
  console.log(`New bucket: ${NEW_BUCKET}`);

  try {
    const oldBucketUrl = `https://${OLD_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    const newBucketUrl = `https://${NEW_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

    // Get all blogs with content
    const allBlogs = await db.select().from(blogs);
    console.log(`\nTotal blogs in database: ${allBlogs.length}`);

    const blogsToUpdate = allBlogs.filter(blog => 
      blog.htmlContent && blog.htmlContent.includes(OLD_BUCKET)
    );

    console.log(`Blogs with old bucket URLs in content: ${blogsToUpdate.length}`);

    if (blogsToUpdate.length === 0) {
      console.log("\n✅ No blog content needs updating. Migration complete!");
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const blog of blogsToUpdate) {
      try {
        const oldContent = blog.htmlContent!;
        // Replace all occurrences of old bucket URL with new bucket URL
        const newContent = oldContent.replace(
          new RegExp(oldBucketUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          newBucketUrl
        );

        // Count how many replacements were made
        const matches = oldContent.match(new RegExp(oldBucketUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        const replacementCount = matches ? matches.length : 0;

        await db
          .update(blogs)
          .set({ htmlContent: newContent })
          .where(sql`${blogs.id} = ${blog.id}`);

        console.log(`✓ Updated blog ${blog.id} (${blog.title}): ${replacementCount} URL(s) replaced`);
        updated++;
      } catch (error) {
        console.error(`✗ Failed to update blog ${blog.id}:`, error);
        failed++;
      }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Total blogs processed: ${blogsToUpdate.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log(`\n✅ Migration completed successfully!`);
    } else {
      console.log(`\n⚠️  Migration completed with ${failed} errors.`);
    }

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateBlogContentUrls()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
