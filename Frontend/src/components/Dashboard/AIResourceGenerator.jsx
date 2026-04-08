import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';

export default function AIResourceGenerator() {
  const [topic, setTopic] = useState('');
  const { generateTopic, isLoading } = useStore();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    await generateTopic(topic);
    setTopic('');
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-primary/20 flex items-center justify-center text-orange-primary">
          <span className="text-xl">✨</span>
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-white">AI Curriculum Generator</h3>
          <p className="text-text-secondary text-xs">Ask AI to find high-quality PDFs and Videos for any topic</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Quantum Computing, Advanced React Patterns..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-primary/50 transition-colors text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="px-6 py-3 rounded-xl bg-orange-primary text-white font-bold hover:bg-orange-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            "Generate"
          )}
        </button>
      </form>
    </div>
  );
}
