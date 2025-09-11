// pages/api/generate-image.js
import { GoogleGenerativeAI } from "@google/generative-ai";

let aiClient = null;

const getAIClient = (apiKey) => {
  if (!aiClient) {
    aiClient = new GoogleGenerativeAI(apiKey || process.env.GOOGLE_AI_API_KEY);
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
    
    const genAI = getAIClient(GOOGLE_AI_API_KEY);
    
    try {
      // Menggunakan Imagen 3 melalui Vertex AI atau model yang tersedia
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash" // Sementara gunakan Gemini karena Imagen 3 memerlukan Vertex AI
      });
      
      // Generate text description untuk gambar (sementara)
      // Catatan: Google Generative AI SDK belum mendukung Imagen 3 langsung
      // Untuk production, gunakan Vertex AI SDK
      
      const result = await model.generateContent([
        `Create a detailed description for an image with this prompt: "${prompt}". 
         Describe it as if it were a generated image.
         Format: Return a base64 placeholder or description.`
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      // Untuk sementara, return placeholder image atau gunakan service lain
      // Karena Imagen 3 memerlukan Vertex AI setup yang berbeda
      
      // Placeholder response
      const images = [];
      for (let i = 0; i < imageCount; i++) {
        // Create a simple placeholder using canvas (server-side tidak support)
        // Untuk production, integrasikan dengan Vertex AI atau service lain
        images.push({
          data: `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
              <rect width="512" height="512" fill="#1a1a2e"/>
              <text x="50%" y="45%" font-family="Arial" font-size="20" fill="#9333ea" text-anchor="middle">
                AI Generated Image
              </text>
              <text x="50%" y="55%" font-family="Arial" font-size="14" fill="#a855f7" text-anchor="middle">
                "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"
              </text>
              <text x="50%" y="65%" font-family="Arial" font-size="12" fill="#6b21a8" text-anchor="middle">
                (Placeholder - Setup Vertex AI for real images)
              </text>
            </svg>
          `).toString('base64')}`,
          format: "svg",
          note: "This is a placeholder. For actual image generation, use Vertex AI with Imagen 3"
        });
      }
      
      return res.status(200).json({
        success: true,
        model: "placeholder",
        prompt: prompt.trim(),
        numberOfImages: images.length,
        aspectRatio: aspectRatio,
        images: images,
        metadata: {
          timestamp: new Date().toISOString(),
          note: "Currently using placeholder. Integrate with Vertex AI for actual Imagen 3 support"
        }
      });
      
    } catch (modelError) {
      console.error("Model error:", modelError);
      throw new Error(`Generation failed: ${modelError.message}`);
    }
    
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
