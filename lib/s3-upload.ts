import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "contendodev";
const STORAGE_BASE = process.env.IMAGE_STORAGE_BASE || `https://${BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION || "ap-south-1"}.amazonaws.com`;

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}

/**
 * Generate a presigned URL for private S3 objects
 * @param s3Key - The S3 key/path to the object
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL that can access the private object
 */
export async function getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${(error as Error).message}`);
  }
}

/**
 * Upload a base64 image to S3
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param userId - User ID for organizing in S3
 * @param blogId - Blog ID for organizing in S3
 * @param filename - Optional filename (will generate one if not provided)
 * @returns Object with imageUrl and s3Key
 */
export async function uploadToS3(params: {
  base64Data: string;
  userId: string | number;
  blogId: string | number;
  filename?: string;
}): Promise<{ imageUrl: string; s3Key: string }> {
  const { base64Data, userId, blogId, filename } = params;

  // Extract the actual base64 data and content type
  let contentType = "image/png";
  let base64Content = base64Data;

  if (base64Data.startsWith("data:")) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      contentType = matches[1];
      base64Content = matches[2];
    }
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Content, "base64");

  // Generate a unique filename if not provided
  const extension = contentType.split("/")[1] || "png";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const finalFilename = filename || `edited_${timestamp}_${randomId}.${extension}`;

  // S3 key structure: userId/blogId/blog_image/filename
  // This matches the structure used by the external backend
  const s3Key = `${userId}/${blogId}/blog_image/${finalFilename}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: contentType,
    // Note: Bucket should have public access policy configured, not per-object ACL
  });

  try {
    await s3Client.send(command);
    
    // Construct the public URL
    const imageUrl = `${STORAGE_BASE.replace(/\/$/, "")}/${s3Key}`;
    
    console.log(`Successfully uploaded to S3: ${imageUrl}`);
    
    return { imageUrl, s3Key };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload to S3: ${(error as Error).message}`);
  }
}
