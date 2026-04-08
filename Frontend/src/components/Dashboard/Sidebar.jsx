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

export default function Sidebar({ activeSection, onSectionChange }) {
  const { userProfile, knowledgeGraph } = useStore();
  const topics = knowledgeGraph?.nodes?.slice(0, 6).map(n => n.label) || [];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 w-56 flex-shrink-0"
    >
      {/* Welcome card */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-orange-primary text-white font-display"
          >
            {userProfile?.name?.[0] || 'U'}
          </div>
          <div>
            <div className="font-display font-semibold text-sm text-white">{userProfile?.name || 'User'}</div>
            <div className="text-xs text-orange-primary font-mono">{userProfile?.level || 'Beginner'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-text-secondary">🔥 {userProfile?.streak || 0} day streak</span>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <div className="text-xs font-mono text-orange-primary tracking-widest uppercase mb-3 ml-1">
          Navigation
        </div>
        <nav className="flex flex-col gap-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group"
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                }}
              >
                <span className={`relative z-10 transition-colors ${isActive ? 'text-orange-primary' : 'group-hover:text-white'}`}>
                  {section.icon}
                </span>
                <span className="relative z-10 font-medium">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div>
          <div className="text-xs font-mono text-orange-primary tracking-widest uppercase mb-3 ml-1">
            Core Topics
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, i) => (
              <motion.span
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 border border-white/10 text-text-secondary font-mono tracking-tighter"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* AI hint */}
      <div className="p-4 rounded-xl mt-auto bg-orange-primary/5 border border-orange-primary/10">
        <div className="flex items-start gap-2">
          <span className="text-orange-primary mt-0.5">✦</span>
          <p className="text-[11px] leading-relaxed text-text-secondary font-medium">
            AI is analyzing your velocity. Complete 2 more tasks to unlock personalized streaks.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
