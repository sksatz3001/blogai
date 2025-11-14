-- Add optional s3_key column to blog_images for external storage reference
ALTER TABLE "blog_images" ADD COLUMN IF NOT EXISTS "s3_key" text;