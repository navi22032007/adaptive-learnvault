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
  const { userProfile, token, logout } = useStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentNavItems = token 
    ? [{ id: 'home', label: 'Home', path: '/' }, { id: 'dashboard', label: 'Dashboard', path: '/dashboard' }]
    : [{ id: 'home', label: 'Home', path: '/' }, { id: 'login', label: 'Login', path: '/login' }];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(234,249,249,0.95) 0%, rgba(239,249,251,0) 100%)',
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
          style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.35)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#0891b2" strokeWidth="1.5" fill="none"/>
            <circle cx="8" cy="8" r="2" fill="#0891b2"/>
          </svg>
        </div>
        <span className="font-display font-bold text-sm tracking-widest uppercase" style={{ color: '#0f1f22', letterSpacing: '0.15em' }}>
          Learn<span className="text-gradient-orange">Vault</span>
        </span>
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)' }}>
        {currentNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200"
              style={{ color: isActive ? '#0f1f22' : '#4a7a82', fontFamily: 'DM Sans, sans-serif' }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.3)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User badge / Logout */}
      <div className="flex items-center gap-3">
        {token && userProfile ? (
          <>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)' }}>
              <div className="flex items-center gap-1.5 border-r border-cyan-800/20 pr-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                 <span className="font-mono text-xs" style={{ color: '#0891b2' }}>{(userProfile?.streak || 0)} day streak</span>
              </div>
              <div className="flex items-center gap-2 pl-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-orange-primary bg-orange-primary/10 px-2 py-0.5 rounded-md">Lvl {userProfile?.level || 1}</span>
                 <span className="font-mono text-xs text-text-secondary">{(userProfile?.xp || 0).toLocaleString()} XP</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-mono text-text-secondary hover:text-orange-primary transition-colors"
            >
              Logout
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff' }}
            >
              {userProfile?.name?.[0] || 'U'}
            </div>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-full bg-orange-primary text-white text-sm font-bold shadow-lg shadow-orange-primary/20 hover:bg-orange-secondary transition-all"
          >
            Get Started
          </button>
        )}
      </div>
    </motion.nav>
  );
}
