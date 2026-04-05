import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NeuralBackground from '../components/ThreeScene/NeuralBackground';

const features = [
  {
    icon: '◎',
    title: 'Adaptive Pathways',
    desc: 'Content curated to your exact pace, learning style, and current knowledge gaps.',
  },
  {
    icon: '⬡',
    title: 'Knowledge Mapping',
    desc: 'Visual 3D graphs show topic relationships and how concepts connect.',
  },
  {
    icon: '◈',
    title: 'AI-Powered Insights',
    desc: 'Understands why you learn faster with certain formats and adapts instantly.',
  },
];

const stats = [
  { value: '94%', label: 'Retention rate vs. traditional learning' },
  { value: '3.2×', label: 'Faster skill acquisition on adaptive paths' },
  { value: '47K+', label: 'Active learners on the platform' },
];

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  return (
    <div ref={containerRef} className="relative min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% -20%, #1a0800 0%, #050505 60%)' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <NeuralBackground />

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #050505 80%)' }} />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff6a00' }} />
            <span className="font-mono text-xs tracking-widest" style={{ color: '#ff8c42', letterSpacing: '0.15em' }}>
              ADAPTIVE AI · PERSONALIZED LEARNING
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-extrabold leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontFamily: 'Syne', color: '#f0ece4' }}
          >
            Your Learning.
            <br />
            <span className="text-gradient-orange">Optimized.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#888880', fontFamily: 'DM Sans', fontWeight: 300 }}
          >
            LearnVault's AI engine maps your knowledge graph in real time, surfacing exactly
            the right content at the right moment — so you never waste a minute.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="relative px-8 py-4 rounded-2xl font-semibold text-base overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8c42)', color: '#fff', fontFamily: 'Syne', fontSize: '15px' }}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(255,106,0,0.5), 0 8px 32px rgba(255,106,0,0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="relative z-10">Open Dashboard</span>
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #ff8c42, #ffaa70)' }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
              <span className="relative z-10 ml-2">→</span>
            </motion.button>

            <motion.button
              className="px-8 py-4 rounded-2xl font-medium text-base"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#888880', fontFamily: 'DM Sans' }}
              whileHover={{ borderColor: 'rgba(255,106,0,0.3)', color: '#f0ece4', scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              View Demo
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="font-mono text-xs" style={{ color: '#333330' }}>scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ color: '#333330' }}
            >
              ↓
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#ff6a00', letterSpacing: '0.2em' }}>
            How It Works
          </span>
          <h2 className="font-display font-bold text-4xl mt-3" style={{ color: '#f0ece4', fontFamily: 'Syne' }}>
            Intelligence built into
            <span className="text-gradient-orange"> every session</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="p-6 rounded-2xl group cursor-default transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              whileHover={{ borderColor: 'rgba(255,106,0,0.25)', background: 'rgba(255,106,0,0.04)' }}
            >
              <div className="text-3xl mb-4" style={{ color: '#ff6a00' }}>{f.icon}</div>
              <h3 className="font-display font-semibold text-lg mb-2" style={{ color: '#f0ece4', fontFamily: 'Syne' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#666660', fontFamily: 'DM Sans' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center p-8 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.08), rgba(255,106,0,0.03))', border: '1px solid rgba(255,106,0,0.15)' }}
            >
              <div className="font-display font-extrabold text-5xl mb-2 text-gradient-orange" style={{ fontFamily: 'Syne' }}>
                {s.value}
              </div>
              <div className="text-sm" style={{ color: '#888880', fontFamily: 'DM Sans' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto p-12 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,106,0,0.12), rgba(255,106,0,0.04))', border: '1px solid rgba(255,106,0,0.2)' }}
        >
          <h2 className="font-display font-bold text-3xl mb-4" style={{ color: '#f0ece4', fontFamily: 'Syne' }}>
            Ready to learn smarter?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#888880', fontFamily: 'DM Sans' }}>
            Your personalized dashboard is waiting. AI has already mapped 6 recommendations for you.
          </p>
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-2xl font-semibold text-base"
            style={{ background: 'linear-gradient(135deg, #ff6a00, #ff8c42)', color: '#fff', fontFamily: 'Syne' }}
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(255,106,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
          >
            Open My Dashboard →
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
}
