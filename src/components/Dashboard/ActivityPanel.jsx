import { motion } from 'framer-motion';
import { mockActivityData } from '../../data/mockData';

function BarChart({ data, labels }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-sm"
            style={{ background: i === 6 ? 'linear-gradient(180deg, #0891b2, #06b6d4)' : 'rgba(8,145,178,0.2)' }}
            initial={{ height: 0 }}
            animate={{ height: `${(val / max) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-xs" style={{ color: '#8ab4ba', fontFamily: 'JetBrains Mono', fontSize: '9px' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function CircleProgress({ value, size = 80, label }) {
  const r = (size - 8) / 2;
  const circumference = r * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(8,145,178,0.15)" strokeWidth="5"/>
          <motion.circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="url(#grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-sm" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>{value}%</span>
        </div>
      </div>
      <span className="text-xs text-center" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>{label}</span>
    </div>
  );
}

function StatBadge({ value, label, sub }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(8,145,178,0.12)' }}>
      <div className="font-display font-bold text-xl" style={{ color: '#0891b2', fontFamily: 'Syne' }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: '#8ab4ba', fontFamily: 'DM Sans' }}>{sub}</div>}
    </div>
  );
}

export default function ActivityPanel() {
  const data = mockActivityData;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div>
        <h2 className="font-display font-semibold text-sm tracking-widest uppercase" style={{ color: '#0891b2', letterSpacing: '0.15em', fontFamily: 'Syne' }}>
          Activity
        </h2>
      </div>

      {/* Daily goal */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(8,145,178,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>Today's Goal</span>
          <span className="font-mono text-xs" style={{ color: '#0891b2' }}>38/60 min</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(8,145,178,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4)', boxShadow: '0 0 6px rgba(8,145,178,0.4)' }}
            initial={{ width: 0 }}
            animate={{ width: '63%' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="mt-2 text-xs" style={{ color: '#8ab4ba', fontFamily: 'DM Sans' }}>22 minutes remaining</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatBadge value={`🔥 ${data.streak}`} label="Day Streak" sub="Personal best: 18" />
        <StatBadge value={data.totalCompleted} label="Completed" sub="This month" />
        <StatBadge value={`${data.xp.toLocaleString()} XP`} label="Experience" sub={`/${data.nextLevelXp.toLocaleString()} next`} />
        <StatBadge value={data.currentLevel} label="Level" sub="Top 12%" />
      </div>

      {/* Completion ring */}
      <div className="p-4 rounded-2xl flex items-center justify-around" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(8,145,178,0.12)' }}>
        <CircleProgress value={data.completionRate} size={76} label="Completion" />
        <div className="h-12 w-px" style={{ background: 'rgba(8,145,178,0.15)' }} />
        <CircleProgress value={78} size={76} label="Accuracy" />
      </div>

      {/* Weekly hours chart */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(8,145,178,0.12)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>Weekly Hours</span>
          <span className="font-mono text-xs" style={{ color: '#0891b2' }}>{data.weeklyHours.reduce((a, b) => a + b, 0).toFixed(1)}h total</span>
        </div>
        <BarChart data={data.weeklyHours} labels={data.weekLabels} />
      </div>

      {/* XP Progress */}
      <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(8,145,178,0.18)' }}>
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#0891b2', fontFamily: 'DM Sans' }}>XP to next level</span>
          <span className="font-mono text-xs" style={{ color: '#0891b2' }}>Lv.{data.currentLevel}</span>
        </div>
        <div className="h-1.5 rounded-full mb-1" style={{ background: 'rgba(8,145,178,0.1)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #0891b2, #22d3ee)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(data.xp / data.nextLevelXp) * 100}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-xs" style={{ color: '#0891b2' }}>{data.xp.toLocaleString()} XP</span>
          <span className="font-mono text-xs" style={{ color: '#8ab4ba' }}>{data.nextLevelXp.toLocaleString()} XP</span>
        </div>
      </div>
    </motion.div>
  );
}
