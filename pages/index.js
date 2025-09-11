// pages/index.js
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');
    setImages([]); 
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
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
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (data.success) {
        setImages(data.images);
        setTimeout(() => setProgress(0), 500);
      } else {
        setError(data.message || 'Failed to generate images');
        setProgress(0);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Network error. Please try again.');
      clearInterval(progressInterval);
      setProgress(0);
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-950 to-purple-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(147,51,234,0.1)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] opacity-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent neon-text">
            TI Image Forge
          </h1>
          <p className="text-xl text-gray-300 tracking-wide">
            Ubah kata menjadi gambar dengan AI ✨
          </p>
          <div className="mt-2 text-sm text-purple-400 opacity-75">
            Powered by Advanced AI Technology
          </div>
        </div>
        
        {/* Input Section */}
        <div className="w-full max-w-2xl mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Deskripsikan gambar impian anda..."
                className="flex-1 px-6 py-4 rounded-lg border border-purple-500/50 bg-black/80 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 backdrop-blur-xl transition-all duration-300 focus:shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                disabled={loading}
              />
              <button
                onClick={generateImages}
                disabled={loading || !prompt.trim()}
                className={`px-8 py-4 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 ${
                  loading || !prompt.trim()
                    ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 neon-button cursor-pointer active:scale-95'
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Generate
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          {loading && progress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300 glow-animation"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-purple-400 text-sm mt-2">
                Processing... {progress}%
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 backdrop-blur-xl animate-shake max-w-2xl w-full">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Generated Images */}
        {images.length > 0 && (
          <div className="mt-8 w-full max-w-5xl animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Generated Masterpieces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {images.map((img, idx) => (
                <div key={idx} className="relative group animate-scale-in" style={{ animationDelay: `${idx * 0.2}s` }}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative">
                    <img 
                      src={img.data} 
                      alt={`Generated ${idx + 1}`}
                      className="w-full rounded-xl shadow-2xl border-2 border-purple-500/50 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                        <span className="text-white font-semibold">Image {idx + 1}</span>
                        <a
                          href={img.data}
                          download={`ti-forge-${Date.now()}-${idx + 1}.png`}
                          className="px-4 py-2 bg-purple-600/90 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="absolute bottom-4 text-center text-gray-500 text-sm">
          <p>© 2024 TI Image Forge • Futuristic AI Generation</p>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .glow-animation {
          box-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
