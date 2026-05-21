import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Gamepad2, MessageCircle, Camera, Brain, Zap, Globe, BookOpen, ChevronDown } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number; key?: React.Key }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Gamepad2,
    title: 'Arcade Quiz',
    desc: 'Latih kanji, kosakata, dan tata bahasa lewat quiz bergaya arcade retro dengan timer dan streak combo.',
    color: 'from-pink-500 to-fuchsia-600',
    glow: 'shadow-[0_0_30px_rgba(255,0,255,0.3)]',
  },
  {
    icon: MessageCircle,
    title: 'Sacho Chat',
    desc: 'Simulasi interview kerja dengan AI Manager Jepang. Latihan percakapan real-time dengan voice input.',
    color: 'from-cyan-400 to-blue-500',
    glow: 'shadow-[0_0_30px_rgba(0,255,255,0.3)]',
  },
  {
    icon: Camera,
    title: 'Kanji Scanner',
    desc: 'Foto kanji di sekitarmu — AI akan mengenali dan membuat quiz khusus dari kanji yang terdeteksi.',
    color: 'from-yellow-400 to-orange-500',
    glow: 'shadow-[0_0_30px_rgba(255,255,0,0.3)]',
  }
];

const JLPT_LEVELS = [
  { level: 'N5', label: 'Pemula', kanji: '入門', desc: '~100 kanji, kosakata dasar' },
  { level: 'N4', label: 'Dasar', kanji: '基礎', desc: '~300 kanji, percakapan sehari-hari' },
  { level: 'N3', label: 'Menengah', kanji: '中級', desc: '~650 kanji, membaca artikel' },
  { level: 'N2', label: 'Mahir', kanji: '上級', desc: '~1000 kanji, bahasa bisnis' },
  { level: 'N1', label: 'Expert', kanji: '達人', desc: '~2000 kanji, sastra & akademik' },
];

