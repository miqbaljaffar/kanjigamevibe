import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Mascot } from '../components/Mascot';
import { cn } from '../lib/utils';
import { JLPTLevel, GameMode, TIMER_MAP } from '../hooks/useGame';

interface GameUIViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' | 'leaderboard') => void;
  jlptLevel: JLPTLevel;
  game: any;
  userStats: any;
  setMode: (mode: GameMode) => void;
}

export function GameUIView({
  setView,
  jlptLevel,
  game,
  userStats,
  setMode
}: GameUIViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-100px)] justify-center"
    >
      <div className="flex justify-between items-center mb-6 sm:mb-12">
        <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
        <div className="flex flex-col items-end">
          <p className="text-[10px] font-arcade text-cyan-500 mb-1">LVL: {jlptLevel}</p>
          <div className="flex gap-4 sm:gap-6">
            <div className="text-right">
              <p className="text-[8px] sm:text-xs text-gray-400 uppercase font-arcade">Score</p>
              <p className="text-lg sm:text-2xl font-arcade neon-text-cyan">{game.score}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] sm:text-xs text-gray-400 uppercase font-arcade">Streak</p>
              <p className="text-lg sm:text-2xl font-arcade neon-text-pink">x{game.streak}</p>
            </div>
          </div>
        </div>
      </div>

      {game.gameState === 'idle' && (
        <div className="glass-card p-6 sm:p-12 text-center">
          <h2 className="text-xl sm:text-3xl font-arcade mb-8">SELECT MODE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {(['kanji-meaning', 'meaning-kanji', 'hiragana-meaning', 'bunpou', 'listening'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => { 
                  setMode(m); 
                  // FIX: Explicitly pass the mode 'm' to startGame bypassing the async state delay
                  game.startGame(undefined, undefined, m); 
                }}
                className="p-3 sm:p-4 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 transition-all capitalize text-sm sm:text-base"
              >
                {m.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {game.gameState === 'loading' && (
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-arcade text-pink-400">GENERATING QUIZ...</p>
        </div>
      )}

      {game.gameState === 'playing' && game.currentQuestion && (
        <div className="flex flex-col gap-8 h-full">
          {/* Timer Bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(game.timeLeft / (TIMER_MAP[game.difficulty || 'normal'])) * 100}%` }}
              className={cn("h-full", game.timeLeft < 5 ? "bg-red-500" : "bg-cyan-500")}
            />
          </div>

          <div className="glass-card p-8 sm:p-12 text-center relative flex-grow flex flex-col justify-center min-h-[200px]">
            <h3 className="text-4xl sm:text-6xl font-bold mb-4 relative z-10">{game.currentQuestion.question}</h3>
            {game.currentQuestion.reading && <p className="text-xl sm:text-2xl text-gray-400 relative z-10">{game.currentQuestion.reading}</p>}

            {/* Boss Image or Mascot Mini */}
            {game.bossImage ? (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-[0] opacity-50 pointer-events-none overflow-hidden rounded-2xl"
                animate={
                  game.gameState === 'feedback'
                    ? game.lastFeedback?.correct
                      ? { opacity: [0.5, 0.9, 0.5], scale: [1, 1.1, 1], filter: ["brightness(1) drop-shadow(0 0 10px #00ffff)", "brightness(2) drop-shadow(0 0 30px #00ffff)", "brightness(1) drop-shadow(0 0 10px #00ffff)"] } 
                      : { x: [-10, 10, -15, 15, -5, 5, 0], filter: ["hue-rotate(0deg)", "hue-rotate(90deg) contrast(200%)", "hue-rotate(0deg)"] } 
                    : { y: [0, -10, 0], filter: ["drop-shadow(0 0 15px #ff00ff)", "drop-shadow(0 0 25px #00ffff)", "drop-shadow(0 0 15px #ff00ff)"] } 
                }
                transition={{ 
                  duration: game.gameState === 'feedback' ? 0.4 : 4, 
                  repeat: game.gameState === 'feedback' ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              >
                <img 
                  src={game.bossImage} 
                  alt="Boss" 
                  className="w-full h-full object-cover opacity-60 mix-blend-screen pixelated"
                />
              </motion.div>
            ) : (
              <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 scale-[0.3] sm:scale-50 opacity-50 pointer-events-none">
                <Mascot tier={userStats?.mascotTier || 0} reaction="idle" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {game.currentQuestion.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => game.handleAnswer(i)}
                className="glass-card p-4 sm:p-6 text-lg sm:text-xl hover:bg-pink-500/20 transition-all border-pink-500/20 hover:border-pink-500 text-left flex items-center justify-between group"
              >
                <span>{opt}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      {game.gameState === 'feedback' && (
        <div className="text-center py-10 sm:py-20 animate-in zoom-in duration-300 h-full flex flex-col justify-center px-4">
          <h2 className={cn("text-4xl sm:text-6xl font-arcade mb-4", game.lastFeedback?.correct ? "neon-text-cyan" : "text-red-500")}>
            {game.lastFeedback?.correct ? "CORRECT!" : "WRONG!"}
          </h2>
          {game.lastFeedback?.correct && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl sm:text-3xl font-arcade text-yellow-400"
            >
              +{game.lastFeedback.points} PTS
            </motion.p>
          )}
          <p className="mt-8 text-lg sm:text-xl text-gray-300 max-w-md mx-auto line-clamp-4">{game.currentQuestion?.explanation}</p>
        </div>
      )}

      {game.gameState === 'ended' && (
        <div className="glass-card p-6 sm:p-12 text-center h-full flex flex-col justify-center">
          <h2 className="text-2xl sm:text-4xl font-arcade neon-text-pink mb-6">GAME OVER</h2>
          <div className="flex justify-center gap-6 sm:gap-12 mb-8">
            <div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-arcade uppercase">Score</p>
              <p className="text-2xl sm:text-4xl font-arcade text-cyan-400">{game.score}</p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-arcade uppercase">Streak</p>
              <p className="text-2xl sm:text-4xl font-arcade text-pink-400">x{game.streak}</p>
            </div>
          </div>
          <button
            onClick={() => game.restart()}
            className="w-full p-4 bg-pink-500 text-white font-arcade text-sm sm:text-base rounded-lg hover:bg-pink-600 transition-colors"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => setView('dashboard')}
            className="w-full p-4 border border-pink-500 text-pink-500 font-arcade text-sm sm:text-base mt-4 rounded-lg hover:bg-pink-500/10"
          >
            MAIN MENU
          </button>
        </div>
      )}
    </motion.div>
  );
}