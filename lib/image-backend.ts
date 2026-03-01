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
 * Get model-specific photorealism prefix and negative prompt adjustments.
 * Different image models respond to different prompt styles.
 */
function getModelPromptAdjustments(model: string, originalPrompt: string): string {
  const m = model.toLowerCase();

  // Gemini / Imagen models — need explicit "photograph" framing, hate verbose instructions
  if (m.includes('gemini') || m.includes('imagen')) {
    return `RAW photograph, 35mm film, shot on Canon EOS R5 with 50mm f/1.4 lens. ${originalPrompt} --style raw --no illustration, 3d render, cartoon, anime, digital art, CGI, text, watermark, logo, neon, glowing, oversaturated, painting, drawing, sketch, graphic design, vector art, stock photo cliché`;
  }

  // Flux models — respond well to "RAW photo" prefix and photography terms
  if (m.includes('flux')) {
    return `RAW photo, 8k uhd, DSLR, high quality, Fujifilm XT3, realistic film grain. ${originalPrompt} Ultra-realistic, editorial magazine photograph, natural imperfections, real skin texture.`;
  }

  // Stable Diffusion / SDXL models
  if (m.includes('stable-diffusion') || m.includes('sdxl') || m.includes('stability')) {
    return `(masterpiece, best quality, photorealistic:1.4), RAW photo, 35mm photograph, shot on Nikon Z8, natural lighting. ${originalPrompt} (photorealistic:1.4), (realistic skin texture:1.2), film grain, editorial magazine photography. Negative: illustration, 3d render, cartoon, anime, digital art, CGI, text, watermark, logo, neon, oversaturated, painting, drawing`;
  }

  // Midjourney-style models
  if (m.includes('midjourney')) {
    return `${originalPrompt} --style raw --s 200 --no text, words, letters, illustration, 3d render, cartoon, neon`;
  }

  // DALL-E — already good with detailed prompts, just ensure natural style
  if (m.includes('dall-e') || m.includes('dalle')) {
    return originalPrompt;
  }

  // Recraft / Ideogram / other models — generic photorealism prefix
  if (m.includes('recraft') || m.includes('ideogram')) {
    return `Professional editorial photograph. ${originalPrompt} Style: photojournalism, real candid moment, natural lighting, no digital art, no illustration.`;
  }

  // Default fallback — add generic photorealism cues
  return `RAW photograph, professional DSLR, natural lighting, editorial style. ${originalPrompt} Photorealistic, no illustration, no 3d render, no cartoon, no text, no watermark.`;
}

/**
 * Get the optimal image size for a given model via OpenRouter.
 * Returns landscape format where supported.
 */
function getModelImageSize(model: string): string {
  const m = model.toLowerCase();
  // Models that support landscape formats
  if (m.includes('flux') || m.includes('stable-diffusion') || m.includes('sdxl') || m.includes('recraft') || m.includes('ideogram')) {
    return "1536x1024"; // 3:2 landscape
  }
  if (m.includes('imagen') || m.includes('gemini')) {
    return "1536x1024"; // 3:2 landscape
  }
  // Default — most OpenRouter image models support 1024x1024 at minimum
  return "1536x1024";
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

  // Apply model-specific prompt adjustments for photorealism
  const adjustedPrompt = getModelPromptAdjustments(selectedModel, params.prompt);

  console.log(`Generating image with model: ${selectedModel}`);
  console.log(`Original prompt (first 100): "${params.prompt.slice(0, 100)}..."`);
  console.log(`Adjusted prompt (first 150): "${adjustedPrompt.slice(0, 150)}..."`);

  try {
    let imageData: string | undefined;
    let imageWidth = 1024;
    let imageHeight = 1024;

    if (process.env.OPENROUTER_API_KEY && selectedModel !== "dall-e-3") {
      // Use OpenRouter AI Gateway for image generation
      const imageSize = getModelImageSize(selectedModel);
      const [w, h] = imageSize.split('x').map(Number);
      imageWidth = w;
      imageHeight = h;

      try {
        const client = getOpenRouterClient();
        const response = await client.images.generate({
          model: selectedModel,
          prompt: adjustedPrompt,
          n: 1,
          size: imageSize as any,
          response_format: "b64_json",
        });
        imageData = response.data?.[0]?.b64_json ?? undefined;
      } catch (openRouterError: any) {
        // If landscape fails, retry with square format
        console.warn(`OpenRouter image gen failed with ${imageSize} for ${selectedModel}, retrying with 1024x1024:`, openRouterError?.message);
        try {
          const client = getOpenRouterClient();
          const response = await client.images.generate({
            model: selectedModel,
            prompt: adjustedPrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          });
          imageData = response.data?.[0]?.b64_json ?? undefined;
          imageWidth = 1024;
          imageHeight = 1024;
        } catch (retryError: any) {
          console.warn(`OpenRouter retry also failed for ${selectedModel}, falling back to OpenAI DALL-E:`, retryError?.message);
          // Fallback to direct OpenAI
          if (!process.env.OPENAI_API_KEY) {
            throw new Error(`Image generation failed: No fallback API key available`);
          }
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: params.prompt, // Use original prompt for DALL-E fallback
            n: 1,
            size: "1792x1024",
            quality: "hd",
            style: "natural",
            response_format: "b64_json",
          });
          imageData = response.data?.[0]?.b64_json ?? undefined;
          imageWidth = 1792;
          imageHeight = 1024;
        }
      }
    } else {
      // Direct OpenAI for DALL-E models
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: adjustedPrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "natural",
        response_format: "b64_json",
      });
      imageData = response.data?.[0]?.b64_json ?? undefined;
      imageWidth = 1792;
      imageHeight = 1024;
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
        imagePrompt: adjustedPrompt,
        altText: params.altText || params.prompt,
        position: params.position,
        width: imageWidth,
        height: imageHeight,
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
