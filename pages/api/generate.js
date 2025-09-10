// Alternative models to try if imagen-3.0 doesn't work
const ALTERNATIVE_MODELS = [
  "imagen-3.0-generate-001",
  "imagen-3.0-fast-generate-001", 
  "text-to-image"
];

export default async function handlerWithAlternatives(req, res) {
  const GOOGLE_AI_API_KEY = "AIzaSyC1oxvEkt5tXA46RE2Nt6wvrDCQrb98ACw";
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, aspectRatio } = req.body || {};

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const requestBody = {
    prompt: prompt.trim(),
    ...(aspectRatio && { aspectRatio: aspectRatio || "1:1" }),
  };

  // Try different models
  for (const model of ALTERNATIVE_MODELS) {
    console.log(`Trying model: ${model}`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImage?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log(`Model ${model} response:`, response.status);

      if (response.ok) {
        const data = await response.json();
        
        if (data.generatedImages && data.generatedImages[0]?.bytesBase64Encoded) {
          return res.status(200).json({
            success: true,
            image: `data:image/png;base64,${data.generatedImages[0].bytesBase64Encoded}`,
            model: model,
            parameters: requestBody
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`Model ${model} failed:`, errorText);
      }
      
    } catch (error) {
      console.log(`Model ${model} error:`, error.message);
    }
  }

  // If all models fail, try a different API approach
  return res.status(500).json({
    error: "All models failed",
    suggestion: "Try using a different AI service or check API key permissions"
  });
}

// Fallback: Try using Google Cloud Vertex AI instead
export async function tryVertexAI(req, res) {
  // This requires Google Cloud setup, but might work better
  const PROJECT_ID = "your-project-id"; // You need to set this up
  const LOCATION = "us-central1";
  
  try {
    const response = await fetch(
      `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagegeneration:predict`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GOOGLE_AI_API_KEY}`, // This won't work, needs proper OAuth
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{
            prompt: req.body.prompt
          }],
          parameters: {
            sampleCount: 1
          }
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, data });
    } else {
      const error = await response.text();
      return res.json({ success: false, error });
    }
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
}
