import { motion } from 'framer-motion';

const typeColors = {
  Video: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PDF: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Blog: 'bg-green-500/20 text-green-400 border-green-500/30',
  'Problem Set': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RecommendationCard({ item, index, onClick }) {
  return (
    <motion.div
      layoutId={`card-${item.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="group relative flex flex-col p-5 rounded-3xl bg-card border border-white/5 hover:border-white/10 shadow-xl cursor-pointer transition-all duration-300"
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${typeColors[item.type] || 'bg-white/5 text-white/50 border-white/10'}`}>
          {item.type}
        </span>
        <div className="flex gap-1">
          {item.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-mono text-text-secondary">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-display font-bold text-lg text-white mb-2 line-clamp-2 leading-snug group-hover:text-orange-primary transition-colors">
        {item.title}
      </h3>
      <p className="text-xs text-text-secondary mb-4 line-clamp-2 leading-relaxed">
        {item.description}
      </p>

      {/* AI Reason */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full bg-orange-primary/20 flex items-center justify-center">
            <span className="text-[10px]">✦</span>
          </div>
          <p className="text-[10px] italic text-orange-primary/80 line-clamp-1">
            {item.reason}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold">
              {item.instructor?.[0] || 'A'}
            </div>
            <span className="text-[10px] text-text-secondary font-medium">
              {item.instructor}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary">
            <span>⭐ {item.rating || '0.0'}</span>
            <span>{item.duration}m</span>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {item.progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-3xl overflow-hidden">
          <motion.div
            className="h-full bg-orange-primary"
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
