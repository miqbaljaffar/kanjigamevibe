import React from 'react';
import { motion } from "framer-motion";

interface MascotProps {
  tier: number; // 0 to 4
  reaction?: 'happy' | 'sad' | 'thinking' | 'idle';
}

export const Mascot: React.FC<MascotProps> = ({ tier, reaction = 'idle' }) => {
  const isHappy = reaction === 'happy';
  const isSad = reaction === 'sad';
  const isThinking = reaction === 'thinking';

  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="relative w-48 h-48"
    >
      {/* Glowing Aura (Tier 4) */}
      {tier >= 4 && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-cyan-400 rounded-full blur-3xl opacity-30"
        />
      )}

      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]">
        {/* Telinga Luar */}
        <path d="M40 70 L60 30 L80 60 Z" fill="#2a0030" stroke="#ff00ff" strokeWidth="4" strokeLinejoin="round" />
        <path d="M120 60 L140 30 L160 70 Z" fill="#2a0030" stroke="#ff00ff" strokeWidth="4" strokeLinejoin="round" />
        
        {/* Telinga Dalam */}
        <path d="M48 62 L60 40 L72 55 Z" fill="#ff00ff" opacity="0.5" />
        <path d="M128 55 L140 40 L152 62 Z" fill="#ff00ff" opacity="0.5" />

        {/* Wajah Utama */}
        <circle cx="100" cy="110" r="70" fill="#1a0020" stroke="#ff00ff" strokeWidth="4" />

        {/* Rona Pipi / Blush */}
        <ellipse cx="65" cy="115" rx="12" ry="6" fill="#ff00ff" opacity="0.4" />
        <ellipse cx="135" cy="115" rx="12" ry="6" fill="#ff00ff" opacity="0.4" />

        {/* Kumis / Whiskers */}
        <g stroke="#ff00ff" strokeWidth="2.5" opacity="0.8" strokeLinecap="round">
          <line x1="15" y1="105" x2="40" y2="110" />
          <line x1="10" y1="118" x2="40" y2="118" />
          <line x1="15" y1="131" x2="40" y2="126" />
          <line x1="185" y1="105" x2="160" y2="110" />
          <line x1="190" y1="118" x2="160" y2="118" />
          <line x1="185" y1="131" x2="160" y2="126" />
        </g>

        {/* Mata */}
        <motion.g animate={isHappy ? { scaleY: 0.1 } : isSad ? { translateY: 5 } : {}}>
          <circle cx="70" cy="100" r="12" fill={isThinking ? "#ffff00" : "#00ffff"} />
          {!isHappy && !isSad && <circle cx="74" cy="96" r="4" fill="#ffffff" opacity="0.9" />}
          <circle cx="130" cy="100" r="12" fill={isThinking ? "#ffff00" : "#00ffff"} />
          {!isHappy && !isSad && <circle cx="126" cy="96" r="4" fill="#ffffff" opacity="0.9" />}
        </motion.g>

        {/* Mulut Kucing */}
        <path
          d={isHappy 
            ? "M80 135 Q100 165 120 135" 
            : isSad 
            ? "M80 145 Q100 130 120 145" 
            : "M85 135 Q92.5 145 100 135 Q107.5 145 115 135"} 
          fill="none" stroke="#ff00ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Tier 1: Collar dengan Lonceng Emas */}
        {tier >= 1 && (
          <g>
            {/* Tali Kalung */}
            <rect x="70" y="153" width="60" height="8" rx="4" fill="#ff00ff" />
            {/* Lonceng Emas */}
            <circle cx="100" cy="165" r="8" fill="#ffd700" stroke="#b8860b" strokeWidth="2" />
            <line x1="92" y1="165" x2="108" y2="165" stroke="#b8860b" strokeWidth="1.5" />
            <circle cx="100" cy="167" r="2" fill="#b8860b" />
            <line x1="100" y1="167" x2="100" y2="173" stroke="#b8860b" strokeWidth="1.5" />
          </g>
        )}

        {/* Tier 2: Cyberpunk Glasses */}
        {tier >= 2 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x="55" y="85" width="90" height="25" rx="5" fill="rgba(0, 255, 255, 0.3)" stroke="#00ffff" strokeWidth="2" />
            <line x1="100" y1="85" x2="100" y2="110" stroke="#00ffff" strokeWidth="1" />
          </motion.g>
        )}

        {/* Tier 3: Engineer Headband */}
        {tier >= 3 && (
          <g>
            <path d="M45 65 Q100 45 155 65" fill="none" stroke="#ffffff" strokeWidth="10" />
            <text x="100" y="65" fontSize="12" fill="#ff0000" textAnchor="middle" fontWeight="bold">エンジニア</text>
          </g>
        )}
      </svg>
    </motion.div>
  );
};