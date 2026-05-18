import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { JLPTLevel } from '../hooks/useGame';

interface ChatRoomViewProps {
  setView: (view: 'dashboard' | 'game' | 'chat' | 'scan' | 'leaderboard') => void;
  jlptLevel: JLPTLevel;
}

export function ChatRoomView({ setView, jlptLevel }: ChatRoomViewProps) {
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  return (
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
}
