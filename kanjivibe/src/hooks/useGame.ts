import { useState, useEffect, useCallback, useRef } from 'react';

export type GameMode = 'kanji-meaning' | 'meaning-kanji' | 'hiragana-meaning' | 'bunpou' | 'listening' | 'scan';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  reading?: string;
  meaning?: string;
  explanation: string;
}

export const TIMER_MAP = {
  easy: 20,
  normal: 12,
  hard: 7
};

export function useGame(mode: GameMode, difficulty: Difficulty, level: JLPTLevel = 'N5') {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_MAP[difficulty]);
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'feedback' | 'ended'>('idle');
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean, points: number } | null>(null);
  const [bossImage, setBossImage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parameter startMode ditambahkan untuk menentukan mode di awal
  const fetchQuestions = useCallback(async (customQuestions?: Question[], customBossImage?: string | null, startMode?: GameMode) => {
    if (customQuestions) {
      setQuestions(customQuestions);
      setBossImage(customBossImage || null);
      setGameState('playing');
      return;
    }

    setGameState('loading');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Gunakan startMode jika ada, jika tidak kembali ke state mode saat ini
        body: JSON.stringify({ mode: startMode || mode, count: 10, level })
      });
      const data = await res.json();
      setQuestions(data);
      setGameState('playing');
    } catch (error) {
      console.error("Gagal memuat pertanyaan", error);
      setGameState('idle');
    }
  }, [mode, level]);

  // Fungsi untuk memulai game
  const startGame = (customQuestions?: Question[], customBossImage?: string | null, startMode?: GameMode) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    if (!customBossImage) setBossImage(null);
    // Teruskan startMode ke fetchQuestions
    fetchQuestions(customQuestions, customBossImage, startMode);
  };

  // Fungsi saat user memilih jawaban
  const handleAnswer = (index: number | null) => {
    if (gameState !== 'playing') return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = index === currentQuestion.answerIndex;

    let points = 0;
    if (isCorrect) {
      const basePoints = 100;
      const streakBonus = streak * 10;
      const timeBonus = Math.floor(timeLeft * 5);
      points = basePoints + streakBonus + timeBonus;

      setScore(s => s + points);
      setStreak(s => s + 1);
    } else {
      setStreak(0); // Penalti streak reset ke 0 jika salah
    }

    setLastFeedback({ correct: isCorrect, points });
    setGameState('feedback'); // Ubah state ke feedback untuk menampilkan kunjaw

    // Hentikan timer waktu menjawab
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    
    // Timer otomatis (setTimeout) DIHAPUS dari sini agar user bisa membaca penjelasan
  };

  // FUNGSI BARU: Untuk pindah ke soal berikutnya secara manual
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setTimeLeft(TIMER_MAP[difficulty]);
      setGameState('playing');
    } else {
      setGameState('ended');
    }
  };

  // Cleanup untuk feedback timeout
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // Timer countdown saat sedang bermain
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleAnswer(null); // Jika waktu habis, dianggap salah (null)
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIndex]);

  // Web Speech API untuk mode listening (mendengarkan)
  useEffect(() => {
    if (mode === 'listening' && gameState === 'playing') {
      const currentQuestion = questions[currentIndex];
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentIndex, gameState, mode, questions]);

  return {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    score,
    streak,
    timeLeft,
    gameState,
    lastFeedback,
    bossImage,
    startGame,
    handleAnswer,
    nextQuestion, // Diekspor agar bisa digunakan di UI tombol "Lanjut"
    restart: () => startGame()
  };
}