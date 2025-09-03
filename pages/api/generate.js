export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          width: 512,
          height: 512,
          samples: 1
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stability API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json({ image: data.artifacts[0].base64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate image" });
  }
}