import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface LeaderboardProps {
  onBack: () => void;
  currentUserId: string;
}

interface Player {
  uid: string;
  displayName: string;
  photoURL: string;
  totalCorrect: number;
  jlptLevel: string;
}

export function Leaderboard({ onBack, currentUserId }: LeaderboardProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('totalCorrect', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedPlayers: Player[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPlayers.push({
            uid: data.uid,
            displayName: data.displayName || 'ANONYMOUS PLAYER',
            photoURL: data.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.uid}`,
            totalCorrect: data.totalCorrect || 0,
            jlptLevel: data.jlptLevel || 'N5',
          });
        });
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 h-full flex flex-col"
    >
      <header className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="glass-card p-3 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-arcade neon-text-cyan flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            HALL OF FAME
          </h1>
          <p className="text-cyan-400 font-mono text-sm tracking-widest mt-1">GLOBAL TOP 10 PLAYERS</p>
        </div>
      </header>

      <div className="glass-card flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-cyan-500" />
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="font-arcade text-cyan-500 mt-4 animate-pulse">LOADING SCORES...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {players.length === 0 ? (
              <p className="text-center font-mono text-gray-400">No players found.</p>
            ) : (
              players.map((player, index) => {
                const isCurrentPlayer = player.uid === currentUserId;
                return (
                  <motion.div
                    key={player.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                      isCurrentPlayer 
                        ? "border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                        : "border-white/10 bg-black/20 hover:border-cyan-500/50"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 font-arcade text-xl">
                      {index === 0 ? <Medal className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" /> :
                       index === 1 ? <Medal className="w-7 h-7 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.8)]" /> :
                       index === 2 ? <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)]" /> :
                       <span className="text-gray-500">#{index + 1}</span>}
                    </div>
                    
                    <img 
                      src={player.photoURL} 
                      alt="Avatar" 
                      className={cn(
                        "w-10 h-10 rounded-full border-2 object-cover",
                        index === 0 ? "border-yellow-400" : "border-cyan-500/50"
                      )}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-bold truncate",
                        isCurrentPlayer ? "text-pink-400" : "text-white"
                      )}>
                        {player.displayName}
                        {isCurrentPlayer && <span className="ml-2 text-[10px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded font-mono">YOU</span>}
                      </h3>
                      <p className="text-xs font-mono text-cyan-400 opacity-80">LEVEL: {player.jlptLevel}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-arcade text-xl text-yellow-400">{player.totalCorrect}</div>
                      <div className="text-[10px] font-mono text-gray-400">SCORE</div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
