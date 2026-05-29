import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Mascot } from '../components/Mascot';
import { cn } from '../lib/utils';
import { JLPTLevel, GameMode, Difficulty, TIMER_MAP } from '../hooks/useGame';

interface GameUIViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' ) => void;
  jlptLevel: JLPTLevel;
  game: any;
  userStats: any;
  setMode: (mode: GameMode) => void;
  difficulty?: Difficulty;
  setDifficulty?: (diff: Difficulty) => void;
}

export function GameUIView({
  setView,
  jlptLevel,
  game,
  userStats,
  setMode,
  difficulty,
  setDifficulty
}: GameUIViewProps) {
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  const [showQris, setShowQris] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      // BEST PRACTICE: Gunakan min-h dinamis dan flexbox alih-alih calc() hardcode
      className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col min-h-[75dvh] justify-center relative"
    >
      {/* HEADER BAGIAN ATAS */}
      <div className="flex justify-between items-center mb-6 sm:mb-12 shrink-0">
        {/* BEST PRACTICE: Desain tombol Back diseragamkan dengan animasi geser */}
        <button 
          onClick={() => setView('dashboard')} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
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

      {/* LANGKAH 1: PILIH MODE */}
      {game.gameState === 'idle' && !pendingMode && (
        <div className="glass-card p-6 sm:p-12 text-center">
          <h2 className="text-xl sm:text-3xl font-arcade mb-8">SELECT MODE</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {(['kanji-meaning', 'meaning-kanji', 'hiragana-meaning', 'bunpou', 'listening'] as GameMode[]).map(m => (
              <button
                key={m}
                onClick={() => setPendingMode(m)}
                className="p-3 sm:p-4 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 transition-all capitalize text-sm sm:text-base cursor-pointer"
              >
                {m.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LANGKAH 2: PILIH SPEED / DIFFICULTY */}
      {game.gameState === 'idle' && pendingMode && (
        <div className="glass-card p-6 sm:p-12 text-center relative animate-in fade-in zoom-in duration-200">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            {/* BEST PRACTICE: Desain tombol Back diseragamkan dengan header utama */}
            <button 
              onClick={() => setPendingMode(null)} 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
          </div>
          
          <h2 className="text-xl sm:text-3xl font-arcade mb-8 text-cyan-400 mt-6 sm:mt-0">SELECT SPEED</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {(['easy', 'normal', 'hard', 'extreme'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => {
                  if (setDifficulty) setDifficulty(d);
                  setMode(pendingMode);
                  setTimeout(() => {
                    game.startGame(undefined, undefined, pendingMode);
                    setPendingMode(null); 
                  }, 50);
                }}
                className={cn(
                  "p-4 border rounded-lg transition-all capitalize text-sm sm:text-base font-bold cursor-pointer hover:scale-105",
                  d === 'easy' ? "border-green-500/30 hover:bg-green-500/20 text-green-400" :
                  d === 'normal' ? "border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400" :
                  d === 'hard' ? "border-orange-500/30 hover:bg-orange-500/20 text-orange-400" :
                  "border-red-500/30 hover:bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STATE: LOADING */}
      {game.gameState === 'loading' && (
        <div className="text-center py-20 grow flex flex-col justify-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-arcade text-pink-400">GENERATING QUIZ...</p>
        </div>
      )}

      {/* STATE: PLAYING */}
      {game.gameState === 'playing' && game.currentQuestion && (
        <div className="flex flex-col gap-4 sm:gap-8 grow">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden shrink-0">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(game.timeLeft / TIMER_MAP[(game.difficulty as keyof typeof TIMER_MAP) || 'normal']) * 100}%` }}
              className={cn("h-full", game.timeLeft < 5 ? "bg-red-500" : "bg-cyan-500")}
            />
          </div>

          <div className="glass-card p-6 sm:p-12 text-center relative grow flex flex-col justify-center min-h-[30dvh] overflow-hidden">
            <div className="flex-1 overflow-y-auto max-h-[30dvh] sm:max-h-[40dvh] w-full flex items-center justify-center z-10 relative">
              {/* === KODE YANG DIPERBARUI: UKURAN FONT DINAMIS === */}
              <h3 className={cn(
                "font-bold mb-4 wrap-break-words whitespace-normal w-full px-4 sm:px-8 transition-all duration-300",
                game.currentQuestion.question.length > 80 
                  ? "text-base sm:text-lg md:text-xl text-left font-sans leading-relaxed" // Untuk paragraf/teks panjang
                  : game.currentQuestion.question.length > 25
                  ? "text-2xl sm:text-3xl md:text-4xl text-center" // Untuk kalimat sedang
                  : "text-4xl sm:text-5xl md:text-6xl text-center" // Untuk 1-2 kata pendek
              )}>
                {game.currentQuestion.question}
              </h3>
            </div>

            {game.bossImage ? (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-0 opacity-50 pointer-events-none overflow-hidden rounded-2xl"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 shrink-0 pb-4">
            {game.currentQuestion.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => game.handleAnswer(i)}
                className="glass-card p-4 sm:p-6 text-base sm:text-xl hover:bg-pink-500/20 transition-all border-pink-500/20 hover:border-pink-500 text-left flex items-center justify-between group min-h-16 cursor-pointer"
              >
                <span className="wrap-break-words whitespace-normal pr-4 flex-1 leading-tight">{opt}</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STATE: FEEDBACK */}
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
          
          <div className="mt-4 sm:mt-8 max-w-md mx-auto w-full">
            {game.currentQuestion?.reading && (
              <p className="text-lg sm:text-xl text-cyan-400 mb-2 font-bold wrap-break-words whitespace-normal">
                Cara baca: {game.currentQuestion.reading}
              </p>
            )}
            <p className="text-sm sm:text-xl text-gray-300 line-clamp-6 sm:line-clamp-4 wrap-break-words whitespace-normal mb-8">
              {game.currentQuestion?.explanation}
            </p>

            <button
              onClick={() => game.nextQuestion()}
              className="w-full p-4 bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-arcade text-sm sm:text-base rounded-lg hover:bg-cyan-500/40 transition-colors cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              LANJUT (NEXT)
            </button>
          </div>
        </div>
      )}

      {/* STATE: ENDED (GAME OVER) */}
      {game.gameState === 'ended' && (
        <div className="glass-card p-6 sm:p-12 text-center grow flex flex-col justify-center relative overflow-hidden">
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
          
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                setShowQris(false);
                game.restart();
              }}
              className="w-full p-4 bg-pink-500 text-white font-arcade text-sm sm:text-base rounded-lg hover:bg-pink-600 transition-colors cursor-pointer"
            >
              PLAY AGAIN
            </button>

            <button
              onClick={() => setShowQris(true)}
              className="w-full p-4 bg-cyan-500/10 border border-cyan-500 text-cyan-400 font-arcade text-sm sm:text-base rounded-lg hover:bg-cyan-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              SUPPORT US (DONASI)
            </button>

            <button
              onClick={() => {
                setShowQris(false);
                setView('dashboard');
              }}
              className="w-full p-4 border border-pink-500 text-pink-500 font-arcade text-sm sm:text-base rounded-lg hover:bg-pink-500/10 cursor-pointer"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* MODAL QRIS DONASI - BEST PRACTICE */}
      <AnimatePresence>
        {showQris && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Overlay latar belakang gelap menutupi seluruh layar secara penuh
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              // Konten dibungkus dalam card di tengah
              className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center max-w-sm w-full shadow-[0_0_40px_rgba(6,182,212,0.15)] max-h-[90dvh] overflow-y-auto"
            >
              <h3 className="text-xl sm:text-2xl font-arcade neon-text-cyan mb-2 text-center">DUKUNG KAMI!</h3>
              <p className="text-sm text-gray-300 mb-6 font-mono text-center">
                Scan QRIS di bawah ini untuk mendukung pengembangan game. Arigatou Gozaimasu! ✨
              </p>
              
              <div className="bg-white p-3 rounded-xl mb-6 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <img 
                  src="/qris.jpeg" 
                  alt="QRIS Donasi" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-cover rounded-lg"
                />
              </div>

              <button
                onClick={() => setShowQris(false)}
                className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500 font-arcade text-sm rounded-lg hover:bg-red-500/40 transition-colors cursor-pointer"
              >
                TUTUP
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}