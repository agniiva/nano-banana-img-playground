import React, { useState, useEffect, useCallback } from 'react';
import { GeneratedImage, GenerationConfig, GenerationState } from './types';
import { checkApiKeySelection, promptApiKeySelection, generateBatchImages } from './services/geminiService';
import { NeuButton } from './components/NeuButton';
import { NeuInput, NeuTextarea } from './components/NeuInput';
import { NeuCard } from './components/NeuCard';
import { 
  Wand2, 
  Settings2, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Image as ImageIcon, 
  Loader2,
  AlertCircle,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  
  const [prompt, setPrompt] = useState<string>("");
  const [config, setConfig] = useState<GenerationConfig>({
    systemPrompt: "You are a creative artistic assistant. Generate high-quality, detailed, and visually stunning images based on the user's request. Focus on lighting, texture, and composition.",
    imageCount: 4,
    aspectRatio: "1:1"
  });

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<GenerationState>({
    isLoading: false,
    error: null,
    progress: 0
  });
  
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);

  // --- Effects ---
  useEffect(() => {
    const verifyKey = async () => {
      try {
        const hasKey = await checkApiKeySelection();
        setApiKeyReady(hasKey);
      } catch (e) {
        console.error("Error checking API key:", e);
      }
    };
    verifyKey();
  }, []);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenImage) return;

      if (e.key === 'Escape') {
        setFullscreenImage(null);
      } else if (e.key === 'ArrowRight') {
        navigateFullscreen(1);
      } else if (e.key === 'ArrowLeft') {
        navigateFullscreen(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, images]);


  // --- Handlers ---
  const handleApiKeySelection = async () => {
    try {
      await promptApiKeySelection();
      setApiKeyReady(true);
      setStatus(prev => ({ ...prev, error: null }));
    } catch (e) {
      console.error("API Key selection failed", e);
      setStatus(prev => ({ ...prev, error: "Failed to select API key. Please try again." }));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus({ isLoading: true, error: null, progress: 0 });

    try {
      if (!apiKeyReady) {
        await handleApiKeySelection();
      }

      const newImages = await generateBatchImages(
        prompt,
        config.systemPrompt,
        config.imageCount,
        config.aspectRatio,
        (completedCount) => {
          setStatus(prev => ({
            ...prev,
            progress: Math.round((completedCount / config.imageCount) * 100)
          }));
        }
      );

      setImages(prev => [...newImages, ...prev]);
      setStatus({ isLoading: false, error: null, progress: 0 });
      setPrompt(""); 
    } catch (error: any) {
      if (error.message.includes("Requested entity was not found")) {
         setApiKeyReady(false);
         setStatus({ isLoading: false, error: "API Key invalid or expired. Please re-select.", progress: 0 });
      } else {
         setStatus({ isLoading: false, error: error.message || "Generation failed", progress: 0 });
      }
    }
  };

  const toggleImageSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, selected: !img.selected } : img
    ));
  };

  const deleteSelected = () => {
    setImages(prev => prev.filter(img => !img.selected));
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.base64;
    link.download = `neogen-${img.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSelected = () => {
    const selected = images.filter(img => img.selected);
    selected.forEach((img, index) => {
      setTimeout(() => downloadImage(img), index * 200);
    });
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all images?")) {
      setImages([]);
    }
  };

  const navigateFullscreen = (direction: number) => {
    if (!fullscreenImage) return;
    const currentIndex = images.findIndex(img => img.id === fullscreenImage.id);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    setFullscreenImage(images[newIndex]);
  };

  // Helper to get tailwind aspect class
  const getAspectClass = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "aspect-video";
      case "9:16": return "aspect-[9/16]";
      case "3:4": return "aspect-[3/4]";
      case "4:3": return "aspect-[4/3]";
      case "4:5": return "aspect-[4/5]";
      case "1:1": default: return "aspect-square";
    }
  };

  // --- Render ---

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neu-base p-4">
        <NeuCard className="max-w-md w-full text-center py-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-neu-base shadow-neu-flat flex items-center justify-center text-neu-accent">
               <Wand2 size={40} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-neu-text mb-4">Welcome to NeoGen Studio</h1>
          <p className="text-gray-500 mb-8 px-4">
            To generate high-fidelity images with Gemini 3.0 Pro, you need to connect your Google Cloud Project.
          </p>
          <NeuButton onClick={handleApiKeySelection} className="w-full">
            Select API Key
          </NeuButton>
          <div className="mt-6 text-xs text-gray-400">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-neu-accent">
              View Billing Documentation
            </a>
          </div>
        </NeuCard>
      </div>
    );
  }

  const selectedCount = images.filter(i => i.selected).length;

  return (
    <div className="min-h-screen bg-neu-base text-neu-text font-sans selection:bg-neu-accent/20">
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-neu-base/90 backdrop-blur-md border-b border-gray-200/20 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neu-base shadow-neu-btn flex items-center justify-center text-neu-accent">
            <Wand2 size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-neu-text">NeoGen Studio</span>
        </div>
        <div className="text-xs font-semibold text-neu-accent bg-neu-base shadow-neu-pressed px-3 py-1 rounded-full uppercase tracking-wider">
          Gemini 3.0 Pro Image
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-4">
        
        {/* Left Panel: Configuration */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
          <NeuCard title="Configuration" className="sticky top-24 z-30">
            <div className="flex flex-col gap-6">
              
              <NeuTextarea 
                label="System Persona" 
                rows={5}
                value={config.systemPrompt}
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                placeholder="Define how the AI should behave..."
              />
              
              <div className="space-y-3">
                <label className="ml-1 text-sm font-bold text-neu-text/80 uppercase tracking-wide">
                  Batch Size: {config.imageCount}
                </label>
                <div className="h-10 px-4 bg-neu-base rounded-xl shadow-neu-pressed flex items-center">
                  <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    step="1"
                    value={config.imageCount}
                    onChange={(e) => setConfig({...config, imageCount: parseInt(e.target.value)})}
                    className="w-full h-2 bg-transparent appearance-none cursor-pointer accent-neu-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                 <label className="ml-1 text-sm font-bold text-neu-text/80 uppercase tracking-wide">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["1:1", "16:9", "9:16", "4:3", "3:4", "4:5"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setConfig({...config, aspectRatio: ratio as any})}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        config.aspectRatio === ratio 
                        ? 'bg-neu-base shadow-neu-btn-active text-neu-accent' 
                        : 'bg-neu-base shadow-neu-btn text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </NeuCard>
        </div>

        {/* Right Panel: Generation & Gallery */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
          
          {/* Input Area */}
          <NeuCard>
             <div className="flex flex-col gap-4">
               <NeuTextarea 
                 placeholder="Describe the image you want to imagine..." 
                 className="text-lg min-h-[120px]"
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleGenerate();
                   }
                 }}
               />
               <div className="flex justify-between items-center">
                 <span className="text-xs text-gray-400 pl-2">Press Enter to generate</span>
                 <NeuButton 
                   onClick={handleGenerate} 
                   disabled={status.isLoading || !prompt.trim()}
                   className="min-w-[140px]"
                 >
                   {status.isLoading ? (
                     <div className="flex items-center gap-2">
                       <Loader2 className="animate-spin" size={18} />
                       <span>{status.progress > 0 ? `${status.progress}%` : 'Thinking...'}</span>
                     </div>
                   ) : (
                     <>Generate <Wand2 size={18} /></>
                   )}
                 </NeuButton>
               </div>
               
               {status.error && (
                 <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                   <AlertCircle size={16} />
                   {status.error}
                 </div>
               )}
             </div>
          </NeuCard>

          {/* Controls for Gallery */}
          {images.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-2">
               <h2 className="text-xl font-bold text-neu-text flex items-center gap-2">
                 Gallery <span className="text-sm font-normal text-gray-400">({images.length})</span>
               </h2>
               
               <div className="flex gap-3">
                 {selectedCount > 0 && (
                   <>
                    <NeuButton onClick={downloadSelected} variant="secondary" className="px-4 py-2 text-sm">
                      <Download size={16} className="mr-2" /> Save ({selectedCount})
                    </NeuButton>
                    <NeuButton onClick={deleteSelected} variant="danger" className="px-4 py-2 text-sm">
                      <Trash2 size={16} />
                    </NeuButton>
                   </>
                 )}
                 <NeuButton onClick={clearAll} variant="secondary" className="px-4 py-2 text-sm ml-2">
                    Clear All
                 </NeuButton>
               </div>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {images.map((img) => (
              <div 
                key={img.id} 
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  getAspectClass(img.aspectRatio || "1:1")
                } ${
                  img.selected 
                    ? 'ring-4 ring-neu-accent shadow-neu-btn-active scale-[0.98]' 
                    : 'shadow-neu-flat hover:-translate-y-1'
                }`}
              >
                {/* 
                  Use w-full h-full object-cover. 
                  Because the parent container has the exact aspect ratio of the image, 
                  object-cover will not cut anything.
                */}
                <img 
                  src={img.base64} 
                  alt={img.prompt} 
                  className="w-full h-full object-cover bg-neu-base cursor-pointer"
                  loading="lazy"
                  onClick={() => setFullscreenImage(img)}
                />
                
                {/* Overlay on Hover / Selection */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-200 flex flex-col justify-end p-4 ${
                  img.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                  onClick={() => setFullscreenImage(img)}
                >
                  <p className="text-white text-xs line-clamp-2 mb-2 drop-shadow-md font-medium">
                    {img.prompt}
                  </p>
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenImage(img);
                      }}
                      className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors text-white"
                      title="Full Screen"
                    >
                      <Maximize2 size={14} />
                    </button>

                    <div 
                      onClick={(e) => toggleImageSelection(img.id, e)}
                      className={`cursor-pointer w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                      img.selected 
                        ? 'bg-neu-accent border-neu-accent text-white' 
                        : 'bg-white/10 border-white/50 hover:bg-white/20 text-transparent'
                    }`}>
                      <CheckCircle2 size={16} fill={img.selected ? "currentColor" : "none"} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && !status.isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-24 h-24 rounded-3xl bg-neu-base shadow-neu-flat mb-6 flex items-center justify-center text-neu-dark/50">
                <ImageIcon size={48} />
              </div>
              <p className="text-lg">Your canvas is empty.</p>
              <p className="text-sm opacity-60">Type a prompt above to start creating.</p>
            </div>
          )}

        </div>
      </main>

      {/* Glassmorphic Full Screen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neu-base/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setFullscreenImage(null)}></div>
          
          <div className="relative w-full h-full md:w-[95vw] md:h-[95vh] flex flex-col md:flex-row bg-neu-light/10 backdrop-blur-xl border border-white/40 shadow-2xl rounded-none md:rounded-3xl overflow-hidden ring-1 ring-white/50">
            
            {/* Close Button Mobile */}
            <button 
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm md:hidden"
            >
              <X size={24} />
            </button>

            {/* Image Container */}
            <div className="flex-1 relative flex items-center justify-center bg-black/5 p-4 md:p-8 overflow-hidden group">
               {/* Nav Buttons */}
               <button 
                 onClick={(e) => { e.stopPropagation(); navigateFullscreen(-1); }}
                 className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
               >
                 <ChevronLeft size={24} />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); navigateFullscreen(1); }}
                 className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
               >
                 <ChevronRight size={24} />
               </button>

               <img 
                 src={fullscreenImage.base64} 
                 alt={fullscreenImage.prompt}
                 className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                 onClick={(e) => e.stopPropagation()} 
               />
            </div>

            {/* Sidebar / Info Panel (Glassmorphic) */}
            <div className="w-full md:w-96 bg-neu-base/40 backdrop-blur-xl border-l border-white/30 p-6 flex flex-col justify-between shrink-0">
               <div>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-neu-text/90">Image Details</h3>
                    <button 
                      onClick={() => setFullscreenImage(null)}
                      className="p-2 -mr-2 -mt-2 text-gray-500 hover:text-gray-800 hidden md:block"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-neu-text/60 uppercase tracking-wider">Prompt</label>
                      <p className="mt-1 text-sm text-neu-text/90 leading-relaxed font-medium">
                        {fullscreenImage.prompt}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neu-text/60 uppercase tracking-wider">Aspect Ratio</label>
                      <p className="mt-1 text-sm text-neu-text/90 font-mono">
                        {fullscreenImage.aspectRatio || "1:1"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neu-text/60 uppercase tracking-wider">Created</label>
                      <p className="mt-1 text-sm text-neu-text/90">
                        {new Date(fullscreenImage.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
               </div>

               <div className="mt-8 flex flex-col gap-3">
                 <button 
                   onClick={() => downloadImage(fullscreenImage)}
                   className="w-full py-3 px-4 bg-neu-accent/90 hover:bg-neu-accent text-white rounded-xl shadow-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                 >
                   <Download size={18} /> Download High-Res
                 </button>
                 <button 
                    onClick={() => {
                       // Select image from fullscreen view
                       toggleImageSelection(fullscreenImage.id);
                       // Optional: Force update if needed, but react handles state
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border ${
                      fullscreenImage.selected 
                      ? 'bg-green-500/20 border-green-500/50 text-green-700' 
                      : 'bg-white/40 border-white/40 hover:bg-white/60 text-neu-text'
                    }`}
                 >
                   {fullscreenImage.selected ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} className="opacity-50"/>}
                   {fullscreenImage.selected ? 'Selected' : 'Select'}
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;