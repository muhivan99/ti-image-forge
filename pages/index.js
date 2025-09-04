"use client";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");   // ✅ ini wajib ada
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [guidance, setGuidance] = useState(7.5);
  const [steps, setSteps] = useState(30);

async function generateImage() {
  setLoading(true);
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, width, height, guidance, steps })
  });
  const data = await res.json();
  setImage(data.image);
  setLoading(false);
}

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-indigo-950 to-purple-950 text-white p-8">
      <h1 className="text-5xl font-extrabold mb-6 neon-text">TI Image Forge</h1>
      <p className="mb-8 text-lg text-gray-300">
        Ubah kata menjadi gambar dengan AI ✨
      </p>

      <div className="flex gap-2 mb-6">
        <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Contoh: robot pakai jaket almamater"
        className="w-80 p-3 rounded-lg border border-purple-500 bg-black text-white"
        />
        <button
          onClick={generateImage}
          disabled={loading}
          className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition neon-button"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {image && (
        <div className="mt-6">
          <img
            src={image}
            alt="Generated"
            className="rounded-xl shadow-2xl border-4 border-purple-500 neon-card"
          />
          <a
            href={image}
            download="generated.png"
            className="block mt-4 text-purple-400 hover:underline"
          >
            Download Gambar
          </a>
        </div>
      )}
    </div>
  );
}
