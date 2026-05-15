import React, { useMemo } from 'react';
import { motion } from "framer-motion";

export const Sakura: React.FC = () => {
  const petals = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      size: 10 + Math.random() * 15
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 0, rotate: 0 }}
          animate={{
            y: '110vh',
            x: `${p.x + (Math.random() * 10 - 5)}vw`,
            opacity: [0, 1, 1, 0],
            rotate: 360
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute text-pink-300 opacity-60"
          style={{ fontSize: p.size }}
        >
          🌸
        </motion.div>
      ))}
    </div>
  );
};
