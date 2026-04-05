import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{ background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.35)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#ff6a00" strokeWidth="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="#ff6a00"/>
          </svg>
        </div>
        <span className="font-display font-bold text-sm tracking-widest uppercase" style={{ color: '#f0ece4', letterSpacing: '0.15em' }}>
          Learn<span className="text-gradient-orange">Vault</span>
        </span>
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200"
              style={{ color: isActive ? '#f0ece4' : '#666660', fontFamily: 'DM Sans, sans-serif' }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(255,106,0,0.15)', border: '1px solid rgba(255,106,0,0.3)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-mono text-xs" style={{ color: '#ff8c42' }}>12 day streak</span>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8c42)', color: '#fff' }}
        >
          A
        </div>
      </div>
    </motion.nav>
  );
}
