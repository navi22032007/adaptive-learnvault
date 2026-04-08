import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';

export default function ImportContentModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('Video');
  const { importContent } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await importContent({ title, url, type });
    if (success) {
      setTitle('');
      setUrl('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg p-8 rounded-3xl bg-card border border-white/10 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-2xl text-white">Import Content</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-orange-primary uppercase tracking-widest mb-1.5 ml-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-primary/50 transition-colors"
              placeholder="Deep Dive into Transformers"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-orange-primary uppercase tracking-widest mb-1.5 ml-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-primary/50 transition-colors"
              placeholder="https://youtube.com/..."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-orange-primary uppercase tracking-widest mb-1.5 ml-1">Content Type</label>
            <div className="flex gap-2">
              {['Video', 'PDF', 'Blog', 'Problem Set'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    type === t 
                      ? 'bg-orange-primary/20 border-orange-primary text-orange-primary' 
                      : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 rounded-xl bg-orange-primary text-white font-bold hover:bg-orange-secondary transition-all shadow-lg shadow-orange-primary/20"
          >
            Add to Vault
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
