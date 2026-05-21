import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// Tambahkan import MessageSquare dan Flame untuk icon mode
import { ArrowLeft, Mic, MicOff, User as UserIcon, Volume2, Square, MessageSquare, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { JLPTLevel } from '../hooks/useGame';

interface ChatRoomViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' ) => void;
  jlptLevel: JLPTLevel;
}

export function ChatRoomView({ setView, jlptLevel }: ChatRoomViewProps) {
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [chatMode, setChatMode] = useState<'mentoring' | 'appaku'>('mentoring');
  // STATE BARU: Untuk mengecek apakah user sudah memilih mode
  const [hasSelectedMode, setHasSelectedMode] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speakJapanese = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = 0.8;
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

  const toggleVoice = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakJapanese(text);
    }
  };

  const startRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.type === 'touchstart') e.preventDefault(); 
    if (isRecording) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      if (transcript.trim()) {
        handleSendMessage(transcript);
      }
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

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && (e.type === 'touchend' || e.type === 'touchcancel')) e.preventDefault();
    
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const handleSendMessage = async (text: string) => {
    const newMsgs = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMsgs as any);
    setIsChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, level: jlptLevel, mode: chatMode })
      });
      const data = await res.json();
      setChatMessages([...newMsgs, { role: 'assistant', content: data.content }] as any);
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ==========================================
  // LAYAR 1: PEMILIHAN MODE SEBELUM CHAT
  // ==========================================
  if (!hasSelectedMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto p-4 sm:p-6 h-[85vh] sm:h-[80vh] flex flex-col justify-center relative"
      >
        {/* Tombol Kembali ke Dashboard */}
        <div className="absolute top-4 left-4 sm:top-0 sm:left-0 z-10">
          <button 
            onClick={() => setView('dashboard')} 
            className="p-3 glass-card hover:bg-white/10 flex items-center gap-2 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold hidden sm:inline">DASHBOARD</span>
          </button>
        </div>

        <div className="text-center mb-10 mt-16 sm:mt-0">
          <h2 className="text-3xl sm:text-4xl font-arcade neon-text-cyan mb-4">SELECT INTERVIEW MODE</h2>
          <p className="text-gray-400 text-sm sm:text-base">Pilih kepribadian Sacho untuk sesi latihanmu kali ini.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
          {/* Card Mentoring */}
          <button
            onClick={() => { setChatMode('mentoring'); setHasSelectedMode(true); }}
            className="glass-card p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 bg-cyan-500/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Mentoring Mode</h3>
            <p className="text-sm text-gray-400">Sacho yang ramah dan suportif. Sangat cocok untuk latihan santai dan membangun kepercayaan diri.</p>
          </button>

          {/* Card Appaku */}
          <button
            onClick={() => { setChatMode('appaku'); setHasSelectedMode(true); }}
            className="glass-card p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-red-500/50 hover:bg-red-500/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-4 bg-red-500/20 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              <Flame className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Appaku Mode <span className="text-red-500">😈</span></h3>
            <p className="text-sm text-gray-400">Pressure interview ketat (Appaku mensetsu). Sacho akan merespon dengan dingin. Uji mentalmu!</p>
          </button>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // LAYAR 2: INTERFACE SACHO CHAT UTAMA
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto p-4 sm:p-6 h-[85vh] sm:h-[80vh] flex flex-col"
    >
      <header className="flex items-center gap-4 mb-4 sm:mb-6">
        {/* Tombol Back sekarang mengembalikan ke layar pilihan mode, bukan langsung ke dashboard */}
        <button onClick={() => setHasSelectedMode(false)} className="p-2 glass-card hover:bg-white/10 shrink-0 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="grow">
          <h2 className="text-lg sm:text-xl font-bold">SACHO'S OFFICE</h2>
          <p className="text-[10px] sm:text-xs text-cyan-400">JFT A2 Interview Practice</p>
        </div>
        
        {/* Indikator Mode (Menggantikan Dropdown lama) */}
        <div className={cn(
          "px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold",
          chatMode === 'mentoring' 
            ? "bg-cyan-900/30 border-cyan-500/30 text-cyan-400" 
            : "bg-red-900/30 border-red-500/30 text-red-400"
        )}>
          {chatMode === 'mentoring' ? 'Mentoring' : 'Appaku 😈'}
        </div>
      </header>

      <div className="grow glass-card p-4 sm:p-6 overflow-y-auto mb-4 flex flex-col gap-4 text-sm sm:text-base">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 sm:mt-20">
            <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-20" />
            <p>Sacho is waiting for your self-introduction.</p>
            <p className="text-[10px] sm:text-xs mt-2 italic">
              {chatMode === 'mentoring' 
                ? '"Konichiwa. Jiko shoukai wo onegaishimasu."' 
                : '"...Jiko shoukai shite kudasai. Mijikaku." (Tell me your intro. Keep it short.)'}
            </p>
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={cn(
            "max-w-[90%] sm:max-w-[80%] flex flex-col gap-1.5",
            m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
          )}>
            <div className={cn(
              "p-3 sm:p-4 rounded-2xl",
              m.role === 'user' 
                ? "bg-pink-500 text-white rounded-br-sm" 
                : (chatMode === 'appaku' ? "bg-red-900/40 border border-red-500/30 rounded-bl-sm" : "bg-white/10 rounded-bl-sm")
            )}>
              {m.content}
            </div>
            
            {m.role === 'assistant' && (
              <button 
                onClick={() => toggleVoice(m.content)}
                className="flex items-center gap-1.5 text-[10px] sm:text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 transition-colors px-2 py-1 rounded-md cursor-pointer"
              >
                {isSpeaking ? <Square className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                {isSpeaking ? "Stop Voice" : "Play Voice"}
              </button>
            )}
          </div>
        ))}
        
        {isChatLoading && <div className="text-cyan-400 text-xs sm:text-sm animate-pulse px-2">Sacho is typing...</div>}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        const inputElement = (e.currentTarget.elements.namedItem('message') as HTMLInputElement);
        const input = inputElement.value;
        if (input) {
          handleSendMessage(input);
          e.currentTarget.reset();
        }
      }} className="flex gap-2">
        <button 
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
          className={cn(
            "p-3 sm:p-4 rounded-xl flex items-center justify-center transition-all border border-transparent select-none touch-none cursor-pointer",
            isRecording 
              ? "bg-pink-500/20 text-pink-500 border-pink-500 shadow-[0_0_15px_rgba(255,0,255,0.5)] animate-pulse" 
              : "glass-card hover:bg-white/10 text-gray-400 hover:text-white"
          )}
        >
          {isRecording ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <input
          name="message"
          placeholder={isRecording ? "Listening... (Release to send)" : "Type or hold Mic..."}
          disabled={isRecording}
          className="grow p-3 sm:p-4 text-sm sm:text-base glass-card bg-white/5 border-white/10 focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
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
}