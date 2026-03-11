import { db } from "@/db";
import { blogImages } from "@/db/schema";
import { getOpenRouterClient } from "@/lib/openrouter";
import sharp from "sharp";

/**
 * Check if image generation is configured (needs OpenRouter)
 */
export function isExternalBackendConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
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
 * Keep prompts SHORT. AI image models only read the first ~50-75 tokens.
 * Long prompts get ignored. Negative instructions ("NO text") often backfire.
 * The key: lead with "Photograph", keep it under 60 words, be specific about the scene.
 */
function shortenPromptForModel(model: string, prompt: string): string {
  // Prompt is already short from the route — just add a tiny model-specific prefix
  const m = model.toLowerCase();

  if (m.includes('gpt')) {
    // GPT image models handle detailed prompts well
    return prompt;
  }

  // Gemini, and all others — just ensure "Photograph" is first word
  if (!prompt.toLowerCase().startsWith('photograph')) {
    return `Photograph. ${prompt}`;
  }
  return prompt;
}

/**
 * These multimodal models generate images via chat completions.
 * No explicit size parameter — the model decides image dimensions.
 */

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
  const selectedModel = params.imageModel || "google/gemini-2.5-flash-image";

  // Apply model-specific prompt adjustments (keep it short!)
  const adjustedPrompt = shortenPromptForModel(selectedModel, params.prompt);

  console.log(`[IMAGE] Model: ${selectedModel}`);
  console.log(`[IMAGE] Prompt (${adjustedPrompt.length} chars): "${adjustedPrompt.slice(0, 200)}..."`);

  try {
    let imageData: string | undefined;
    let imageWidth = 1024;
    let imageHeight = 1024;
    let contentType = "image/png";

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // Use OpenRouter chat completions API for image generation
    // Modern image models (GPT-5-image, Gemini-image) use chat format
    const client = getOpenRouterClient();
    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "user",
          content: `Generate an image: ${adjustedPrompt}`,
        },
      ],
      max_tokens: 4096,
    });

    // Extract image from response.choices[0].message.images
    const message = response.choices?.[0]?.message as any;
    const images = message?.images;

    if (images && images.length > 0) {
      const imageUrl = images[0]?.image_url?.url;
      if (imageUrl && imageUrl.startsWith("data:")) {
        // Parse data URL: data:image/png;base64,iVBORw0...
        const dataUrlMatch = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (dataUrlMatch) {
          contentType = dataUrlMatch[1];
          imageData = dataUrlMatch[2];
        }
      }
    }

    // Fallback: check content array for inline image parts
    if (!imageData && Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url?.startsWith("data:")) {
          const dataUrlMatch = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
          if (dataUrlMatch) {
            contentType = dataUrlMatch[1];
            imageData = dataUrlMatch[2];
            break;
          }
        }
      }
    }

    if (!imageData) {
      console.error(`[IMAGE] No image data in response. Message keys: ${Object.keys(message || {}).join(', ')}`);
      throw new Error("AI returned no image data");
    }

    console.log(`[IMAGE] Got image: ${contentType}, ${imageData.length} base64 chars`);

    // Compress PNG → JPEG to reduce size (1.8MB PNG → ~200KB JPEG)
    // Neon serverless DB connection drops on large payloads
    try {
      const rawBuffer = Buffer.from(imageData, "base64");
      const jpegBuffer = await sharp(rawBuffer)
        .resize({ width: 1200, height: 800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer();
      imageData = jpegBuffer.toString("base64");
      contentType = "image/jpeg";
      console.log(`[IMAGE] Compressed to JPEG: ${imageData.length} base64 chars (${Math.round(jpegBuffer.length / 1024)}KB)`);
    } catch (compressErr) {
      console.warn(`[IMAGE] Compression failed, using original:`, (compressErr as Error).message);
    }

    // Store in database with retry (Neon HTTP can drop on large writes)
    const baseUrl = getImageBaseUrl();
    let savedImage: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        [savedImage] = await db
          .insert(blogImages)
          .values({
            blogId: params.blogId,
            imageUrl: "",
            imageData: imageData,
            contentType: contentType,
            imagePrompt: adjustedPrompt,
            altText: params.altText || params.prompt,
            position: params.position,
            width: imageWidth,
            height: imageHeight,
          })
          .returning();
        break;
      } catch (dbErr: any) {
        console.warn(`[IMAGE] DB insert attempt ${attempt}/3 failed:`, dbErr?.message?.slice(0, 100));
        if (attempt === 3) throw dbErr;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

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
