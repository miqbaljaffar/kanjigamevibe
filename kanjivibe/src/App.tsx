import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sakura } from './components/Sakura';
import { useGame, GameMode, Difficulty, JLPTLevel } from './hooks/useGame';
// Import Icon untuk Music Player
import { Play, Pause, Disc3 } from 'lucide-react';

// Import views
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GameUIView } from './views/GameUIView';
import { ChatRoomView } from './views/ChatRoomView';
import { ScanView } from './views/ScanView';

export default function App() {
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
  
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>(() => {
    return (localStorage.getItem('neon_jlpt_level') as JLPTLevel) || 'N5';
  });
  const [showLevelSelect, setShowLevelSelect] = useState(!localStorage.getItem('neon_jlpt_level'));
  
  const [mode, setMode] = useState<GameMode>('kanji-meaning');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const game = useGame(mode, difficulty, jlptLevel);
  const statsUpdateRef = useRef(false);

  // --- MUSIC PLAYER STATE & REF ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Ref ini untuk melacak apakah user dengan sengaja mem-pause musik
  const isUserPaused = useRef(false);

  // Fungsi toggle Play/Pause Music
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        isUserPaused.current = true; // Tandai bahwa user mem-pause manual
      } else {
        audioRef.current.play().catch(e => console.log("Play failed:", e));
        isUserPaused.current = false; // User menyalakan kembali
      }
    }
  };

  // Effect untuk mengontrol musik berdasarkan view
  useEffect(() => {
    if (audioRef.current) {
      if (view === 'chat') {
        // Otomatis pause di fitur Sacho Chat
        audioRef.current.pause();
      } else if (!isUserPaused.current) {
        // HANYA auto-play/resume jika user TIDAK pernah mem-pause secara manual
        audioRef.current.play().catch(e => console.log("Auto-play prevented by browser:", e));
      }
    }
  }, [view]);

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

  const handleStartApp = () => {
    setShowLanding(false);
    if (audioRef.current && !isUserPaused.current) {
        audioRef.current.play().catch(e => console.log("Play failed after click:", e));
    }
  }

  return (
    <div className="min-h-screen relative">
      <Sakura />

      {/* Tambahkan event listener onPlay dan onPause di elemen audio
        agar state isPlaying selalu sinkron dengan kondisi asli audionya 
      */}
      <audio 
        ref={audioRef} 
        src="/bgm.mp3" 
        loop 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {showLanding ? (
            <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
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

      {/* --- SPOTIFY-LIKE MINI MUSIC PLAYER CARD (DRAGGABLE) --- */}
      {!showLanding && (
        <motion.div 
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 glass-card neon-border p-2 sm:p-3 flex items-center gap-3 rounded-2xl shadow-[0_0_15px_rgba(255,0,255,0.2)] cursor-grab active:cursor-grabbing backdrop-blur-md bg-black/40"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          
          /* Tambahan props untuk fitur Drag/Geser */
          drag
          dragMomentum={false} // Membuatnya langsung berhenti saat dilepas (tidak meluncur)
          whileDrag={{ scale: 1.05, opacity: 0.9 }} // Efek visual saat sedang ditarik
          
          onClick={toggleMusic}
        >
          {/* Icon/Album Art (Piringan Hitam Berputar jika musik nyala) */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-linear-to-br from-pink-500/20 to-cyan-500/20 overflow-hidden relative pointer-events-none">
            <motion.div 
              animate={{ rotate: isPlaying ? 360 : 0 }} 
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            >
              <Disc3 className="text-pink-400" size={26} />
            </motion.div>
          </div>

          {/* Track Info (Otomatis Sembunyi di Mobile "hidden sm:flex") */}
          <div className="hidden sm:flex flex-col mr-2 min-w-30 pointer-events-none">
            <p className="text-sm font-bold text-white leading-tight">Neon JLPT Theme</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-pink-400">{isPlaying ? 'Now Playing' : 'Paused'}</p>
              {/* Animasi Equalizer (Hanya muncul jika isPlaying true) */}
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-3">
                  <motion.span animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-pink-400 rounded-t" />
                  <motion.span animate={{ height: ['70%', '30%', '70%'] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-pink-400 rounded-t" />
                  <motion.span animate={{ height: ['30%', '90%', '30%'] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-1 bg-pink-400 rounded-t" />
                </div>
              )}
            </div>
          </div>

          {/* Tombol Play/Pause */}
          <button 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-auto border border-white/10 group z-10"
            onClick={(e) => {
              e.stopPropagation(); // Mencegah trigger click ganda dengan container
              toggleMusic();
            }}
          >
            {isPlaying ? (
              <Pause size={18} className="text-white fill-white group-hover:text-pink-400 group-hover:fill-pink-400 transition-colors" />
            ) : (
              <Play size={18} className="text-white fill-white ml-1 group-hover:text-cyan-400 group-hover:fill-cyan-400 transition-colors" />
            )}
          </button>
        </motion.div>
      )}

      {/* Retro Grid Floor Effect */}
      <div className="fixed bottom-0 left-0 w-full h-[30vh] bg-linear-to-t from-pink-500/10 to-transparent pointer-events-none opacity-50 z-0"
        style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,0,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,255,0.1) 1px, transparent 1px)' }} />
    </div>
  );
}