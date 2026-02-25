import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "@/lib/system-prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function enhancePromptWithGemini(userPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Fetch the image enhancement system prompt from DB (falls back to default)
    const imageSystemPrompt = await getSystemPrompt("image_enhancement");
    
    const enhancementPrompt = `${imageSystemPrompt}

**User's Original Prompt:** "${userPrompt}"

**Enhanced Prompt:**`;

    const result = await model.generateContent(enhancementPrompt);
    const response = result.response;
    const enhancedPrompt = response.text().trim();
    
    return enhancedPrompt || userPrompt;
  } catch (error) {
    console.error("Error enhancing prompt with Gemini:", error);
    return userPrompt; // Fallback to original prompt
  }
}

export async function generateImageWithPollinations(prompt: string): Promise<string> {
  // Pollinations AI free image generation
  // Add minimal quality modifiers that keep the image looking like a real photo
  const qualityEnhancedPrompt = `${prompt}, clean editorial stock photography, soft natural lighting, minimal composition, professional, realistic photo`;
  const encodedPrompt = encodeURIComponent(qualityEnhancedPrompt);
  
  // Use larger dimensions and optimal settings for best quality
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1536&height=1024&seed=${Date.now()}&nologo=true&enhance=true&model=flux`;
  
  // Wait for image generation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return imageUrl;
}

export async function editImageWithGemini(imageData: string, editPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Extract base64 data
    const base64Data = imageData.split(",")[1] || imageData;
    
    // Create enhanced editing prompt
    const fullPrompt = `Analyze this image and describe how to modify it based on this instruction: "${editPrompt}". 
Provide a detailed prompt that can be used to generate a new version of this image with the requested modifications.
Be specific about what should change and what should stay the same.`;

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        },
      },
    ];

    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = result.response;
    const modificationPrompt = response.text().trim();
    
    // Generate new image with the modification prompt
    const newImageUrl = await generateImageWithPollinations(modificationPrompt);
    
    return newImageUrl;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error("Failed to edit image with AI");
  }
}
