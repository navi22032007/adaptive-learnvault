import { motion } from 'framer-motion';
import { useCardTilt } from '../../hooks/useAnimations';

const typeIcon = {
  Video: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <polygon points="2,1 10,6 2,11" fill="#0891b2"/>
    </svg>
  ),
  PDF: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="2" y="1" width="8" height="10" rx="1" stroke="#06b6d4" strokeWidth="1.2" fill="none"/>
      <line x1="4" y1="4" x2="8" y2="4" stroke="#06b6d4" strokeWidth="1"/>
      <line x1="4" y1="6.5" x2="8" y2="6.5" stroke="#06b6d4" strokeWidth="1"/>
      <line x1="4" y1="9" x2="6.5" y2="9" stroke="#06b6d4" strokeWidth="1"/>
    </svg>
  ),
};

const difficultyLabel = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const difficultyColor = ['', '#059669', '#06b6d4', '#0891b2', '#ef4444'];

export default function RecommendationCard({ item, index, onClick }) {
  const tiltRef = useCardTilt();

  return (
    <motion.div
      ref={tiltRef}
      layoutId={`card-${item.id}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onClick?.(item)}
      className="group relative rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(8,145,178,0.12)',
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        borderColor: 'rgba(8,145,178,0.4)',
        boxShadow: '0 0 30px rgba(8,145,178,0.12), 0 8px 32px rgba(8,145,178,0.08)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(8,145,178,0.08) 0%, transparent 70%)' }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', color: '#0891b2', fontFamily: 'DM Sans, sans-serif' }}
          >
            {typeIcon[item.type]}
            {item.type}
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', color: difficultyColor[item.difficulty], border: `1px solid ${difficultyColor[item.difficulty]}33` }}
          >
            {difficultyLabel[item.difficulty]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: '#8ab4ba', fontFamily: 'JetBrains Mono, monospace' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="#8ab4ba" strokeWidth="1"/>
            <path d="M5 3V5L6.5 6.5" stroke="#8ab4ba" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          {item.duration}m
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-display font-semibold text-base mb-3 leading-snug transition-colors duration-200 group-hover:text-white"
        style={{ color: '#0f1f22', fontFamily: 'Syne, sans-serif' }}
      >
        {item.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded text-xs"
            style={{ background: 'rgba(8,145,178,0.05)', color: '#4a7a82', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Reason tooltip */}
      <div
        className="flex items-start gap-2 p-2.5 rounded-xl"
        style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 flex-shrink-0">
          <circle cx="6" cy="6" r="5" stroke="#0891b2" strokeWidth="1"/>
          <path d="M6 5.5V8" stroke="#0891b2" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="6" cy="4" r="0.5" fill="#0891b2"/>
        </svg>
        <span className="text-xs leading-relaxed" style={{ color: '#0891b299', fontFamily: 'DM Sans, sans-serif', fontSize: '11px' }}>
          {item.reason}
        </span>
      </div>

      {/* Progress bar */}
      {item.progress > 0 && (
        <div className="mt-3">
          <div className="h-px rounded-full" style={{ background: 'rgba(8,145,178,0.15)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: '#8ab4ba', fontSize: '10px' }}>Progress</span>
            <span className="text-xs font-mono" style={{ color: '#0891b2', fontSize: '10px' }}>{item.progress}%</span>
          </div>
        </div>
      )}

      {/* Arrow indicator */}
      <motion.div
        className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        initial={{ x: -4 }}
        whileHover={{ x: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M9 4L13 8L9 12" stroke="#0891b2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}