export function LandingView({ onStart }: LandingViewProps) {
  return (
    <div className="min-h-dvh">
      {/* ===== HERO SECTION ===== */}
      {/* BEST PRACTICE: Menggunakan min-h-[100dvh] agar URL Bar HP tidak memotong layout */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundSize: '60px 60px',
            backgroundImage: 'linear-gradient(to right, rgba(255,0,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,255,0.15) 1px, transparent 1px)',
          }}
        />

        {/* BEST PRACTICE: Radial glow menggunakan nilai yang pasti (arbitrary values) dan responsif */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 sm:w-150 sm:h-150 rounded-full bg-linear-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 blur-[80px] sm:blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* Floating kanji decorations */}
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-16 -left-8 text-6xl sm:text-8xl opacity-10 select-none"
          >
            漢
          </motion.div>
          <motion.div
            animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-8 -right-4 text-5xl sm:text-7xl opacity-10 select-none"
          >
            字
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs sm:text-sm font-mono mb-6 sm:mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            POWERED BY GEMINI AI
          </motion.div>

          {/* Main title */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-arcade leading-tight mb-4 sm:mb-6">
            <span className="block neon-text-pink">NEON</span>
            <span className="block text-white mt-2">JLPT</span>
            <span className="block neon-text-cyan mt-2">ARCADE</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-4 font-sans leading-relaxed px-4"
          >
            Belajar bahasa Jepang dengan cara yang <span className="text-pink-400 font-semibold">seru</span> dan{' '}
            <span className="text-cyan-400 font-semibold">interaktif</span>. 
            Quiz arcade, simulasi interview AI, dan kanji scanner — semua dalam satu platform.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-gray-500 mb-8 sm:mb-10 font-mono"
          >
            JLPT N5 → N1 • Gratis • AI-Powered
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,0,255,0.5), 0 0 80px rgba(255,0,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="relative px-10 sm:px-14 py-4 sm:py-5 bg-linear-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white font-arcade text-sm sm:text-base rounded-2xl shadow-[0_0_30px_rgba(255,0,255,0.4)] transition-all duration-300 cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
              AYO MAIN!
            </span>
          </motion.button>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16 sm:mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2 text-gray-600"
            >
              <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ===== WHAT IS THIS SECTION ===== */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/5 text-pink-400 text-xs font-mono mb-6">
              <Globe className="w-3.5 h-3.5" />
              TENTANG KAMI
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2 className="text-3xl sm:text-5xl font-arcade neon-text-pink mb-6 sm:mb-8 leading-tight">
              APA ITU<br />NEON JLPT ARCADE?
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto mb-6">
              <strong className="text-white">Neon JLPT Arcade</strong> adalah platform belajar bahasa Jepang berbasis AI 
              yang dirancang khusus untuk persiapan <strong className="text-cyan-400">JLPT</strong> (Japanese Language Proficiency Test) 
              dan <strong className="text-cyan-400">JFT</strong> (Japan Foundation Test). 
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
              Berbeda dari aplikasi belajar biasa, kami menggabungkan 
              <span className="text-pink-400"> gamifikasi bergaya arcade retro</span> dengan 
              <span className="text-cyan-400"> teknologi AI Gemini</span> untuk menciptakan pengalaman belajar 
              yang adiktif, efektif, dan menyenangkan — cocok untuk kamu yang sedang mempersiapkan kerja 
              atau studi di Jepang.
            </p>
          </AnimatedSection>

          {/* Stats */}
          <AnimatedSection delay={0.4}>
            {/* BEST PRACTICE: Ubah grid-cols-3 menjadi grid-cols-1 sm:grid-cols-3 agar tidak hancur di HP kecil */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto">
              {[
                { value: '5', label: 'Level JLPT', sub: 'N5 → N1' },
                { value: '6+', label: 'Mode Quiz', sub: 'Kanji, Grammar, dll' },
                { value: 'AI', label: 'Powered', sub: 'Gemini & Imagen' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-4 sm:p-6">
                  <div className="text-2xl sm:text-4xl font-arcade neon-text-cyan mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-white font-semibold">{stat.label}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-mono mb-6">
              <Brain className="w-3.5 h-3.5" />
              FITUR UTAMA
            </div>
            <h2 className="text-3xl sm:text-5xl font-arcade text-white mb-4">
              SEMUA YANG KAMU<br /><span className="neon-text-cyan">BUTUHKAN</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
              Fitur utama yang dirancang untuk memaksimalkan proses belajar bahasa Jepang.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {FEATURES.map((feature, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`glass-card p-6 sm:p-8 h-full ${feature.glow} hover:border-white/20 transition-all duration-300`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br ${feature.color} flex items-center justify-center mb-4 sm:mb-5`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== JLPT LEVELS SECTION ===== */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-xs font-mono mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              JLPT LEVELS
            </div>
            <h2 className="text-3xl sm:text-5xl font-arcade text-white mb-4">
              DARI <span className="neon-text-pink">PEMULA</span><br />SAMPAI <span className="neon-text-cyan">EXPERT</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
              Pilih level sesuai kemampuanmu. Soal dan percakapan AI akan menyesuaikan secara otomatis.
            </p>
          </AnimatedSection>

          <div className="space-y-3 sm:space-y-4">
            {JLPT_LEVELS.map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ x: 8, transition: { duration: 0.2 } }}
                  className="glass-card p-4 sm:p-5 flex items-center gap-4 sm:gap-6 hover:border-white/20 transition-all duration-300 cursor-default"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-linear-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl font-arcade neon-text-pink leading-none">{item.level}</span>
                    <span className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5">{item.kanji}</span>
                  </div>
                  <div className="grow min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white">{item.label}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{item.desc}</p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${20 + i * 20}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full bg-linear-to-r from-pink-500 to-cyan-400"
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 text-right">Difficulty</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-arcade text-white mb-4">
              CARA <span className="neon-text-cyan">BERMAIN</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'Pilih Level', desc: 'Pilih target level JLPT (N5-N1) yang sesuai dengan kemampuanmu.', emoji: '🎯' },
              { step: '02', title: 'Pilih Mode', desc: 'Pilih mode permainan mulai dari quiz kanji hingga sacho chat.', emoji: '🧠' },
              { step: '03', title: 'Main!', desc: 'Jawab pertanyaan, kumpulkan XP, dan tingkatkan maskot belajarmu!', emoji: '🎮' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl mb-4">{item.emoji}</div>
                  <div className="text-xs font-mono text-pink-500 mb-2">STEP {item.step}</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 sm:py-40 px-4">
        <div className="absolute inset-0 bg-linear-to-t from-pink-500/5 via-transparent to-transparent" />
        <AnimatedSection className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-arcade neon-text-pink mb-4 sm:mb-6 leading-tight">
            READY TO<br />PLAY?
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10 px-4">
            Mulai perjalanan belajar bahasa Jepangmu sekarang.<br className="hidden sm:block" />
            Gratis, tanpa iklan, powered by AI.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0,255,255,0.5), 0 0 100px rgba(0,255,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="px-10 sm:px-14 py-4 sm:py-5 bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 text-white font-arcade text-sm sm:text-base rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              MULAI SEKARANG
            </span>
          </motion.button>

          <p className="text-xs text-gray-600 mt-6 font-mono">INSERT COIN TO CONTINUE...</p>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-600 font-mono">
            NEON JLPT ARCADE | Mohammad Iqbal Jaffar
          </p>
        </div>
      </footer>
    </div>
  );
}