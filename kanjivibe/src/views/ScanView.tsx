import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { JLPTLevel } from '../hooks/useGame';

interface ScanViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' | 'leaderboard') => void;
  jlptLevel: JLPTLevel;
  game: any;
}

export function ScanView({ setView, jlptLevel, game }: ScanViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-4 sm:p-6" // Penyesuaian padding untuk mobile
    >
      <header className="flex items-center gap-4 mb-4 sm:mb-6 relative z-10">
        <button onClick={() => setView('dashboard')} className="p-2 glass-card hover:bg-white/10 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest font-arcade text-yellow-500">Boss Scanner</h2>
      </header>

      {/* Perubahan Utama: 
        1. Mengganti aspect-video menjadi min-h-[60vh] sm:aspect-video agar di HP bisa memanjang sesuai konten.
        2. Menyesuaikan padding (p-6 sm:p-8)
      */}
      <div className="glass-card min-h-[60vh] sm:aspect-video relative flex flex-col items-center justify-center p-6 sm:p-8 overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-arcade text-yellow-500 text-xs sm:text-sm">ANALYZING KANJI & GENERATING BOSS...</p>
          </div>
        )}
        
        {/* Dekorasi sudut dipertahankan tapi disesuaikan */}
        <div className="absolute inset-0 border-2 border-yellow-500/50 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-l-2 border-yellow-500 absolute top-2 left-2 sm:top-4 sm:left-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-r-2 border-yellow-500 absolute top-2 right-2 sm:top-4 sm:right-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-l-2 border-yellow-500 absolute bottom-2 left-2 sm:bottom-4 sm:left-4" />
          <div className="w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-r-2 border-yellow-500 absolute bottom-2 right-2 sm:bottom-4 sm:right-4" />
        </div>

        <Camera 
          onClick={handleButtonClick}
          className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity relative z-10" 
        />
        
        {/* Teks dibuat lebih fleksibel */}
        <p className="text-center text-gray-400 mb-6 relative z-10 text-sm sm:text-base max-w-[90%]">
          Capture Japanese text from packaging, menus, or books to generate a high-level boss fight.
        </p>

        <button 
          onClick={handleButtonClick}
          disabled={isScanning}
          className={cn(
            "cursor-pointer bg-yellow-500 text-black font-arcade px-6 py-3 sm:px-8 sm:py-3 text-sm sm:text-base rounded hover:bg-yellow-400 transition-all relative z-10 w-full max-w-xs",
            isScanning && "opacity-50 pointer-events-none"
          )}
        >
          {isScanning ? 'SCANNING...' : 'SCAN IMAGE'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment" 
          className="hidden"
          disabled={isScanning}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsScanning(true);
            const reader = new FileReader();

            reader.onload = async (rv) => {
              const base64 = rv.target?.result as string;
              try {
                const res = await fetch('/api/scan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: base64, level: jlptLevel })
                });

                if (!res.ok) {
                  throw new Error(`Server error: ${res.status}`);
                }

                const data = await res.json();

                if (data && data.questions) {
                  setView('game');
                  game.startGame(
                    data.questions, 
                    data.bossImageBase64 ? `data:image/jpeg;base64,${data.bossImageBase64}` : null
                  );
                } else {
                  throw new Error("Invalid or empty data received from the AI.");
                }

              } catch (error: any) {
                console.error("Scan failed:", error);
                alert("Failed to process image: " + error.message);
              } finally {
                setIsScanning(false);
                e.target.value = '';
              }
            };

            reader.onerror = () => {
              alert("Failed to read the image file from your device.");
              setIsScanning(false);
              e.target.value = '';
            };

            reader.readAsDataURL(file);
          }}
        />
      </div>
    </motion.div>
  );
}