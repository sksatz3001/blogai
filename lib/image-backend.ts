import OpenAI from "openai";
import { db } from "@/db";
import { blogImages } from "@/db/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Check if OpenAI image generation is configured
 */
export function isExternalBackendConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Get the base URL for image serving
 */
function getImageBaseUrl(): string {
  // Use environment variable or default to relative path
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

/**
 * Generate a single image using OpenAI DALL-E and store in database
 * @param params - Prompt and required blogId
 * @returns Object with imageId of the stored image
 */
export async function generateAndStoreImage(params: {
  prompt: string;
  blogId: number;
  altText?: string;
  position?: number;
}): Promise<{ imageId: number; imageUrl: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log(`Generating image with OpenAI DALL-E for prompt: "${params.prompt.slice(0, 100)}..."`);

  try {
    // Generate image using OpenAI DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: params.prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      throw new Error("OpenAI returned no image data");
    }

    // Store in database
    const baseUrl = getImageBaseUrl();
    const [savedImage] = await db
      .insert(blogImages)
      .values({
        blogId: params.blogId,
        imageUrl: "", // Will be updated after we get the ID
        imageData: imageData, // Store base64 without data URL prefix
        contentType: "image/png",
        imagePrompt: params.prompt,
        altText: params.altText || params.prompt,
        position: params.position,
        width: 1024,
        height: 1024,
      })
      .returning();

    // Update imageUrl with the proper API endpoint
    const imageUrl = `${baseUrl}/api/images/serve/${savedImage.id}`;
    
    // Update the imageUrl in the database
    await db
      .update(blogImages)
      .set({ imageUrl })
      .where(require("drizzle-orm").eq(blogImages.id, savedImage.id));

    console.log(`Successfully generated and stored image in DB with ID: ${savedImage.id}`);

    return { imageId: savedImage.id, imageUrl };
  } catch (error) {
    console.error("OpenAI image generation failed:", error);
    throw new Error(`Image generation failed: ${(error as Error).message}`);
  }
}

/**
 * Store an image in the database (for manual image uploads)
 * No AI processing - just stores the provided image data
 */
export async function storeImageInDb(params: {
  imageData: string;
  blogId: number;
  altText?: string;
  prompt?: string;
  position?: number;
}): Promise<{ imageId: number; imageUrl: string }> {
  console.log("storeImageInDb called with:", {
    imageDataLength: params.imageData?.length,
    blogId: params.blogId,
    altText: params.altText,
  });

  try {
    // Extract base64 data and content type
    let base64Data = params.imageData;
    let contentType = "image/png";
    
    if (params.imageData.startsWith("data:")) {
      const matches = params.imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
      }
    }

    const baseUrl = getImageBaseUrl();
    
    // Store in database
    const [savedImage] = await db
      .insert(blogImages)
      .values({
        blogId: params.blogId,
        imageUrl: "", // Will be updated after we get the ID
        imageData: base64Data,
        contentType,
        imagePrompt: params.prompt,
        altText: params.altText,
        position: params.position,
      })
      .returning();

    // Update imageUrl with the proper API endpoint
    const imageUrl = `${baseUrl}/api/images/serve/${savedImage.id}`;
    
    // Update the imageUrl in the database
    await db
      .update(blogImages)
      .set({ imageUrl })
      .where(require("drizzle-orm").eq(blogImages.id, savedImage.id));

    console.log(`Successfully stored image in DB with ID: ${savedImage.id}`);

    return { imageId: savedImage.id, imageUrl };
  } catch (error) {
    console.error("Image storage failed:", error);
    throw new Error(`Image storage failed: ${(error as Error).message}`);
  }
}

/**
 * Update an existing image in the database (for edited images)
 */
export async function updateImageInDb(params: {
  imageId: number;
  imageData: string;
}): Promise<{ imageUrl: string }> {
  try {
    // Extract base64 data and content type
    let base64Data = params.imageData;
    let contentType = "image/png";
    
    if (params.imageData.startsWith("data:")) {
      const matches = params.imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        base64Data = matches[2];
      }
    }

    const baseUrl = getImageBaseUrl();
    const imageUrl = `${baseUrl}/api/images/serve/${params.imageId}`;
    
    // Update in database
    await db
      .update(blogImages)
      .set({ 
        imageData: base64Data,
        contentType,
        imageUrl,
      })
      .where(require("drizzle-orm").eq(blogImages.id, params.imageId));

    console.log(`Successfully updated image in DB with ID: ${params.imageId}`);

    return { imageUrl };
  } catch (error) {
    console.error("Image update failed:", error);
    throw new Error(`Image update failed: ${(error as Error).message}`);
  }
}

// ============================================================
// DEPRECATED FUNCTIONS - Kept for backwards compatibility
// ============================================================

/**
 * @deprecated Use generateAndStoreImage instead. This returns s3Key for backwards compatibility.
 */
export async function externalGenerateSingleImage(params: {
  prompt: string;
  userId?: string;
  blogId?: string | number;
}): Promise<{ s3Key: string }> {
  if (!params.blogId) {
    throw new Error("blogId is required for image generation");
  }

  const result = await generateAndStoreImage({
    prompt: params.prompt,
    blogId: Number(params.blogId),
    altText: params.prompt,
  });

  // Return imageId as s3Key for backwards compatibility
  return { s3Key: String(result.imageId) };
}

/**
 * @deprecated Use storeImageInDb instead.
 */
export async function externalUploadImage(params: {
  imageData: string;
  altText?: string;
  prompt?: string;
  blogId?: number | string;
  userId?: string | number;
}): Promise<{ imageUrl: string; s3Key?: string }> {
  if (!params.blogId) {
    throw new Error("blogId is required for image upload");
  }

  const result = await storeImageInDb({
    imageData: params.imageData,
    blogId: Number(params.blogId),
    altText: params.altText,
    prompt: params.prompt,
  });

  return { imageUrl: result.imageUrl, s3Key: String(result.imageId) };
}

/**
 * @deprecated AI-based image editing has been removed.
 */
export async function externalEditImage(params: {
  imageUrl?: string;
  imageData?: string;
  prompt: string;
}): Promise<{ imageUrl: string; s3Key?: string }> {
  throw new Error(
    "AI-based image editing has been removed. Please use manual image editing features instead."
  );
}

/**
 * @deprecated AI-based image editing has been removed.
 */
export async function externalPromptEditImage(params: {
  sourceImageUrl: string;
  prompt: string;
  userId?: string;
  blogId?: string | number;
}): Promise<{ editedImageUrl: string; s3Key?: string }> {
  throw new Error(
    "AI-based image editing has been removed. Please use manual image editing features instead."
  );
}
