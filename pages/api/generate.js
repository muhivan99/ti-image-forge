export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validasi API key
  if (!process.env.HF_API_KEY) {
    console.error("HF_API_KEY not found in environment variables");
    return res.status(500).json({ error: "API key not configured" });
  }

  // Destructure dan validasi request body
  const { prompt, width, height, guidance, steps, negative_prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Sanitasi dan batasi parameter
  const sanitizedParams = {
    width: Math.min(Math.max(width || 512, 256), 1024), // Min 256, Max 1024
    height: Math.min(Math.max(height || 512, 256), 1024),
    guidance_scale: Math.min(Math.max(guidance || 7.5, 1), 20), // Min 1, Max 20
    num_inference_steps: Math.min(Math.max(steps || 28, 10), 50), // Min 10, Max 50
  };

  console.log("Request params:", {
    prompt: prompt.substring(0, 50) + "...",
    ...sanitizedParams
  });

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-medium",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt.trim(),
            parameters: {
              ...sanitizedParams,
              // Tambahkan negative prompt jika ada
              ...(negative_prompt && { negative_prompt: negative_prompt.trim() }),
            },
          }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      // Handle berbagai status response
      if (response.status === 503) {
        // Model sedang loading
        const errorData = await response.text();
        console.log("Model loading, retrying in 15 seconds...", errorData);
        
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 15000));
          retryCount++;
          continue;
        } else {
          return res.status(503).json({ 
            error: "Model is currently loading. Please try again in a few minutes.",
            details: errorData
          });
        }
      }

      if (response.status === 429) {
        // Rate limit
        const retryAfter = response.headers.get('retry-after') || 60;
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          retryAfter: parseInt(retryAfter)
        });
      }

      if (response.status === 400) {
        // Bad request - biasanya prompt issue
        const errorText = await response.text();
        console.error("Bad request:", errorText);
        return res.status(400).json({ 
          error: "Invalid request parameters",
          details: errorText
        });
      }

      if (response.status === 401) {
        // Unauthorized - API key issue
        console.error("Unauthorized - check API key");
        return res.status(401).json({ 
          error: "Invalid API key" 
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HF API error (${response.status}):`, errorText);
        return res.status(response.status).json({ 
          error: `API request failed: ${response.status}`,
          details: errorText
        });
      }

      // Cek content type
      const contentType = response.headers.get('content-type');
      console.log("Response content-type:", contentType);

      if (!contentType || !contentType.includes('image')) {
        // Jika bukan image, mungkin error response dalam JSON
        const textResponse = await response.text();
        console.error("Expected image but got:", textResponse);
        return res.status(500).json({ 
          error: "Unexpected response format",
          details: textResponse
        });
      }

      // Process image response
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Empty response from API");
      }

      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      
      console.log("Image generated successfully, size:", arrayBuffer.byteLength, "bytes");
      
      return res.status(200).json({
        success: true,
        image: `data:image/png;base64,${base64Image}`,
        parameters: sanitizedParams,
        prompt: prompt.trim(),
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

// Helper function untuk test API key (optional, buat endpoint terpisah)
export async function testApiKey(apiKey) {
  try {
    const response = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}
