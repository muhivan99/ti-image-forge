export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Gunakan API key yang disediakan
  const GOOGLE_AI_API_KEY = "AIzaSyC1oxvEkt5tXA46RE2Nt6wvrDCQrb98ACw";

  // Destructure dan validasi request body
  const { prompt, aspectRatio, seed, negative_prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Validasi aspect ratio untuk Google AI Studio
  const validAspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];
  const finalAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

  // Build request body untuk Google AI Studio
  const requestBody = {
    prompt: prompt.trim(),
    ...(finalAspectRatio && { aspectRatio: finalAspectRatio }),
    ...(seed && typeof seed === 'number' && { seed }),
    ...(negative_prompt && { negativePrompt: negative_prompt.trim() }),
  };

  console.log("Request params:", {
    prompt: prompt.substring(0, 50) + "...",
    aspectRatio: finalAspectRatio,
    seed,
    hasNegativePrompt: !!negative_prompt
  });

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
      
      // Google AI Studio Imagen API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Handle berbagai status response
      if (response.status === 503) {
        // Service unavailable
        const errorData = await response.text();
        console.log("Service unavailable, retrying in 10 seconds...", errorData);
        
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          retryCount++;
          continue;
        } else {
          return res.status(503).json({ 
            error: "Service is currently unavailable. Please try again in a few minutes.",
            details: errorData
          });
        }
      }

      if (response.status === 429) {
        // Rate limit
        const retryAfter = response.headers.get('retry-after') || 60;
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          retryAfter: parseInt(retryAfter),
          message: "Please try again later"
        });
      }

      if (response.status === 400) {
        // Bad request - biasanya prompt issue
        const errorData = await response.json();
        console.error("Bad request:", errorData);
        return res.status(400).json({ 
          error: "Invalid request parameters",
          details: errorData.error?.message || errorData
        });
      }

      if (response.status === 401 || response.status === 403) {
        // Unauthorized/Forbidden - API key issue
        const errorData = await response.json();
        console.error("Authentication error:", errorData);
        return res.status(response.status).json({ 
          error: "Invalid API key or insufficient permissions",
          details: errorData.error?.message || "Check your Google AI API key"
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google AI API error (${response.status}):`, errorText);
        return res.status(response.status).json({ 
          error: `API request failed: ${response.status}`,
          details: errorText
        });
      }

      // Parse JSON response dari Google AI Studio
      const data = await response.json();
      console.log("Response structure:", Object.keys(data));

      // Google AI Studio mengembalikan response dengan struktur:
      // { generatedImages: [{ bytesBase64Encoded: "..." }] }
      if (!data.generatedImages || !Array.isArray(data.generatedImages) || data.generatedImages.length === 0) {
        console.error("Unexpected response structure:", data);
        return res.status(500).json({ 
          error: "Unexpected response format from Google AI",
          details: "No generated images found in response"
        });
      }

      const generatedImage = data.generatedImages[0];
      
      if (!generatedImage.bytesBase64Encoded) {
        console.error("No base64 data in response:", generatedImage);
        return res.status(500).json({ 
          error: "No image data received",
          details: "Missing base64 encoded image data"
        });
      }

      console.log("Image generated successfully with Google AI Studio");
      
      return res.status(200).json({
        success: true,
        image: `data:image/png;base64,${generatedImage.bytesBase64Encoded}`,
        parameters: {
          prompt: prompt.trim(),
          aspectRatio: finalAspectRatio,
          seed,
          negativePrompt: negative_prompt
        },
        // Include metadata jika tersedia
        ...(data.modelVersion && { modelVersion: data.modelVersion }),
        ...(generatedImage.mimeType && { mimeType: generatedImage.mimeType }),
      });

    } catch (err) {
      console.error(`Attempt ${retryCount + 1} failed:`, err.message);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error("All retry attempts failed:", err);
        return res.status(500).json({ 
          error: "Failed to generate image after multiple attempts",
          details: err.message
        });
      }
      
      // Wait sebelum retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Helper function untuk test Google AI API key
export async function testApiKey() {
  const GOOGLE_AI_API_KEY = "AIzaSyC1oxvEkt5tXA46RE2Nt6wvrDCQrb98ACw";
  
  try {
    // Test dengan model list endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_AI_API_KEY}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log("Available models:", data.models?.length || 0);
      return true;
    }
    
    console.error("API key test failed:", response.status);
    return false;
  } catch (err) {
    console.error("API key test error:", err);
    return false;
  }
}
