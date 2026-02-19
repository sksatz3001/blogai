import OpenAI from "openai";
import { db } from "@/db";
import { blogImages } from "@/db/schema";
import { getOpenRouterClient } from "@/lib/openrouter";

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
 * Get the base URL for image serving.
 * Always use empty string (relative URLs like /api/images/serve/123)
 * since the API and frontend are on the same domain.
 * This avoids issues with VERCEL_URL changing per deployment.
 */
function getImageBaseUrl(): string {
  return "";
}

/**
 * Generate a single image using OpenRouter (or direct OpenAI) and store in database
 * @param params - Prompt, blogId, and optional imageModel for OpenRouter routing
 * @returns Object with imageId of the stored image
 */
export async function generateAndStoreImage(params: {
  prompt: string;
  blogId: number;
  altText?: string;
  position?: number;
  imageModel?: string;
}): Promise<{ imageId: number; imageUrl: string }> {
  const selectedModel = params.imageModel || "dall-e-3";

  console.log(`Generating image with model: ${selectedModel} for prompt: "${params.prompt.slice(0, 100)}..."`);

  try {
    let imageData: string | undefined;

    if (process.env.OPENROUTER_API_KEY && selectedModel !== "dall-e-3") {
      // Use OpenRouter AI Gateway for image generation
      try {
        const client = getOpenRouterClient();
        const response = await client.images.generate({
          model: selectedModel,
          prompt: params.prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        });
        imageData = response.data?.[0]?.b64_json ?? undefined;
      } catch (openRouterError: any) {
        console.warn(`OpenRouter image gen failed for ${selectedModel}, falling back to OpenAI DALL-E:`, openRouterError?.message);
        // Fallback to direct OpenAI
        if (!process.env.OPENAI_API_KEY) {
          throw new Error(`Image generation failed: No fallback API key available`);
        }
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: params.prompt,
          n: 1,
          size: "1792x1024",
          quality: "standard",
          style: "natural",
          response_format: "b64_json",
        });
        imageData = response.data?.[0]?.b64_json ?? undefined;
      }
    } else {
      // Direct OpenAI for DALL-E models
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: params.prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        style: "natural",
        response_format: "b64_json",
      });
      imageData = response.data?.[0]?.b64_json ?? undefined;
    }

    if (!imageData) {
      throw new Error("AI returned no image data");
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
        width: selectedModel.includes("dall-e") ? 1792 : 1024,
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

    console.log(`Successfully generated and stored image in DB with ID: ${savedImage.id} (model: ${selectedModel})`);

    return { imageId: savedImage.id, imageUrl };
  } catch (error) {
    console.error(`Image generation failed (model: ${selectedModel}):`, error);
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
