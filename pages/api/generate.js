import { GoogleGenAI } from "@google/genai";

// Model yang tersedia untuk Imagen
const AVAILABLE_MODELS = [
  "imagen-4.0-generate-001",
  "imagen-3.0-generate-001",
  "imagen-3.0-fast-generate-001"
];

// Configuration dengan caching untuk performa lebih baik
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
  // CORS headers jika diperlukan
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
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
    // Destructure dan validasi input
    const { 
      prompt, 
      numberOfImages = 1, 
      aspectRatio = "1:1",
      model = "imagen-4.0-generate-001",
      apiKey,
      outputFormat = "base64" // bisa "base64" atau "url"
    } = req.body || {};

    // Validasi prompt
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ 
        error: "Prompt is required",
        message: "Please provide a text description for image generation"
      });
    }

    // Validasi numberOfImages
    const imageCount = Math.min(Math.max(1, numberOfImages), 4); // Batasi 1-4 gambar

    // Gunakan API key dari request body atau environment variable
    const GOOGLE_AI_API_KEY = apiKey || process.env.GOOGLE_AI_API_KEY || "AIzaSyC1oxvEkt5tXA46RE2Nt6wvrDCQrb98ACw";
    
    if (!GOOGLE_AI_API_KEY) {
      return res.status(500).json({ 
        error: "API key not configured",
        message: "Please provide an API key or set GOOGLE_AI_API_KEY environment variable"
      });
    }

    // Initialize AI client
    const ai = getAIClient(GOOGLE_AI_API_KEY);

    // Konfigurasi untuk generasi gambar
    const config = {
      numberOfImages: imageCount,
    };

    // Tambahkan aspectRatio jika didukung oleh model
    if (aspectRatio && aspectRatio !== "1:1") {
      config.aspectRatio = aspectRatio;
    }

    let lastError = null;
    let modelUsed = model;

    // Coba model yang dipilih terlebih dahulu
    const modelsToTry = [model, ...AVAILABLE_MODELS.filter(m => m !== model)];

    for (const currentModel of modelsToTry) {
      try {
        console.log(`Attempting to generate with model: ${currentModel}`);
        
        const response = await ai.models.generateImages({
          model: currentModel,
          prompt: prompt.trim(),
          config: config,
        });

        // Proses hasil gambar
        if (response.generatedImages && response.generatedImages.length > 0) {
          const images = [];
          
          for (const generatedImage of response.generatedImages) {
            if (generatedImage.image?.imageBytes) {
              // Format base64 dengan data URI
              const base64Image = `data:image/png;base64,${generatedImage.image.imageBytes}`;
              
              images.push({
                data: outputFormat === "url" ? generatedImage.image.imageBytes : base64Image,
                format: "png",
                size: Buffer.from(generatedImage.image.imageBytes, 'base64').length
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
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - req.startTime || 0
              }
            });
          }
        }
      } catch (error) {
        console.error(`Model ${currentModel} failed:`, error.message);
        lastError = error;
        // Continue to next model
      }
    }

    // Jika semua model gagal
    throw new Error(lastError?.message || "All models failed to generate images");

  } catch (error) {
    console.error("Image generation error:", error);
    
    // Detailed error response
    return res.status(500).json({
      success: false,
      error: "Failed to generate image",
      message: error.message,
      details: {
        timestamp: new Date().toISOString(),
        suggestion: "Please check your API key permissions or try a different prompt"
      }
    });
  }
}

// Helper function untuk validasi aspect ratio
export function validateAspectRatio(ratio) {
  const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
  return validRatios.includes(ratio) ? ratio : "1:1";
}

// Alternative handler dengan streaming support (untuk Next.js 13+)
export async function POST(request) {
  const body = await request.json();
  
  // Buat mock req/res object untuk kompatibilitas
  const req = { 
    method: "POST", 
    body,
    startTime: Date.now()
  };
  
  const res = {
    status: (code) => ({
      json: (data) => new Response(JSON.stringify(data), {
        status: code,
        headers: { 'Content-Type': 'application/json' }
      })
    }),
    setHeader: () => {}
  };
  
  return handler(req, res);
}

// Export utility function untuk testing
export async function generateSingleImage(prompt, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });
    
    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return {
        success: true,
        image: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`
      };
    }
    
    return { success: false, error: "No image generated" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
