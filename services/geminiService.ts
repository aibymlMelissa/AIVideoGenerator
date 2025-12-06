import { GoogleGenAI, Type } from '@google/genai';
import type { AspectRatio } from '../types';

const LOADING_MESSAGES = [
  "Recalling the details of your memory...",
  "Gathering the echoes of the past...",
  "Focusing on the feeling of the moment...",
  "Weaving motion into your photograph...",
  "Rendering the memory, this can take a moment...",
  "Bringing your memory to life...",
];

export async function generateVideo(
  images: { data: string; mimeType: string }[],
  prompt: string,
  aspectRatio: AspectRatio,
  setLoadingMessage: (message: string) => void
): Promise<string> {
  // IMPORTANT: Instantiate GoogleGenAI right before the call to use the latest API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare the request config
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: aspectRatio,
  };

  // If we have multiple images, use referenceImages with ASSET type
  // Otherwise, use the single image field for backward compatibility
  let operation;
  if (images.length > 1) {
    // Use reference images for multiple images (max 3)
    const referenceImages = images.map(img => ({
      image: {
        imageBytes: img.data,
        mimeType: img.mimeType,
      },
      referenceType: 'ASSET' as const,
    }));

    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        ...config,
        referenceImages: referenceImages,
      }
    });
  } else {
    // Single image - use the traditional image field
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: images[0].data,
        mimeType: images[0].mimeType,
      },
      config: config
    });
  }

  let messageIndex = 0;
  setLoadingMessage(LOADING_MESSAGES[messageIndex]);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
    
    // Update loading message
    messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
    setLoadingMessage(LOADING_MESSAGES[messageIndex]);

    try {
        const newAiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
        operation = await newAiInstance.operations.getVideosOperation({ operation: operation });
    } catch(e) {
        console.error("Polling failed:", e);
        throw e;
    }
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error('Video generation completed, but no download link was found.');
  }

  setLoadingMessage("Fetching generated video...");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
}

export async function suggestPrompts(
  image: { data: string; mimeType: string }
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = {
    inlineData: {
      data: image.data,
      mimeType: image.mimeType,
    },
  };

  const textPart = {
    text: `Analyze this photograph and suggest 3 creative, short prompts for animating it into a moving memory. The prompts should evoke a sense of nostalgia, emotion, and gentle movement, as if recalling a dream. Focus on bringing the feeling of the moment to life. Return the suggestions as a JSON object with a key "suggestions" containing an array of 3 strings. For example: {"suggestions": ["Gentle breeze rustles the leaves", "Sunlight slowly shifts across the landscape", "A soft, dreamlike focus pull"]}`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A nostalgic prompt for animating the photo."
              }
            }
          }
        },
      },
    });
    
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);

    if (result.suggestions && Array.isArray(result.suggestions)) {
        return result.suggestions.slice(0, 3); // Ensure max 3 are returned
    }
    console.warn("Received unexpected format for suggestions:", result);
    return [];
  } catch (error) {
    console.error("Error suggesting prompts:", error);
    throw new Error("Failed to generate prompt suggestions.");
  }
}