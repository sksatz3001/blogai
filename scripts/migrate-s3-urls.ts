// Load environment variables BEFORE any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { blogImages, blogs } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to update old S3 bucket URLs to new bucket
 * 
 * This script:
 * 1. Finds all blogImages with old bucket name in imageUrl
 * 2. Updates imageUrl to use new bucket name
 * 3. Ensures s3Key is preserved (used for presigned URLs)
 */

const OLD_BUCKET = "jagratiblogai";
const NEW_BUCKET = process.env.S3_BUCKET_NAME || "contendodev";
const AWS_REGION = process.env.AWS_DEFAULT_REGION || "ap-south-1";

async function migrateS3Urls() {
  console.log(`Starting S3 URL migration...`);
  console.log(`Old bucket: ${OLD_BUCKET}`);
  console.log(`New bucket: ${NEW_BUCKET}`);
  console.log(`Region: ${AWS_REGION}`);

  try {
    // Find all images with old bucket URL
    const oldBucketUrl = `https://${OLD_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    const newBucketUrl = `https://${NEW_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

    console.log(`\nSearching for images with URL pattern: ${oldBucketUrl}`);

    // Get all blog images
    const allImages = await db.select().from(blogImages);
    console.log(`\nTotal images in database: ${allImages.length}`);

    const imagesToUpdate = allImages.filter(img => 
      img.imageUrl.includes(OLD_BUCKET)
    );

    console.log(`Images to update: ${imagesToUpdate.length}`);

    if (imagesToUpdate.length === 0) {
      console.log("\n✅ No images need updating. Migration complete!");
      return;
    }

    // Update each image
    let updated = 0;
    let failed = 0;

    for (const image of imagesToUpdate) {
      try {
        const oldUrl = image.imageUrl;
        const newUrl = oldUrl.replace(oldBucketUrl, newBucketUrl);

        await db
          .update(blogImages)
          .set({ imageUrl: newUrl })
          .where(sql`${blogImages.id} = ${image.id}`);

        console.log(`✓ Updated image ${image.id}: ${oldUrl} → ${newUrl}`);
        updated++;
      } catch (error) {
        console.error(`✗ Failed to update image ${image.id}:`, error);
        failed++;
      }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Total images processed: ${imagesToUpdate.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
      console.log(`\n✅ Migration completed successfully!`);
    } else {
      console.log(`\n⚠️  Migration completed with ${failed} errors.`);
    }

    // Also update blog featured images if stored directly in blogs table
    const blogsWithOldUrl = await db.select().from(blogs);
    const blogsToUpdate = blogsWithOldUrl.filter(blog => 
      blog.featuredImage && blog.featuredImage.includes(OLD_BUCKET)
    );

    if (blogsToUpdate.length > 0) {
      console.log(`\n\nFound ${blogsToUpdate.length} blogs with old featured image URLs`);
      
      let blogsUpdated = 0;
      for (const blog of blogsToUpdate) {
        try {
          const oldFeaturedImage = blog.featuredImage!;
          const newFeaturedImage = oldFeaturedImage.replace(oldBucketUrl, newBucketUrl);

          await db
            .update(blogs)
            .set({ featuredImage: newFeaturedImage })
            .where(sql`${blogs.id} = ${blog.id}`);

          console.log(`✓ Updated blog ${blog.id} featured image`);
          blogsUpdated++;
        } catch (error) {
          console.error(`✗ Failed to update blog ${blog.id}:`, error);
        }
      }

      console.log(`\nBlog featured images updated: ${blogsUpdated}/${blogsToUpdate.length}`);
    }

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration
migrateS3Urls()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
