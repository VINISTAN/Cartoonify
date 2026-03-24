/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Sparkles, RefreshCw, Download, Image as ImageIcon, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [cartoonImage, setCartoonImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('3D Animated');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = [
    { id: '3D Animated', label: '3D Animated', icon: '✨' },
    { id: 'Classic Cartoon', label: 'Classic', icon: '🎨' },
    { id: 'Anime', label: 'Anime', icon: '🎌' },
    { id: 'Sketch', label: 'Sketch', icon: '✏️' },
  ];

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setCartoonImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const cartoonify = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    setError(null);

    const stylePrompts: Record<string, string> = {
      '3D Animated': 'Transform this entire image into a high-quality, vibrant 3D cartoon style, similar to modern animated movies. Convert all elements including the person, clothing, and background into a stylized animated scene while maintaining the original composition and recognizable features.',
      'Classic Cartoon': 'Transform this entire image into a classic 2D hand-drawn cartoon style, with bold outlines and vibrant flat colors. Make it look like a vintage Saturday morning cartoon while keeping the original composition recognizable.',
      'Anime': 'Transform this entire image into a high-quality modern anime style. Use characteristic anime shading, expressive features, and detailed backgrounds. Maintain the original composition and recognizable features of the person.',
      'Sketch': 'Transform this entire image into a detailed artistic pencil sketch. Use cross-hatching, varied line weights, and realistic textures. The result should look like a professional hand-drawn graphite illustration of the original scene.'
    };

    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(';')[0].split(':')[1];

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: stylePrompts[selectedStyle] || stylePrompts['3D Animated'],
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const resultImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setCartoonImage(resultImageUrl);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("AI did not return an image. Please try again.");
      }
    } catch (err) {
      console.error("Error cartoonifying image:", err);
      setError("Failed to transform image. Please try a different photo or try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setSourceImage(null);
    setCartoonImage(null);
    setError(null);
  };

  const downloadImage = () => {
    if (!cartoonImage) return;
    const link = document.createElement('a');
    link.href = cartoonImage;
    link.download = 'cartoon-face.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Cartoonify Me
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              Transform your entire photo into a stunning animated scene using advanced AI.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Source Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#141414] border border-white/10 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
                {sourceImage ? (
                  <img
                    src={sourceImage}
                    alt="Original"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-12 text-center cursor-pointer hover:bg-white/5 transition-colors w-full h-full"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Upload className="text-purple-400" size={32} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload Photo</h3>
                    <p className="text-gray-500 text-sm">Click to browse or drag and drop</p>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {sourceImage && !cartoonImage && !isProcessing && (
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                        selectedStyle === style.id
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl">{style.icon}</span>
                      <span className="font-medium">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {sourceImage && !cartoonImage && !isProcessing && (
                <button
                  onClick={cartoonify}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <Sparkles size={20} />
                  Generate {selectedStyle}
                </button>
              )}
              {sourceImage && (
                <button
                  onClick={reset}
                  disabled={isProcessing}
                  className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={20} className={isProcessing ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Result Image Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#141414] border border-white/10 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse" size={24} />
                      </div>
                      <p className="text-purple-400 font-medium animate-pulse">AI is drawing...</p>
                    </motion.div>
                  ) : cartoonImage ? (
                    <motion.img
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={cartoonImage}
                      alt="Cartoonified"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-600">
                      <User size={48} className="mb-4 opacity-20" />
                      <p>Your cartoon will appear here</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {cartoonImage && (
              <button
                onClick={downloadImage}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={20} />
                Download Result
              </button>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </motion.div>
        </div>

        {/* Features Section */}
        <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Sparkles className="text-purple-400" />,
              title: "AI Powered",
              desc: "Uses state-of-the-art Gemini 2.5 Flash Image models for high-quality transformations."
            },
            {
              icon: <ImageIcon className="text-blue-400" />,
              title: "Full Scene Stylization",
              desc: "Intelligently transforms people, clothing, and backgrounds into a cohesive animated world."
            },
            {
              icon: <RefreshCw className="text-pink-400" />,
              title: "Instant Results",
              desc: "Get your animated avatar in seconds with our optimized processing pipeline."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-colors"
            >
              <div className="mb-4">{feature.icon}</div>
              <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 py-12 text-center text-gray-600 text-sm border-t border-white/5">
        <p>© 2026 Cartoonify Me AI • Powered by Google Gemini</p>
      </footer>
    </div>
  );
}
