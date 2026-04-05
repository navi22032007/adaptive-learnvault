import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const difficultyLabel = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const difficultyColor = ['', '#059669', '#06b6d4', '#0891b2', '#ef4444'];

export default function ContentView({ item, onClose }) {
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        setProgress((p) => Math.min(p + 100 / (item.duration * 60), 100));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, item.duration]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <motion.div
      layoutId={`card-${item.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{ background: '#f5fdfd', border: '1px solid rgba(8,145,178,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="relative p-6 pb-4" style={{ background: 'linear-gradient(180deg, rgba(8,145,178,0.08) 0%, transparent 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{ background: 'rgba(8,145,178,0.08)', color: '#4a7a82' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.3)', color: '#0891b2', fontFamily: 'DM Sans' }}>
              {item.type}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs" style={{ color: difficultyColor[item.difficulty], background: `${difficultyColor[item.difficulty]}15`, border: `1px solid ${difficultyColor[item.difficulty]}33`, fontFamily: 'DM Sans' }}>
              {difficultyLabel[item.difficulty]}
            </span>
            <span className="font-mono text-xs" style={{ color: '#8ab4ba' }}>{item.duration}m</span>
          </div>

          <h1 className="font-display font-bold text-2xl mb-2" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>
            {item.title}
          </h1>

          <div className="flex items-center gap-4 text-xs" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
            <span>by {item.instructor}</span>
            <span>⭐ {item.rating}</span>
            <span>{item.enrolled?.toLocaleString()} enrolled</span>
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 pb-6">
          {/* Video preview area */}
          <div
            className="relative rounded-2xl overflow-hidden mb-5"
            style={{ background: '#eef9fb', border: '1px solid rgba(8,145,178,0.15)', aspectRatio: '16/7' }}
          >
            {/* Simulated content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3 mx-auto cursor-pointer transition-transform duration-200 hover:scale-110"
                  style={{ background: 'rgba(8,145,178,0.15)', border: '2px solid rgba(8,145,178,0.5)' }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="5" y="4" width="3" height="12" fill="#0891b2"/>
                      <rect x="12" y="4" width="3" height="12" fill="#0891b2"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <polygon points="5,3 17,10 5,17" fill="#0891b2"/>
                    </svg>
                  )}
                </div>
                <div className="font-mono text-2xl font-bold" style={{ color: '#0891b2' }}>{formatTime(timer)}</div>
                <div className="text-xs mt-1" style={{ color: '#8ab4ba', fontFamily: 'DM Sans' }}>
                  {isPlaying ? 'Learning in progress...' : 'Click to start learning'}
                </div>
              </div>
            </div>

            {/* Simulated waveform */}
            <div className="absolute bottom-3 left-6 right-6 flex items-center gap-1">
              {Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: Math.random() * 20 + 4,
                    background: i / 60 <= progress / 100 ? '#0891b2' : 'rgba(8,145,178,0.15)',
                    transition: 'background 0.3s',
                  }}
                  animate={isPlaying && i / 60 <= progress / 100 ? { scaleY: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.02 }}
                />
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>Learning Progress</span>
              <span className="font-mono text-xs" style={{ color: '#0891b2' }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(8,145,178,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #0891b2, #22d3ee)', boxShadow: '0 0 8px rgba(8,145,178,0.35)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(8,145,178,0.05)' }}>
            {['overview', 'tags', 'notes'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200"
                style={{
                  background: tab === t ? 'rgba(8,145,178,0.15)' : 'transparent',
                  color: tab === t ? '#0891b2' : '#4a7a82',
                  border: tab === t ? '1px solid rgba(8,145,178,0.25)' : '1px solid transparent',
                  fontFamily: 'DM Sans',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'overview' && (
                <div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
                    {item.description}
                  </p>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)' }}>
                    <div className="flex items-start gap-2">
                      <span style={{ color: '#0891b2', fontSize: '14px' }}>✦</span>
                      <p className="text-xs" style={{ color: '#0891b299', fontFamily: 'DM Sans' }}>
                        <strong style={{ color: '#0891b2' }}>AI Recommendation: </strong>
                        {item.reason}. This content matches your learning velocity and preferred format.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'tags' && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', color: '#0891b2', fontFamily: 'JetBrains Mono' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {tab === 'notes' && (
                <div>
                  <textarea
                    placeholder="Take notes as you learn…"
                    className="w-full h-28 text-sm p-3 rounded-xl resize-none outline-none transition-colors duration-200"
                    style={{
                      background: 'rgba(8,145,178,0.04)',
                      border: '1px solid rgba(8,145,178,0.15)',
                      color: '#0f1f22',
                      fontFamily: 'DM Sans',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(8,145,178,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(8,145,178,0.15)'}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
