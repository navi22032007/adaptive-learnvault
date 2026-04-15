import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

const difficultyLabel = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export default function ContentView({ item, onClose }) {
  const { updateProgress, explainTopic } = useStore();
  const [progress, setProgress] = useState(item.progress || 0);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        setProgress((p) => {
          const next = Math.min(p + 100 / (item.duration * 60), 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, item.duration]);

  useEffect(() => {
    const roundedProgress = Math.round(progress);
    if (roundedProgress !== item.progress && roundedProgress % 5 === 0) {
      updateProgress(item.id, roundedProgress);
    }
  }, [progress, item.id, item.progress, updateProgress]);

  const handleClose = () => {
    updateProgress(item.id, Math.round(progress));
    onClose();
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    const text = await explainTopic(item.title);
    setExplanation(text);
    setIsExplaining(false);
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl rounded-[40px] bg-card border border-white/10 shadow-3xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex h-full flex-col md:flex-row">
          {/* Main Visual Side */}
          <div className="md:w-1/2 bg-deep p-8 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-primary/5 radial-gradient" />
            
            <div className="relative z-10 text-center">
              <motion.div 
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full border-4 border-orange-primary/30 flex items-center justify-center mb-6 mx-auto bg-card shadow-2xl"
              >
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-24 h-24 rounded-full bg-orange-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-orange-primary/40"
                >
                  {isPlaying ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5,3 19,12 5,21"/></svg>
                  )}
                </button>
              </motion.div>
              
              <div className="font-mono text-4xl font-bold text-white mb-2">{formatTime(timer)}</div>
              <div className="text-orange-primary text-xs font-mono uppercase tracking-[0.3em]">Session Active</div>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-mono text-text-secondary uppercase">Progress</span>
                <span className="text-[10px] font-mono text-orange-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  className="h-full bg-orange-primary"
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Details Side */}
          <div className="md:w-1/2 p-10 overflow-y-auto custom-scrollbar bg-card">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-2 py-1 rounded-lg bg-orange-primary/10 border border-orange-primary/20 text-[10px] text-orange-primary font-bold uppercase tracking-wider mb-3 inline-block">
                  {item.type}
                </span>
                <h1 className="font-display font-bold text-2xl text-white leading-tight">{item.title}</h1>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/5 text-text-secondary transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex gap-4 mb-8">
              {['overview', 'resources', 'notes'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs font-mono uppercase tracking-widest pb-1 border-b-2 transition-all ${tab === t ? 'border-orange-primary text-white' : 'border-transparent text-text-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-h-[200px]"
              >
                {tab === 'overview' && (
                  <div className="space-y-4">
                    <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                    
                    <div className="p-4 rounded-2xl bg-orange-primary/5 border border-orange-primary/10 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-orange-primary uppercase font-bold">Concept Clarity</span>
                        <button 
                          onClick={handleExplain}
                          disabled={isExplaining}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-primary text-white text-[10px] font-bold hover:bg-orange-secondary transition-all disabled:opacity-50"
                        >
                          {isExplaining ? 'Thinking...' : '✨ Explain Logic'}
                        </button>
                      </div>
                      
                      {explanation ? (
                        <div className="text-xs text-white leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-500">
                          {explanation}
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-secondary italic">
                          Struggling with this topic? Let AI provide a level-appropriate breakdown.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div>
                        <div className="text-[10px] font-mono text-orange-primary uppercase mb-1">Difficulty</div>
                        <div className="text-sm text-white font-medium">{difficultyLabel[item.difficulty]}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-orange-primary uppercase mb-1">Duration</div>
                        <div className="text-sm text-white font-medium">{item.duration} minutes</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-text-secondary font-mono">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'resources' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Primary Source</h4>
                      <p className="text-xs text-text-secondary mb-4 italic">"{item.reason}"</p>
                      <a 
                        href={item.file_path_or_url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full p-3 rounded-xl bg-orange-primary text-white text-xs font-bold hover:bg-orange-secondary transition-all"
                      >
                        <span>Open {item.type} Source</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                      </a>
                    </div>
                  </div>
                )}

                {tab === 'notes' && (
                  <textarea 
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-orange-primary/30 transition-colors placeholder:text-white/10"
                    placeholder="Start typing your thoughts..."
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
