import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function enhancePromptWithGemini(userPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const enhancementPrompt = `You are a world-class professional image generation prompt engineer specializing in creating photorealistic, high-quality, commercial-grade visuals for blogs, websites, and marketing materials.

**Your Task:** Transform the user's basic prompt into a detailed, professional image generation prompt that produces stunning, realistic, and visually compelling images.

**Enhancement Guidelines:**

1. **Photography Style & Quality:**
   - Specify camera type: "shot on Canon EOS R5", "Sony A7R IV", "professional DSLR"
   - Add resolution markers: "8K", "ultra HD", "high resolution", "4K detailed"
   - Include quality tags: "professional photography", "commercial quality", "magazine-worthy"

2. **Lighting (Critical for Realism):**
   - Specify lighting type: "soft natural daylight", "golden hour lighting", "studio lighting setup", "rim lighting", "soft diffused light"
   - Add lighting details: "volumetric lighting", "three-point lighting", "backlighting with lens flare"

3. **Composition & Framing:**
   - Specify shot type: "close-up", "wide-angle", "medium shot", "bird's eye view", "eye-level"
   - Add depth: "shallow depth of field", "bokeh background", "sharp focus on subject"
   - Include rule of thirds, leading lines if applicable

4. **Technical Details:**
   - Lens specifications: "85mm portrait lens", "35mm wide-angle", "macro lens"
   - Aperture hints: "f/1.8 aperture", "wide aperture bokeh"
   - Add: "sharp focus", "intricate details", "highly detailed textures"

5. **Style & Atmosphere:**
   - Color palette: "vibrant colors", "muted earth tones", "high contrast", "color-graded"
   - Mood: "professional", "modern", "clean", "sophisticated", "welcoming"
   - Environment context when relevant

6. **Negative Prompts to Avoid (implicitly guide away from):**
   - Avoid cartoonish, artificial, blurry, low-quality elements
   - Avoid oversaturated, unrealistic skin tones
   - Avoid obvious AI artifacts

**Output Format:**
- Create ONE cohesive, detailed prompt (80-120 words)
- Start with the main subject description
- Flow naturally through lighting, composition, and technical details
- End with quality/style modifiers
- DO NOT include any explanations, just the enhanced prompt
- DO NOT use bullet points or lists in the output

**User's Original Prompt:** "${userPrompt}"

**Enhanced Professional Prompt:**`;

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
  // Pollinations AI free image generation with enhanced quality settings
  // Add quality modifiers to ensure high-quality output
  const qualityEnhancedPrompt = `${prompt}, professional photography, 8K resolution, highly detailed, sharp focus, masterpiece quality`;
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
