import React, { useState } from 'react';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-6"
    >
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('dashboard')} className="p-2 glass-card hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold uppercase tracking-widest font-arcade text-yellow-500">Boss Scanner</h2>
      </header>

      <div className="glass-card aspect-video relative flex flex-col items-center justify-center p-8 overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-arcade text-yellow-500 text-sm">ANALYZING KANJI & GENERATING BOSS...</p>
          </div>
        )}
        <div className="absolute inset-0 border-2 border-yellow-500/50 flex items-center justify-center">
          <div className="w-20 h-20 border-t-2 border-l-2 border-yellow-500 absolute top-4 left-4" />
          <div className="w-20 h-20 border-t-2 border-r-2 border-yellow-500 absolute top-4 right-4" />
          <div className="w-20 h-20 border-b-2 border-l-2 border-yellow-500 absolute bottom-4 left-4" />
          <div className="w-20 h-20 border-b-2 border-r-2 border-yellow-500 absolute bottom-4 right-4" />
        </div>

        <Camera className="w-16 h-16 text-yellow-500 mb-4 opacity-50" />
        <p className="text-center text-gray-400 mb-6">Capture Japanese text from packaging, menus, or books to generate a high-level boss fight.</p>

        <label className={cn(
          "cursor-pointer bg-yellow-500 text-black font-arcade px-8 py-3 rounded hover:bg-yellow-400 transition-all",
          isScanning && "opacity-50 pointer-events-none"
        )}>
          {isScanning ? 'SCANNING...' : 'SCAN IMAGE'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isScanning}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
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
                    const data = await res.json();
                    setView('game');
                    game.startGame(data.questions, data.bossImageBase64 ? `data:image/jpeg;base64,${data.bossImageBase64}` : null);
                  } finally {
                    setIsScanning(false);
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </div>
    </motion.div>
  );
}
