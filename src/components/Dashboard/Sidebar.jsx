import { motion } from 'framer-motion';
import { useStore } from '../../store';

const sections = [
  {
    id: 'recommendations',
    label: 'Recommendations',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L9.8 5.8L15 6.2L11 9.8L12.4 15L8 12.2L3.6 15L5 9.8L1 6.2L6.2 5.8L8 1Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'graph',
    label: 'Knowledge Graph',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="3" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="13" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="3" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="13" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="6" y1="7" x2="4.5" y2="5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
        <line x1="10" y1="7" x2="11.5" y2="5" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
        <line x1="6" y1="9" x2="4.5" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
        <line x1="10" y1="9" x2="11.5" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8H4L6 3L8 13L10 6L11.5 8H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const topics = ['Python', 'DSA', 'Machine Learning', 'React', 'SQL', 'System Design'];

export default function Sidebar({ activeSection, onSectionChange }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 w-56 flex-shrink-0"
    >
      {/* Welcome card */}
      <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(8,145,178,0.2)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff', fontFamily: 'Syne' }}
          >
            A
          </div>
          <div>
            <div className="font-display font-semibold text-sm" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>Arjun</div>
            <div className="text-xs" style={{ color: '#0891b2', fontFamily: 'DM Sans' }}>Intermediate</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0891b2' }} />
          <span className="text-xs" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>🔥 12 day streak</span>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8ab4ba', letterSpacing: '0.2em', fontFamily: 'Syne' }}>
          Navigation
        </div>
        <nav className="flex flex-col gap-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left"
                style={{
                  color: isActive ? '#0f1f22' : '#4a7a82',
                  background: isActive ? 'rgba(8,145,178,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(8,145,178,0.25)' : '1px solid transparent',
                  fontFamily: 'DM Sans',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(8,145,178,0.07)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10" style={{ color: isActive ? '#0891b2' : '#8ab4ba' }}>
                  {section.icon}
                </span>
                <span className="relative z-10">{section.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1 h-1 rounded-full" style={{ background: '#0891b2' }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Topics */}
      <div>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8ab4ba', letterSpacing: '0.2em', fontFamily: 'Syne' }}>
          Your Topics
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, i) => (
            <motion.span
              key={topic}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all duration-200 hover:border-orange-400"
              style={{
                background: 'rgba(8,145,178,0.05)',
                border: '1px solid rgba(8,145,178,0.15)',
                color: '#4a7a82',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
              }}
            >
              {topic}
            </motion.span>
          ))}
        </div>
      </div>

      {/* AI hint */}
      <div
        className="p-3 rounded-xl mt-auto"
        style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)' }}
      >
        <div className="flex items-start gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(8,145,178,0.15)' }}
          >
            <span style={{ fontSize: '10px' }}>✦</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
            AI suggests: focus on <span style={{ color: '#0891b2' }}>DSA</span> this week to unlock System Design
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
