import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const checkApiKeySelection = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback for dev environments if window.aistudio isn't present, though it should be in this context
};

export const promptApiKeySelection = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
};

/**
 * Generates a single image.
 * This is used within a batch process.
 */
const generateSingleImage = async (
  prompt: string, 
  systemInstruction: string,
  aspectRatio: string
): Promise<GeneratedImage> => {
  // Always instantiate a new client to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-image-preview (Banana Pro equivalent)
  const modelId = 'gemini-3-pro-image-preview';
  
  // Combine system prompt with user prompt for better adherence in image models,
  // although we also pass it in config where supported.
  const fullPrompt = systemInstruction 
    ? `${systemInstruction}\n\nUser Request: ${prompt}`
    : prompt;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: fullPrompt }]
      },
      config: {
        // systemInstruction: systemInstruction, // Optional: some image models might not fully support this field yet, hence the prepend above
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K" // Defaulting to 1K for speed/reliability in preview
        }
      }
    });

    let base64Data = '';
    
    // Parse response for image data
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Data = part.inlineData.data;
          break; 
        }
      }
    }

    if (!base64Data) {
      throw new Error("No image data found in response");
    }

    return {
      id: generateId(),
      base64: `data:image/png;base64,${base64Data}`,
      prompt: prompt,
      timestamp: Date.now(),
      selected: false,
      aspectRatio: aspectRatio
    };

  } catch (error: any) {
    console.error("Generation error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};

/**
 * Generates multiple images in parallel (up to a limit)
 */
export const generateBatchImages = async (
  prompt: string,
  systemInstruction: string,
  count: number,
  aspectRatio: string,
  onProgress: (completed: number) => void
): Promise<GeneratedImage[]> => {
  
  const results: GeneratedImage[] = [];
  let completed = 0;

  // Create an array of promises
  const promises = Array.from({ length: count }).map(async () => {
    try {
      const img = await generateSingleImage(prompt, systemInstruction, aspectRatio);
      completed++;
      onProgress(completed);
      return img;
    } catch (e) {
      console.error("Individual image generation failed", e);
      completed++;
      onProgress(completed);
      return null;
    }
  });

  const settledResults = await Promise.all(promises);
  
  // Filter out failed requests
  settledResults.forEach(res => {
    if (res) results.push(res);
  });

  return results;
};