import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Gamepad2,
  MessageSquare,
  Camera,
  Settings,
  Flame,
  User as UserIcon,
  Volume2,
  Brain,
  ChevronRight,
  ArrowLeft,
  Mic,
  MicOff
} from 'lucide-react';
import { Mascot } from './components/Mascot';
import { Sakura } from './components/Sakura';
import { useGame, GameMode, Difficulty, TIMER_MAP, JLPTLevel } from './hooks/useGame';
import { cn } from './lib/utils';
import { auth, db, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Leaderboard } from './components/Leaderboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [view, setView] = useState<'dashboard' | 'game' | 'chat' | 'scan' | 'leaderboard'>('dashboard');
  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [mode, setMode] = useState<GameMode>('kanji-meaning');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const game = useGame(mode, difficulty, jlptLevel);

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

  // Update stats after game
  useEffect(() => {
    if (game.gameState === 'ended' && user) {
      const updateStats = async () => {
        const docRef = doc(db, 'users', user.uid);
        const newTotalCorrect = (userStats?.totalCorrect || 0) + (game.score / 100);
        const newHighestStreak = Math.max(userStats?.highestStreak || 0, game.streak);

        // Evolve Mascot based on permanent stats
        let tier = userStats?.mascotTier || 0;
        if (newHighestStreak >= 3) tier = Math.max(tier, 1);
        if (newHighestStreak >= 10) tier = Math.max(tier, 2);
        if (newHighestStreak >= 30) tier = Math.max(tier, 3);
        if (newTotalCorrect >= 100) tier = Math.max(tier, 4);

        await updateDoc(docRef, {
          totalCorrect: newTotalCorrect,
          currentStreak: game.streak,
          highestStreak: newHighestStreak,
          mascotTier: tier,
          xp: increment(game.score)
        });

        const updatedSnap = await getDoc(docRef);
        setUserStats(updatedSnap.data());
      };
      updateStats();
    }
  }, [game.gameState, user]);

  useEffect(() => {
    // Attempt to load voices early
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speakJapanese = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = 0.8; // Lower pitch for male voice
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang.includes('ja'));
    const maleVoice = jpVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Ichiro') || v.name.includes('Keita'));
    if (maleVoice) {
      utterance.voice = maleVoice;
    } else if (jpVoices.length > 0) {
      utterance.voice = jpVoices[0];
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
  };

  const handleSendMessage = async (text: string) => {
    const newMsgs = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMsgs as any);
    setIsChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, level: jlptLevel })
      });
      const data = await res.json();
      setChatMessages([...newMsgs, { role: 'assistant', content: data.content }] as any);
      speakJapanese(data.content);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLevelSelect = async (level: JLPTLevel) => {
    setJlptLevel(level);
    setShowLevelSelect(false);
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { jlptLevel: level });
    }
  };

  const dashboardView = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-6"
    >
      <header className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 sm:gap-4 mb-12 text-center sm:text-left">
        <div className="order-2 sm:order-1 flex items-center gap-4">
          <img src={user?.photoURL || ''} alt="Profile" className="w-12 h-12 rounded-full border-2 border-pink-500 hidden sm:block" />
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
          <button onClick={handleLogout} className="glass-card p-2 sm:p-3 border-red-500/50 hover:bg-red-500/20 text-[8px] sm:text-xs font-arcade text-red-400">
            LOGOUT
          </button>
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

              <button
                onClick={() => setView('leaderboard')}
                className="glass-card p-6 flex items-center gap-6 hover:bg-purple-500/20 transition-all group text-left"
              >
                <div className="p-4 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/40 transition-colors">
                  <Trophy className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">GLOBAL LEADERBOARD</h4>
                  <p className="text-gray-400 text-sm">See the top players in the Neo-Neko network.</p>
                </div>
                <ChevronRight className="ml-auto w-6 h-6 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const gameView = (
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
                onClick={() => { setMode(m); game.startGame(); }}
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
              animate={{ width: `${(game.timeLeft / (TIMER_MAP[difficulty])) * 100}%` }}
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
            {game.currentQuestion.options.map((opt, i) => (
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

  const chatView = (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto p-4 sm:p-6 h-[85vh] sm:h-[80vh] flex flex-col"
    >
      <header className="flex items-center gap-4 mb-4 sm:mb-6">
        <button onClick={() => setView('dashboard')} className="p-2 glass-card hover:bg-white/10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold">SACHO'S OFFICE</h2>
          <p className="text-[10px] sm:text-xs text-cyan-400">JFT A2 Interview Practice</p>
        </div>
      </header>

      <div className="flex-grow glass-card p-4 sm:p-6 overflow-y-auto mb-4 flex flex-col gap-4 text-sm sm:text-base">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 sm:mt-20">
            <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-20" />
            <p>Sacho is waiting for your self-introduction.</p>
            <p className="text-[10px] sm:text-xs mt-2 italic">"Konichiwa. Jiko shoukai wo onegaishimasu."</p>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={cn(
            "max-w-[90%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl",
            m.role === 'user' ? "ml-auto bg-pink-500 text-white" : "mr-auto bg-white/10"
          )}>
            {m.content}
          </div>
        ))}
        {isChatLoading && <div className="text-cyan-400 text-xs sm:text-sm animate-pulse px-2">Sacho is typing...</div>}
        
        {isSpeaking && (
          <div className="flex justify-center items-end gap-1 h-12 mt-4 mr-auto w-full p-4 rounded-2xl bg-cyan-900/20 border border-cyan-500/30">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ 
                  duration: 0.4 + Math.random() * 0.4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-1.5 sm:w-2 bg-cyan-400 rounded-t-full shadow-[0_0_8px_#00ffff]"
              />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        const input = (e.target as any).message.value;
        if (input) {
          handleSendMessage(input);
          (e.target as any).reset();
        }
      }} className="flex gap-2">
        <button 
          type="button"
          onClick={toggleRecording}
          className={cn(
            "p-3 sm:p-4 rounded-xl flex items-center justify-center transition-all border border-transparent",
            isRecording 
              ? "bg-pink-500/20 text-pink-500 border-pink-500 shadow-[0_0_15px_rgba(255,0,255,0.5)] animate-pulse" 
              : "glass-card hover:bg-white/10 text-gray-400 hover:text-white"
          )}
        >
          {isRecording ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <input
          name="message"
          placeholder={isRecording ? "Listening..." : "Type in Japanese..."}
          disabled={isRecording}
          className="flex-grow p-3 sm:p-4 text-sm sm:text-base glass-card bg-white/5 border-white/10 focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={isRecording || isChatLoading}
          className="px-4 sm:px-6 bg-cyan-500 text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
        >
          SEND
        </button>
      </form>
    </motion.div>
  );

  const [isScanning, setIsScanning] = useState(false);

  const scanView = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-6"
    >
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('dashboard')} className="p-2 glass-card hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold uppercase tracking-widest font-arcade text-yellow-500">Boss Scanner</h2>
      </header>

      <div className="glass-card aspect-video relative flex flex-col items-center justify-center p-8 overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-arcade text-yellow-500 text-sm">ANALYZING KANJI & GENERATING BOSS...</p>
          </div>
        )}
        <div className="absolute inset-0 border-2 border-yellow-500/50 flex items-center justify-center">
          <div className="w-20 h-20 border-t-2 border-l-2 border-yellow-500 absolute top-4 left-4" />
          <div className="w-20 h-20 border-t-2 border-r-2 border-yellow-500 absolute top-4 right-4" />
          <div className="w-20 h-20 border-b-2 border-l-2 border-yellow-500 absolute bottom-4 left-4" />
          <div className="w-20 h-20 border-b-2 border-r-2 border-yellow-500 absolute bottom-4 right-4" />
        </div>

        <Camera className="w-16 h-16 text-yellow-500 mb-4 opacity-50" />
        <p className="text-center text-gray-400 mb-6">Capture Japanese text from packaging, menus, or books to generate a high-level boss fight.</p>

        <label className={cn(
          "cursor-pointer bg-yellow-500 text-black font-arcade px-8 py-3 rounded hover:bg-yellow-400 transition-all",
          isScanning && "opacity-50 pointer-events-none"
        )}>
          {isScanning ? 'SCANNING...' : 'SCAN IMAGE'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isScanning}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIsScanning(true);
                const reader = new FileReader();
                reader.onload = async (rv) => {
                  const base64 = rv.target?.result as string;
                  try {
                    const res = await fetch('/api/scan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: base64, level: jlptLevel })
                    });
                    const data = await res.json();
                    setView('game');
                    game.startGame(data.questions, data.bossImageBase64 ? `data:image/jpeg;base64,${data.bossImageBase64}` : null);
                  } finally {
                    setIsScanning(false);
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </div>
    </motion.div>
  );

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

      <main className="relative z-10 pt-20">
        <AnimatePresence mode="wait">
          {!user ? (
            loginView
          ) : (
            <>
              {view === 'dashboard' && dashboardView}
              {view === 'game' && gameView}
              {view === 'chat' && chatView}
              {view === 'scan' && scanView}
              {view === 'leaderboard' && (
                <Leaderboard onBack={() => setView('dashboard')} currentUserId={user.uid} />
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Retro Grid Floor Effect */}
      <div className="fixed bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-pink-500/10 to-transparent pointer-events-none opacity-50 z-0"
        style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,0,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,255,0.1) 1px, transparent 1px)' }} />
    </div>
  );
}
