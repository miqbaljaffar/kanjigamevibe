import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sakura } from './components/Sakura';
import { useGame, GameMode, Difficulty, JLPTLevel } from './hooks/useGame';
import { auth, db, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { Leaderboard } from './components/Leaderboard';

// Import views
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { GameUIView } from './views/GameUIView';
import { ChatRoomView } from './views/ChatRoomView';
import { ScanView } from './views/ScanView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState<'dashboard' | 'game' | 'chat' | 'scan' | 'leaderboard'>('dashboard');
  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [mode, setMode] = useState<GameMode>('kanji-meaning');
  const [difficulty] = useState<Difficulty>('normal');

  const game = useGame(mode, difficulty, jlptLevel);
  const statsUpdateRef = useRef(false); // Guard against double-fire

  // Auth & Stats Sync
  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docRef = doc(db, 'users', u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserStats(data);
          if (data.jlptLevel) {
            setJlptLevel(data.jlptLevel);
            setShowLevelSelect(false);
          }
        } else {
          const initial = {
            uid: u.uid,
            displayName: u.displayName || 'ANONYMOUS PLAYER',
            photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
            totalCorrect: 0,
            currentStreak: 0,
            highestStreak: 0,
            dailyStreak: 0,
            mascotTier: 0,
            xp: 0,
            jlptLevel: 'N5',
            lastActiveDate: new Date().toISOString()
          };
          await setDoc(docRef, initial);
          setUserStats(initial);
        }
      } else {
        setUser(null);
        setUserStats(null);
      }
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Update stats after game ends (with transaction for atomicity)
  useEffect(() => {
    if (game.gameState === 'ended' && user && !statsUpdateRef.current) {
      statsUpdateRef.current = true; // Prevent double-fire

      const updateStats = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);

          await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists()) return;

            const data = snap.data();

            // Calculate new values (no increment() — all integers)
            const newTotalCorrect = (data.totalCorrect || 0) + game.correctAnswers;
            const newXp = (data.xp || 0) + game.score;
            const newHighestStreak = Math.max(data.highestStreak || 0, game.streak);

            // Daily streak logic
            const today = new Date().toISOString().split('T')[0];
            const lastActive = data.lastActiveDate
              ? data.lastActiveDate.split('T')[0]
              : null;
            let newDailyStreak = data.dailyStreak || 0;

            if (lastActive === today) {
              // Already played today — keep streak
            } else {
              const yesterday = new Date(Date.now() - 86400000)
                .toISOString()
                .split('T')[0];
              if (lastActive === yesterday) {
                newDailyStreak += 1; // Consecutive day
              } else {
                newDailyStreak = 1; // Reset streak (missed a day or first play)
              }
            }

            // Evolve Mascot based on permanent stats
            let tier = data.mascotTier || 0;
            if (newHighestStreak >= 3) tier = Math.max(tier, 1);
            if (newHighestStreak >= 10) tier = Math.max(tier, 2);
            if (newHighestStreak >= 30) tier = Math.max(tier, 3);
            if (newTotalCorrect >= 100) tier = Math.max(tier, 4);

            transaction.update(docRef, {
              totalCorrect: newTotalCorrect,
              currentStreak: game.streak,
              highestStreak: newHighestStreak,
              dailyStreak: newDailyStreak,
              mascotTier: tier,
              xp: newXp,
              lastActiveDate: new Date().toISOString(),
            });
          });

          // Refresh local state after successful transaction
          const updatedSnap = await getDoc(doc(db, 'users', user.uid));
          setUserStats(updatedSnap.data());
        } catch (error) {
          console.error('Failed to save game progress:', error);
        }
      };

      updateStats();
    }

    // Reset guard when game resets to idle/playing
    if (game.gameState === 'idle' || game.gameState === 'playing') {
      statsUpdateRef.current = false;
    }
  }, [game.gameState, user]);

  const handleLevelSelect = async (level: JLPTLevel) => {
    setJlptLevel(level);
    setShowLevelSelect(false);
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { jlptLevel: level });
    }
  };

  const loginView = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto p-6 sm:p-12 glass-card text-center mt-20"
    >
      <h1 className="text-4xl font-arcade neon-text-pink mb-4">NEON JLPT ARCADE</h1>
      <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase mb-12">INSERT COIN TO PLAY</p>
      
      <button
        onClick={handleGoogleLogin}
        className="w-full bg-white text-black font-bold font-sans py-4 px-6 rounded-xl flex items-center justify-center gap-4 hover:bg-gray-200 transition-colors"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        SIGN IN WITH GOOGLE
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen relative">
      <Sakura />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {showLanding && !user ? (
            <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LandingView onStart={() => setShowLanding(false)} />
            </motion.div>
          ) : !user ? (
            <div className="pt-20">
              {loginView}
            </div>
          ) : (
            <div className="pt-20">
              {view === 'dashboard' && (
                <DashboardView
                  user={user}
                  userStats={userStats}
                  setView={setView}
                  handleLogout={handleLogout}
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
              {view === 'leaderboard' && (
                <Leaderboard onBack={() => setView('dashboard')} currentUserId={user.uid} />
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
