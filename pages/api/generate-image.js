// pages/api/generate-image.js
import { GoogleGenAI } from "@google/genai";

const AVAILABLE_MODELS = [
  "imagen-3.0-generate-001",
  "imagen-3.0-fast-generate-001"
];

let aiClient = null;
const getAIClient = (apiKey) => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey || process.env.GOOGLE_AI_API_KEY 
    });
  }
  return aiClient;
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ 
      error: "Method not allowed",
      allowedMethods: ["POST"]
    });
  }

  try {
    const { 
      prompt, 
      numberOfImages = 1, 
      aspectRatio = "1:1",
      model = "imagen-3.0-generate-001",
      apiKey
    } = req.body || {};

    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ 
        error: "Prompt is required",
        message: "Please provide a text description for image generation"
      });
    }

    const imageCount = Math.min(Math.max(1, numberOfImages), 4);

    // Gunakan API key Anda
    const GOOGLE_AI_API_KEY = apiKey || process.env.GOOGLE_AI_API_KEY || "AIzaSyC1oxvEkt5tXA46RE2Nt6wvrDCQrb98ACw";
    
    const ai = getAIClient(GOOGLE_AI_API_KEY);

    const config = {
      numberOfImages: imageCount,
    };

    if (aspectRatio && aspectRatio !== "1:1") {
      config.aspectRatio = aspectRatio;
    }

    let lastError = null;
    const modelsToTry = [model, ...AVAILABLE_MODELS.filter(m => m !== model)];

    for (const currentModel of modelsToTry) {
      try {
        console.log(`Attempting model: ${currentModel}`);
        
        const response = await ai.models.generateImages({
          model: currentModel,
          prompt: prompt.trim(),
          config: config,
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
          const images = [];
          
          for (const generatedImage of response.generatedImages) {
            if (generatedImage.image?.imageBytes) {
              const base64Image = `data:image/png;base64,${generatedImage.image.imageBytes}`;
              
              images.push({
                data: base64Image,
                format: "png"
              });
            }
          }

          if (images.length > 0) {
            return res.status(200).json({
              success: true,
              model: currentModel,
              prompt: prompt.trim(),
              numberOfImages: images.length,
              aspectRatio: aspectRatio,
              images: images,
              metadata: {
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      } catch (error) {
        console.error(`Model ${currentModel} failed:`, error.message);
        lastError = error;
      }
    }

    throw new Error(lastError?.message || "All models failed to generate images");

  } catch (error) {
    console.error("Image generation error:", error);
    
    return res.status(500).json({
      success: false,
      error: "Failed to generate image",
      message: error.message,
      details: {
        timestamp: new Date().toISOString(),
        suggestion: "Please check your API key or try a different prompt"
      }
    });
  }
}
