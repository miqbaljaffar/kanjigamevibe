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
        {/* Ears */}
        <path d="M40 70 L60 30 L80 60 Z" fill="#2a0030" stroke="#ff00ff" strokeWidth="4" />
        <path d="M120 60 L140 30 L160 70 Z" fill="#2a0030" stroke="#ff00ff" strokeWidth="4" />

        {/* Face */}
        <circle cx="100" cy="110" r="70" fill="#1a0020" stroke="#ff00ff" strokeWidth="4" />

        {/* Eyes */}
        <motion.g animate={isHappy ? { scaleY: 0.1 } : isSad ? { translateY: 5 } : {}}>
          <circle cx="70" cy="100" r="10" fill={isThinking ? "#ffff00" : "#00ffff"} />
          <circle cx="130" cy="100" r="10" fill={isThinking ? "#ffff00" : "#00ffff"} />
        </motion.g>

        {/* Mouth */}
        <path
          d={isHappy ? "M80 140 Q100 160 120 140" : isSad ? "M80 150 Q100 130 120 150" : "M90 145 H110"}
          fill="none" stroke="#ff00ff" strokeWidth="3"
        />

        {/* Tier 1: Collar */}
        {tier >= 1 && (
          <rect x="70" y="155" width="60" height="8" rx="4" fill="#ff00ff" />
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
