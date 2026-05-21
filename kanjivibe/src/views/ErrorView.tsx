import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, WifiOff, Terminal, RefreshCw } from 'lucide-react';

interface ErrorViewProps {
  errorMessage: string;
  errorType: 'offline' | 'api_limit' | 'unknown';
  onReboot: () => void;
}

export function ErrorView({ errorMessage, errorType, onReboot }: ErrorViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-4 sm:p-6 h-[85dvh] flex flex-col items-center justify-center text-center"
    >
      {/* Efek Glitch & Animasi Alert */}
      <motion.div 
        animate={{ x: [-2, 2, -2, 2, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-red-500 blur-[20px] opacity-20" />
        {errorType === 'offline' ? (
          <WifiOff className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        ) : errorType === 'api_limit' ? (
          <Terminal className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        ) : (
          <AlertTriangle className="w-24 h-24 sm:w-32 sm:h-32 text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        )}
      </motion.div>

      <h1 className="text-3xl sm:text-5xl font-arcade text-red-500 mb-4 tracking-wider uppercase">
        SYSTEM FAILURE
      </h1>
      
      <div className="glass-card bg-red-950/30 border-red-500/50 p-4 sm:p-6 mb-8 w-full">
        <p className="font-mono text-red-400 text-sm sm:text-base mb-2">ERROR_LOG_DETECTED:</p>
        <p className="font-mono text-gray-300 text-xs sm:text-sm wrap-break-word">
          {errorMessage}
        </p>
        {errorType === 'api_limit' && (
          <p className="font-mono text-yellow-500 text-[10px] sm:text-xs mt-4 animate-pulse">
            // WARNING: API QUOTA EXCEEDED OR RATE LIMITED
          </p>
        )}
      </div>

      <button
        onClick={onReboot}
        className="px-8 py-4 bg-red-600/20 text-red-500 border-2 border-red-500 font-arcade rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-3 group cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)]"
      >
        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        SYSTEM REBOOT
      </button>
    </motion.div>
  );
}