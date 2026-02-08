ALTER TABLE "blog_images" ADD COLUMN "image_data" text;
ALTER TABLE "blog_images" ADD COLUMN "content_type" text DEFAULT 'image/png';
