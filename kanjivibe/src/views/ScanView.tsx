import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { JLPTLevel } from '../hooks/useGame';

interface ScanViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' | 'error' ) => void;
  jlptLevel: JLPTLevel;
  game: any;
  // Fungsi penangkap error yang dilempar dari App.tsx
  onError?: (msg: string, type: 'offline' | 'api_limit' | 'unknown') => void;
}

export function ScanView({ setView, jlptLevel, game, onError }: ScanViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState('0x000000');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isScanning) return;
    
    const interval = setInterval(() => {
      const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      setTelemetry(`0x${hex}`);
    }, 250);

    return () => clearInterval(interval);
  }, [isScanning]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setIsScanning(true);

    reader.onload = async (rv) => {
      const base64 = rv.target?.result as string;
      setPreviewImage(base64);

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, level: jlptLevel })
        });

        // Deteksi Error HTTP Status
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("API_LIMIT");
          } else {
            throw new Error(`Server error: ${res.status}`);
          }
        }

        const data = await res.json();

        if (data && data.questions) {
          setView('game');
          game.startGame(
            data.questions, 
            data.bossImageBase64 ? `data:image/jpeg;base64,${data.bossImageBase64}` : null
          );
        } else {
          throw new Error("Data tidak valid atau kosong dari AI.");
        }

      } catch (error: any) {
        console.error("Scan failed:", error);
        
        // Lempar error ke Global Error View di App.tsx
        if (error.message === "API_LIMIT") {
          if (onError) onError("Quota AI Gemini telah habis. Harap tunggu beberapa saat untuk scan gambar lagi.", 'api_limit');
        } else if (!navigator.onLine || error.message.includes('Failed to fetch')) {
          if (onError) onError("Gagal mengunggah gambar. Pastikan koneksi internet stabil.", 'offline');
        } else {
          if (onError) onError(`Gagal memproses gambar: ${error.message}`, 'unknown');
        }
      } finally {
        setIsScanning(false);
        setPreviewImage(null);
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      if (onError) onError("Gagal membaca file gambar dari perangkat Anda.", 'unknown');
      setIsScanning(false);
      setPreviewImage(null);
      e.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-4 sm:p-6"
    >
      <header className="flex items-center gap-4 mb-4 sm:mb-6 relative z-10 shrink-0">
        <button onClick={() => setView('dashboard')} className="p-2 glass-card hover:bg-white/10 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest font-arcade text-yellow-500">Boss Scanner</h2>
      </header>

      <div className="glass-card min-h-[50dvh] sm:min-h-0 sm:aspect-video relative flex flex-col items-center justify-center p-6 sm:p-8 overflow-hidden">
        
        {isScanning && (
          <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-4 text-center">
            
            {previewImage && (
              <img
                src={previewImage}
                alt="Scanning..."
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter brightness-50 contrast-125 saturate-150 grayscale-0 blur-[1px] pointer-events-none"
              />
            )}

            <div 
              className="absolute inset-0 pointer-events-none opacity-20 z-21"
              style={{
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
                backgroundSize: '100% 4px'
              }}
            />

            <motion.div
              initial={{ y: '-5%' }}
              animate={{ y: '105%' }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2.2,
                ease: "easeInOut"
              }}
              className="absolute left-0 right-0 h-1 bg-yellow-500 shadow-[0_0_15px_#eab308,0_0_30px_#eab308] z-22"
            />

            <div className="absolute top-4 left-4 text-left font-mono text-[9px] sm:text-[11px] text-yellow-500/80 tracking-wider z-22 select-none">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping mr-2" />
              <span className="text-red-500 font-bold mr-1">SYS:</span> CAPTURING
              <br />
              <span className="text-gray-400">DATA_FLOW:</span> {telemetry}
            </div>

            <div className="absolute top-4 right-4 text-right font-mono text-[9px] sm:text-[11px] text-yellow-500/80 tracking-wider z-22 select-none">
              <span>TARGET_LEVEL:</span> {jlptLevel}
              <br />
              <span className="text-cyan-400 font-bold">MATRIX:</span> STABLE
            </div>

            <div className="absolute bottom-4 left-4 text-left font-mono text-[9px] sm:text-[10px] text-gray-500 tracking-wider z-22 select-none hidden sm:block">
              <span>CH_BAUD: 9600 // PORT: A3</span>
              <br />
              <span>OCR RECOGNITION ACTIVE</span>
            </div>

            <div className="relative z-23 flex flex-col items-center justify-center bg-black/75 p-6 sm:p-8 rounded-xl border border-yellow-500/30 backdrop-blur-md max-w-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
              <p className="font-arcade text-yellow-500 text-xs sm:text-sm tracking-widest animate-pulse">
                DECRYPTING KANJI...
              </p>
              <p className="font-mono text-gray-500 text-[10px] mt-2 uppercase tracking-wide">
                Configuring Boss Battle Vector
              </p>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 border-2 border-yellow-500/50 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-l-2 border-yellow-500 absolute top-2 left-2 sm:top-4 sm:left-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-r-2 border-yellow-500 absolute top-2 right-2 sm:top-4 sm:right-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-l-2 border-yellow-500 absolute bottom-2 left-2 sm:bottom-4 sm:left-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-r-2 border-yellow-500 absolute bottom-2 right-2 sm:bottom-4 sm:right-4" />
        </div>

        <div className="flex gap-4 mb-4 relative z-10">
          <Camera 
            onClick={() => cameraInputRef.current?.click()}
            className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 opacity-60 cursor-pointer hover:opacity-100 transition-opacity" 
          />
          <ImageIcon 
            onClick={() => galleryInputRef.current?.click()}
            className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 opacity-60 cursor-pointer hover:opacity-100 transition-opacity" 
          />
        </div>
        
        <p className="text-center text-gray-400 mb-6 relative z-10 text-sm sm:text-base max-w-[90%]">
          Capture Japanese text using your camera or choose an image from your gallery to generate a boss battle.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center relative z-10 px-4">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            disabled={isScanning}
            className={cn(
              "cursor-pointer bg-yellow-500 text-black font-arcade px-6 py-3 text-xs sm:text-sm rounded hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 flex-1 shadow-[0_4px_10px_rgba(234,179,8,0.2)]",
              isScanning && "opacity-50 pointer-events-none"
            )}
          >
            <Camera className="w-4 h-4" />
            {isScanning ? 'SCANNING...' : 'TAKE PHOTO'}
          </button>

          <button 
            onClick={() => galleryInputRef.current?.click()}
            disabled={isScanning}
            className={cn(
              "cursor-pointer bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-arcade px-6 py-3 text-xs sm:text-sm rounded transition-all flex items-center justify-center gap-2 flex-1",
              isScanning && "opacity-50 pointer-events-none"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            {isScanning ? 'SCANNING...' : 'FROM GALLERY'}
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment" 
          className="hidden"
          disabled={isScanning}
          onChange={handleFileChange}
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isScanning}
          onChange={handleFileChange}
        />
      </div>
    </motion.div>
  );
}