export const config = {
  api: {
    bodyParser: false, // disable default body parser biar bisa pakai FormData
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", chunk => (body += chunk.toString()));
      req.on("end", () => resolve(JSON.parse(body)));
      req.on("error", reject);
    });

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("output_format", "png");
    formData.append("aspect_ratio", "1:1");

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/*", // penting
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // response berupa gambar (arrayBuffer)
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
