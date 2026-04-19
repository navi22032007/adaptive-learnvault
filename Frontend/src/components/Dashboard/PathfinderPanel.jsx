import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';

export default function PathfinderPanel() {
  const { aiSuggestions, getWhatNext, generateTopic, isLoading } = useStore();
  const [hasRequested, setHasRequested] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Only fetch when user clicks — NOT on mount (saves 5-10s on initial load)
  const handleLoadSuggestions = useCallback(async () => {
    setLocalLoading(true);
    setHasRequested(true);
    await getWhatNext();
    setLocalLoading(false);
  }, [getWhatNext]);

  return (
    <div className="p-6 rounded-2xl bg-orange-primary/5 border border-orange-primary/10 mb-8 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-primary/20 flex items-center justify-center text-orange-primary">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">AI Pathfinder</h3>
            <p className="text-text-secondary text-xs">Based on your activity, here's what to master next</p>
          </div>
        </div>
        <button 
          onClick={handleLoadSuggestions}
          className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-all"
          title="Generate AI suggestions"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={localLoading ? 'animate-spin' : ''}>
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {aiSuggestions.length > 0 ? (
          <AnimatePresence mode="wait">
            {aiSuggestions.map((suggestion, idx) => (
              <motion.div
                key={suggestion.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-primary/30 transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => generateTopic(suggestion.title)}
              >
                <div>
                  <div className="text-orange-primary font-mono text-[10px] uppercase tracking-tighter mb-1 font-bold">
                    {suggestion.relevance}% Match
                  </div>
                  <h4 className="text-white font-bold text-sm mb-2 group-hover:text-orange-primary transition-colors">
                    {suggestion.title}
                  </h4>
                  <p className="text-text-secondary text-[11px] leading-relaxed line-clamp-2">
                    {suggestion.reason}
                  </p>
                </div>
                <div className="mt-3 text-orange-primary/60 text-[10px] font-mono flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Find resources <span>→</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          /* Prompt to load suggestions — no auto-fetch */
          <div className="col-span-3 flex flex-col items-center justify-center py-6 text-center">
            {localLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-orange-primary/20 border-t-orange-primary rounded-full animate-spin" />
                <span className="text-text-secondary text-sm">AI is analyzing your trajectory…</span>
              </div>
            ) : (
              <>
                <p className="text-text-secondary text-sm mb-3">
                  {hasRequested ? 'No suggestions available yet.' : 'Click the refresh button to get AI-powered learning suggestions'}
                </p>
                <button
                  onClick={handleLoadSuggestions}
                  className="px-4 py-2 rounded-xl bg-orange-primary/10 border border-orange-primary/20 text-orange-primary text-xs font-bold hover:bg-orange-primary/20 transition-all"
                >
                  ✨ Generate Suggestions
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
    </div>
  );
}
