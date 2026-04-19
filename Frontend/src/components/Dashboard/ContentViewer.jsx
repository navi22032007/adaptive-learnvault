import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import ReactMarkdown from 'react-markdown';

const difficultyLabel = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

export default function ContentViewer() {
  const { 
    selectedContent: item,
    setSelectedContent,
    updateProgress, 
    explainTopic, 
    fetchNote, 
    saveNote, 
    searchYouTube,
    markComplete
  } = useStore();
  
  const [progress, setProgress] = useState(item?.progress || 0);
  const [explanation, setExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Decrypting...');
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tab, setTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [relatedResources, setRelatedResources] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    let intervalId;
    if (isExplaining) {
      const messages = [
        "Analyzing contents...",
        "Identifying key concepts...",
        "Extracting core algorithms...",
        "Structuring study strategy...",
        "Synthesizing final insights..."
      ];
      let i = 0;
      setLoadingMessage(messages[0]);
      intervalId = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isExplaining]);

  // Sync internal progress if external item changes
  useEffect(() => {
    if (item) setProgress(item.progress || 0);
  }, [item?.id]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (!item) return;
    const loadNote = async () => {
      const text = await fetchNote(item.id);
      setNoteText(text || '');
    };
    loadNote();
  }, [item?.id, fetchNote]);

  useEffect(() => {
    if (!item) return;
    const timeout = setTimeout(() => {
      if (noteText !== '') {
        saveNote(item.id, noteText);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [noteText, item?.id, saveNote]);

  // Load related resources when switching to that tab
  useEffect(() => {
    if (tab === 'resources' && relatedResources.length === 0 && item) {
      const loadRelated = async () => {
        setIsLoadingRelated(true);
        const results = await searchYouTube(item.title);
        setRelatedResources(results || []);
        setIsLoadingRelated(false);
      };
      loadRelated();
    }
  }, [tab, item?.title, searchYouTube, relatedResources.length]);

  useEffect(() => {
    let interval;
    if (isPlaying && item) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
        setProgress((p) => {
          const next = Math.min(p + 100 / ((item.duration || 10) * 60), 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, item?.duration]);

  useEffect(() => {
    if (!item) return;
    const roundedProgress = Math.round(progress);
    if (roundedProgress !== item.progress && roundedProgress % 5 === 0) {
      updateProgress(item.id, roundedProgress);
    }
  }, [progress, item?.id, item?.progress, updateProgress]);

  const handleClose = () => {
    if (item) updateProgress(item.id, Math.round(progress));
    setSelectedContent(null);
  };

  const handleExplain = async () => {
    if (!item) return;
    setIsExplaining(true);
    // Pass full item metadata for context-aware AI analysis
    const metadata = {
      type: item.type || 'Topic',
      description: item.description || '',
      tags: item.tags || [],
      topic_name: item.instructor || '',
      difficulty: item.difficulty || 3,
    };
    const text = await explainTopic(item.title, metadata);
    setExplanation(text);
    setIsExplaining(false);
  };

  const handleComplete = async () => {
    if (!item) return;
    setIsCompleting(true);
    const res = await markComplete(item.id);
    if (res) {
      setProgress(100);
      setJustCompleted(true);
      // Remove justCompleted state after animation
      setTimeout(() => setJustCompleted(false), 3000);
    }
    setIsCompleting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!item) return null;

  return (
    <motion.div
      layoutId={`card-${item.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-6xl rounded-[48px] bg-card border border-white/10 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden flex h-[90vh]"
      >
        <div className="flex w-full flex-col md:flex-row">
          {/* Main Visual Side */}
          <div className="md:w-[45%] bg-deep p-12 flex flex-col justify-center items-center relative overflow-hidden shrink-0 border-r border-white/5 bg-gradient-to-b from-transparent to-orange-primary/5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-primary/10 via-transparent to-transparent opacity-30" />
            
            <div className="relative z-10 text-center">
              <motion.div 
                animate={isPlaying ? { 
                  scale: [1, 1.02, 1],
                  boxShadow: ["0 0 40px rgba(249, 115, 22, 0.1)", "0 0 80px rgba(249, 115, 22, 0.3)", "0 0 40px rgba(249, 115, 22, 0.1)"]
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-56 h-56 rounded-full border border-white/10 flex items-center justify-center mb-10 mx-auto bg-card/40 backdrop-blur-md shadow-2xl relative"
              >
                <div className="absolute inset-2 rounded-full border border-orange-primary/20 animate-spin-slow" />
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-44 h-44 rounded-full bg-orange-primary text-white flex items-center justify-center hover:scale-105 transition-all shadow-2xl shadow-orange-primary/40 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  {isPlaying ? (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="relative z-10"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="ml-2 relative z-10"><polygon points="5,3 19,12 5,21"/></svg>
                  )}
                </button>
              </motion.div>
              
              <div className="font-mono text-6xl font-bold text-white mb-4 tracking-tighter drop-shadow-2xl">{formatTime(timer)}</div>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 inline-block">
                <div className="text-orange-primary text-[10px] font-mono uppercase tracking-[0.5em] font-black opacity-90">
                  {isPlaying ? 'Neural Link Active' : 'Standby Mode'}
                </div>
              </div>
            </div>

              <div className="w-full mt-12 relative z-10">
                <div className="flex justify-between mb-4 items-end">
                  <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.3em] font-bold mb-1">Knowledge Sync</span>
                  <span className="text-xs text-white uppercase font-black tracking-widest">Mastery Influx</span>
                </div>
                <span className="text-3xl font-mono text-orange-primary font-bold drop-shadow-lg">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden p-[1px] border border-white/5 mb-6">
                <motion.div 
                   className="h-full bg-gradient-to-r from-orange-secondary to-orange-primary rounded-full"
                   animate={{ width: `${progress}%` }}
                   transition={{ type: "spring", stiffness: 40, damping: 15 }}
                />
              </div>
              
              <AnimatePresence>
                {justCompleted ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="p-3 rounded-2xl bg-green-500/20 border border-green-500/50 text-center"
                  >
                    <span className="text-green-400 font-bold text-sm tracking-widest uppercase">+100 XP Gained!</span>
                  </motion.div>
                ) : (
                  <button
                    onClick={handleComplete}
                    disabled={isCompleting || progress >= 100}
                    className="w-full py-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center transition-all group overflow-hidden relative"
                    style={{
                      background: progress >= 100 ? 'rgba(255,255,255,0.05)' : 'rgba(249, 115, 22, 0.1)',
                      borderColor: progress >= 100 ? 'rgba(255,255,255,0.1)' : 'rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    {progress >= 100 ? (
                       <span className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] z-10">Module Completed</span>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-primary/0 via-orange-primary/20 to-orange-primary/0 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />
                        <span className="text-orange-primary text-xs font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors z-10 flex items-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          {isCompleting ? 'Finalizing Sync...' : 'Mark as Completed'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Details Side */}
          <div className="flex-1 flex flex-col overflow-hidden bg-card/30 backdrop-blur-md">
            {/* Header */}
            <div className="p-12 pb-0 flex justify-between items-start">
              <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 items-center mb-5"
                >
                  <span className="px-3 py-1 rounded-lg bg-orange-primary text-[10px] text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-primary/20">
                    {item.type}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-text-secondary font-mono tracking-widest">
                    {item.duration} MIN SESSION
                  </span>
                </motion.div>
                <h1 className="font-display font-bold text-4xl text-white leading-[1.1] pr-12 drop-shadow-xl">{item.title}</h1>
              </div>
              <button 
                onClick={handleClose} 
                className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-text-secondary hover:bg-white/5 hover:text-white transition-all hover:rotate-90 group"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:scale-110 transition-transform"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="px-12 mt-10 flex gap-10 border-b border-white/5">
              {['overview', 'resources', 'notes'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-[11px] font-mono uppercase tracking-[0.3em] pb-6 border-b-2 transition-all relative font-black ${tab === t ? 'border-orange-primary text-white' : 'border-transparent text-text-secondary hover:text-white/60'}`}
                >
                  {t}
                  {tab === t && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-primary shadow-[0_0_20px_#f97316]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {tab === 'overview' && (
                    <div className="space-y-8">
                      <p className="text-base text-text-secondary leading-relaxed font-medium opacity-90">{item.description}</p>
                      
                      <div className="p-8 rounded-[32px] bg-gradient-to-br from-orange-primary/15 to-white/5 border border-orange-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-primary/10 blur-[64px] -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex items-center justify-between mb-6 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-primary/20 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-orange-primary uppercase font-black tracking-widest">Neural Insights</span>
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Logic Decipher</span>
                            </div>
                          </div>
                          <div className="flex flex-col text-right">
                          <button 
                            onClick={handleExplain}
                            disabled={isExplaining}
                            className="px-6 py-3 rounded-2xl bg-orange-primary text-white text-[11px] font-black hover:bg-orange-secondary hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-orange-primary/30 min-w-[200px]"
                          >
                            {isExplaining ? loadingMessage : '✨ SYNTHESIZE KEY POINTS'}
                          </button>
                          {isExplaining && <span className="text-[10px] text-orange-primary/80 mt-1 italic animate-pulse">This deeply technical synthesis takes up to 90 seconds</span>}
                          </div>
                        </div>
                        
                        <div className="relative z-10 min-h-[100px]">
                            {explanation ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-white/95 leading-relaxed font-medium bg-white/5 rounded-2xl p-6 border border-white/5 prose prose-invert prose-sm max-w-none prose-headings:text-orange-primary prose-headings:font-bold prose-strong:text-white prose-li:text-white/80 prose-p:text-white/80 prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 overflow-y-auto max-h-[50vh]"
                            >
                                <ReactMarkdown>{explanation}</ReactMarkdown>
                            </motion.div>
                            ) : (
                            <div className="flex items-center justify-center min-h-[100px]">
                              <p className="text-xs text-text-secondary/60 leading-relaxed italic text-center max-w-sm">
                                  Click "Synthesize Key Points" to generate a comprehensive technical breakdown, study guide, and exam-ready revision notes for this resource.
                              </p>
                            </div>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-orange-primary/30" />
                          <div className="text-[10px] font-mono text-orange-primary uppercase tracking-widest mb-2 font-black opacity-60">Complexity Index</div>
                          <div className="text-xl text-white font-bold">{difficultyLabel[item.difficulty || 1]}</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-default relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-orange-primary/30" />
                          <div className="text-[10px] font-mono text-orange-primary uppercase tracking-widest mb-2 font-black opacity-60">Mastery Yield</div>
                          <div className="text-xl text-white font-bold">~{(item.duration || 10) * 1.5} XP POTENTIAL</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 pt-4">
                        {(item.tags || []).map(tag => (
                          <span key={tag} className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] text-text-secondary font-mono tracking-tight hover:text-orange-primary hover:border-orange-primary/30 hover:scale-105 transition-all cursor-pointer">
                            #{tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'resources' && (
                    <div className="space-y-10">
                      <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="text-[11px] font-black text-white mb-5 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-1 h-3 bg-orange-primary rounded-full" />
                            Core Objective
                        </h4>
                        <p className="text-sm text-text-secondary mb-8 leading-relaxed italic font-medium opacity-80">
                          "{item.reason || 'Master this critical node to enhance your efficiency and unlock advanced branches in this learning trajectory.'}"
                        </p>
                        <a 
                          href={item.file_path_or_url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between w-full p-6 rounded-3xl bg-orange-primary text-white text-[11px] font-black hover:bg-orange-secondary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-orange-primary/30 relative z-10 group/btn"
                        >
                          <span className="tracking-[0.2em]">INITIALIZE SOURCE STREAM</span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                        </a>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-white px-2 uppercase tracking-[0.3em] flex items-center gap-3">
                             <span className="w-1 h-3 bg-orange-primary rounded-full" />
                             Correlated Data Points
                        </h4>
                        {isLoadingRelated ? (
                          <div className="grid gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />)}
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {(relatedResources || []).map((res, i) => (
                              <motion.a
                                key={res.id || i}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-6 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-orange-primary/40 hover:bg-white/10 transition-all group relative overflow-hidden"
                              >
                                {res.thumbnail && (
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden relative shrink-0">
                                        <img src={res.thumbnail} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt="" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-white mb-1 group-hover:text-orange-primary transition-colors truncate">{res.title}</div>
                                  <div className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black opacity-50">{res.instructor || 'Vault Resource'}</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-orange-primary/10 flex items-center justify-center text-orange-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-4">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                              </motion.a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {tab === 'notes' && (
                    <div className="relative h-full flex flex-col">
                      <div className="mb-6 px-4 py-3 rounded-2xl bg-orange-primary/10 border border-orange-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg width="16" height="16" className="text-orange-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <span className="text-[10px] font-mono text-white uppercase font-black tracking-widest">Active Neural Logging</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-orange-primary uppercase font-bold tracking-widest animate-pulse">Synced</span>
                            <div className="w-2 h-2 rounded-full bg-orange-primary shadow-[0_0_10px_#f97316]" />
                        </div>
                      </div>
                      
                      <div className="relative flex-1 group">
                        <textarea 
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="w-full h-96 bg-card/60 backdrop-blur-md border border-white/10 rounded-[32px] p-10 text-base text-white/95 outline-none focus:border-orange-primary/40 focus:bg-card/80 transition-all placeholder:text-text-secondary/30 leading-relaxed font-medium resize-none shadow-2xl"
                          placeholder="Synthesize your session architecture here... Your logs are automatically archived into your personal vault."
                        />
                        <div className="absolute top-10 right-10 opacity-20 group-focus-within:opacity-5 transition-opacity">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                      </div>
                      
                      <p className="mt-8 text-[11px] text-text-secondary/40 font-mono tracking-widest text-center uppercase italic">
                        Binary persistence active · Local storage cached
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
