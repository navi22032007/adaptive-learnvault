import { motion } from 'framer-motion';
import { useStore } from '../../store';

function BarChart({ data, labels }) {
  if (!data || !labels) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="relative w-full h-full flex items-end">
            <motion.div
              className="w-full rounded-t-sm bg-orange-primary/30 group-hover:bg-orange-primary/50 transition-colors"
              initial={{ height: 0 }}
              animate={{ height: `${(val / max) * 100}%` }}
              transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-[9px] text-text-secondary font-mono uppercase tracking-tighter">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
      <div className="text-[10px] font-mono text-orange-primary uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-display font-bold text-white mb-1">{value}</div>
      <div className="text-[10px] text-text-secondary font-medium">{sub}</div>
    </div>
  );
}

export default function ActivityPanel() {
  const { activityData, userProfile } = useStore();
  
  if (!activityData) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-32 bg-white/5 rounded-3xl" />
      <div className="grid grid-cols-2 gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
      </div>
    </div>
  );

  const data = activityData;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="p-5 rounded-3xl bg-card border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-white">Learning Velocity</h3>
          <div className="px-2 py-1 rounded bg-orange-primary/10 border border-orange-primary/20 text-[10px] text-orange-primary font-mono uppercase tracking-widest">
            Last 7 Days
          </div>
        </div>
        <BarChart data={data.weeklyHours} labels={data.weekLabels} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Current Streak" value={`🔥 ${data.streak}`} sub="Personal best: 18" />
        <StatCard label="XP Points" value={data.xp.toLocaleString()} sub={`Next level at ${data.nextLevelXp}`} />
        <StatCard label="Accuracy" value="84%" sub="Top 5% of learners" />
        <StatCard label="Completion" value={`${data.completionRate}%`} sub={`${data.totalCompleted} units total`} />
      </div>

      <div className="p-5 rounded-3xl bg-orange-primary/5 border border-orange-primary/10">
        <div className="flex justify-between items-end mb-2">
          <div className="text-xs font-medium text-white">Daily Target</div>
          <div className="text-[10px] font-mono text-orange-primary uppercase">{userProfile?.todayProgress}/{userProfile?.todayGoal}m</div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-orange-primary shadow-[0_0_10px_rgba(255,107,0,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((userProfile?.todayProgress / userProfile?.todayGoal) * 100, 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
