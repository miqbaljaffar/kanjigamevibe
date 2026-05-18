import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Gamepad2,
  MessageSquare,
  Camera,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { Mascot } from '../components/Mascot';
import { JLPTLevel } from '../hooks/useGame';
import { cn } from '../lib/utils';

interface DashboardViewProps {
  userStats: any;
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan') => void;
  showLevelSelect: boolean;
  setShowLevelSelect: (show: boolean) => void;
  jlptLevel: JLPTLevel;
  handleLevelSelect: (level: JLPTLevel) => void;
  game: any;
}

export function DashboardView({
  userStats,
  setView,
  showLevelSelect,
  setShowLevelSelect,
  jlptLevel,
  handleLevelSelect,
  game
}: DashboardViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 sm:gap-4 mb-12 text-center sm:text-left">
        <div className="order-2 sm:order-1 flex items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-arcade neon-text-pink mb-2">NEON JLPT ARCADE</h1>
            <p className="text-cyan-400 font-mono tracking-widest uppercase text-[10px] sm:text-sm">THE ULTIMATE CYBER NIHONGO TRAINING</p>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col lg:flex-row gap-3 sm:gap-1 lg:gap-4 order-1 sm:order-2">
          <div className="glass-card p-2 sm:p-3 flex items-center gap-2 border-cyan-500/50">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span className="font-arcade text-[8px] sm:text-xs">{userStats?.currentStreak || 0} DAY</span>
          </div>
          <div className="glass-card p-2 sm:p-3 flex items-center gap-2 border-pink-500/50">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="font-arcade text-[8px] sm:text-xs text-nowrap">{userStats?.totalCorrect || 0} SCORE</span>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showLevelSelect ? (
          <motion.div
            key="level-select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl font-arcade mb-8 neon-text-cyan">SELECT YOUR LEVEL</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map((lv) => (
                <button
                  key={lv}
                  onClick={() => handleLevelSelect(lv)}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all font-arcade text-xl group relative overflow-hidden",
                    jlptLevel === lv
                      ? "border-cyan-500 bg-cyan-500/10 neon-text-cyan"
                      : "border-white/10 hover:border-cyan-500/50 hover:bg-white/5"
                  )}
                >
                  {lv}
                  <div className="text-[8px] mt-2 opacity-60">
                    {lv === 'N5' && 'BEGINNER'}
                    {lv === 'N4' && 'BASIC'}
                    {lv === 'N3' && 'INTERMEDIATE'}
                    {lv === 'N2' && 'ADVANCED'}
                    {lv === 'N1' && 'MASTER'}
                  </div>
                  <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Mascot Zone */}
            <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-cyan-500" />
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => setShowLevelSelect(true)}
                  className="text-[8px] font-arcade glass-card px-3 py-2 border-cyan-500/30 hover:border-cyan-500"
                >
                  LEVEL: {jlptLevel} [CHANGE]
                </button>
              </div>
              <Mascot tier={userStats?.mascotTier || 0} reaction={game.gameState === 'feedback' ? (game.lastFeedback?.correct ? 'happy' : 'sad') : 'idle'} />
              <h3 className="mt-6 text-xl font-arcade text-pink-400">NEO-NEKO</h3>
              <p className="text-gray-400 text-sm mt-2 text-center">Evolves based on your learning consistency.</p>
            </div>

            {/* Action Menu */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setView('game')}
                className="glass-card p-6 flex items-center gap-6 hover:bg-pink-500/20 transition-all group text-left"
              >
                <div className="p-4 bg-pink-500/20 rounded-xl group-hover:bg-pink-500/40 transition-colors">
                  <Gamepad2 className="w-8 h-8 text-pink-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">ARCADE QUIZ</h4>
                  <p className="text-gray-400 text-sm">Practice Kanji, Meaning, and Grammar.</p>
                </div>
                <ChevronRight className="ml-auto w-6 h-6 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => setView('chat')}
                className="glass-card p-6 flex items-center gap-6 hover:bg-cyan-500/20 transition-all group text-left"
              >
                <div className="p-4 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/40 transition-colors">
                  <MessageSquare className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">SACHO CHAT</h4>
                  <p className="text-gray-400 text-sm">Working roleplay with AI Manager.</p>
                </div>
                <ChevronRight className="ml-auto w-6 h-6 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => setView('scan')}
                className="glass-card p-6 flex items-center gap-6 hover:bg-yellow-500/20 transition-all group text-left"
              >
                <div className="p-4 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/40 transition-colors">
                  <Camera className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">REAL-WORLD SCAN</h4>
                  <p className="text-gray-400 text-sm">Turn images into custom boss fights.</p>
                </div>
                <ChevronRight className="ml-auto w-6 h-6 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}