import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sakura } from './components/Sakura';
import { useGame, GameMode, Difficulty, JLPTLevel } from './hooks/useGame';

// Import views
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GameUIView } from './views/GameUIView';
import { ChatRoomView } from './views/ChatRoomView';
import { ScanView } from './views/ScanView';

export default function App() {
  // Load initial stats from local storage or set default
  const [userStats, setUserStats] = useState<any>(() => {
    const saved = localStorage.getItem('neon_jlpt_stats');
    return saved ? JSON.parse(saved) : {
      totalCorrect: 0,
      currentStreak: 0,
      highestStreak: 0,
      dailyStreak: 0,
      mascotTier: 0,
      xp: 0
    };
  });
  
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<'dashboard' | 'game' | 'chat' | 'scan'>('dashboard');
  
  // Load initial level from local storage or default to N5
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(() => {
    return (localStorage.getItem('neon_jlpt_level') as JLPTLevel) || 'N5';
  });
  const [showLevelSelect, setShowLevelSelect] = useState(!localStorage.getItem('neon_jlpt_level'));
  
  const [mode, setMode] = useState<GameMode>('kanji-meaning');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const game = useGame(mode, difficulty, jlptLevel);
  const statsUpdateRef = useRef(false); // Guard against double-fire

  // Audio Ref untuk mengontrol playback
  const audioRef = useRef<HTMLAudioElement>(null);

  // PERBAIKAN: Effect untuk mengontrol musik berdasarkan layar saat ini (view)
  useEffect(() => {
    if (audioRef.current) {
      // Musik dimatikan HANYA saat berada di fitur Sacho Chat
      if (view === 'chat') {
        audioRef.current.pause();
      } else {
        // Play musik di layar lainnya (Dashboard, Scan, Game)
        audioRef.current.play().catch(e => console.log("Auto-play prevented by browser:", e));
      }
    }
  }, [view]); // Dependency diubah menjadi 'view'

  // Update stats after game ends (Save to LocalStorage)
  useEffect(() => {
    if (game.gameState === 'ended' && !statsUpdateRef.current) {
      statsUpdateRef.current = true;

      setUserStats((prevStats: any) => {
        const newTotalCorrect = (prevStats.totalCorrect || 0) + ((game as any).correctAnswers || 0);
        const newXp = (prevStats.xp || 0) + game.score;
        const newHighestStreak = Math.max(prevStats.highestStreak || 0, game.streak);

        let tier = prevStats.mascotTier || 0;
        if (newHighestStreak >= 3) tier = Math.max(tier, 1);
        if (newHighestStreak >= 10) tier = Math.max(tier, 2);
        if (newHighestStreak >= 30) tier = Math.max(tier, 3);
        if (newTotalCorrect >= 100) tier = Math.max(tier, 4);

        const newStats = {
          ...prevStats,
          totalCorrect: newTotalCorrect,
          currentStreak: game.streak,
          highestStreak: newHighestStreak,
          mascotTier: tier,
          xp: newXp,
        };

        // Save to localStorage
        localStorage.setItem('neon_jlpt_stats', JSON.stringify(newStats));
        return newStats;
      });
    }

    if (game.gameState === 'idle' || game.gameState === 'playing') {
      statsUpdateRef.current = false;
    }
  }, [game.gameState, game]);

  const handleLevelSelect = (level: JLPTLevel) => {
    setJlptLevel(level);
    setShowLevelSelect(false);
    localStorage.setItem('neon_jlpt_level', level);
  };

  // Fungsi tambahan saat start dari landing agar audio mulai jalan
  const handleStartApp = () => {
    setShowLanding(false);
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Play failed after click:", e));
    }
  }

  return (
    <div className="min-h-screen relative">
      <Sakura />

      {/* Komponen Audio Background */}
      {/* Ubah '/bgm.mp3' dengan path file musik Anda. Pastikan file ada di folder 'public' */}
      <audio ref={audioRef} src="/bgm.mp3" loop />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {showLanding ? (
            <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Gunakan handleStartApp untuk memastikan audio ter-trigger */}
              <LandingView onStart={handleStartApp} />
            </motion.div>
          ) : (
            <div className="pt-20">
              {view === 'dashboard' && (
                <DashboardView
                  userStats={userStats}
                  setView={setView}
                  showLevelSelect={showLevelSelect}
                  setShowLevelSelect={setShowLevelSelect}
                  jlptLevel={jlptLevel}
                  handleLevelSelect={handleLevelSelect}
                  game={game}
                />
              )}
              {view === 'game' && (
                <GameUIView
                  setView={setView}
                  jlptLevel={jlptLevel}
                  game={game}
                  userStats={userStats}
                  setMode={setMode}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                />
              )}
              {view === 'chat' && (
                <ChatRoomView
                  setView={setView}
                  jlptLevel={jlptLevel}
                />
              )}
              {view === 'scan' && (
                <ScanView
                  setView={setView}
                  jlptLevel={jlptLevel}
                  game={game}
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Retro Grid Floor Effect */}
      <div className="fixed bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-pink-500/10 to-transparent pointer-events-none opacity-50 z-0"
        style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,0,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,255,0.1) 1px, transparent 1px)' }} />
    </div>
  );
}