// pages/index.js
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setImages([]); // Clear previous images
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          numberOfImages: 2,
          aspectRatio: "1:1"
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
      } else {
        setError(data.message || 'Failed to generate images');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      generateImages();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-indigo-950 to-purple-950 text-white p-8">
      <h1 className="text-5xl font-extrabold mb-6 neon-text">TI Image Forge</h1>
      <p className="mb-8 text-lg text-gray-300">
        Ubah kata menjadi gambar dengan AI ✨
      </p>
      
      <div className="flex gap-2 mb-6 w-full max-w-2xl">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Deskripsikan gambar anda..."
          className="flex-1 p-3 rounded-lg border border-purple-500 bg-black/50 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 backdrop-blur-sm"
          disabled={loading}
        />
        <button
          onClick={generateImages}
          disabled={loading || !prompt.trim()}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            loading || !prompt.trim()
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-purple-600 hover:bg-purple-700 neon-button cursor-pointer'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-300">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-6 w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Generated Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={img.data} 
                  alt={`Generated ${idx + 1}`}
                  className="w-full rounded-xl shadow-2xl border-4 border-purple-500 neon-card"
                />
                <a
                  href={img.data}
                  download={`generated-${idx + 1}.png`}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-purple-600/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-purple-700"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
