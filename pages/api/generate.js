export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, width, height, guidance, steps } = req.body;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-medium",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: width || 512,
            height: height || 512,
            guidance_scale: guidance || 7.5,
            num_inference_steps: steps || 30,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    res.status(200).json({
      image: `data:image/png;base64,${base64Image}`,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
}
