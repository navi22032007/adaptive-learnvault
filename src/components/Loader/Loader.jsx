import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

export default function Loader({ onComplete }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState(0); // 0: loading, 1: done
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Neural network particles
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const originalPositions = new Float32Array(particleCount * 3);

    // Brain-like sphere distribution
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + (Math.random() - 0.5) * 1.2;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.75;
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.005,
        vy: (Math.random() - 0.5) * 0.005,
        vz: (Math.random() - 0.5) * 0.005,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x0891b2,
      size: 0.025,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connection lines (sparse)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });

    const linePositions = [];
    for (let i = 0; i < 120; i++) {
      const a = Math.floor(Math.random() * particleCount);
      const b = Math.floor(Math.random() * particleCount);
      linePositions.push(
        originalPositions[a * 3], originalPositions[a * 3 + 1], originalPositions[a * 3 + 2],
        originalPositions[b * 3], originalPositions[b * 3 + 1], originalPositions[b * 3 + 2],
      );
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lines = new THREE.LineSegments(lineGeo, lineMaterial);
    scene.add(lines);

    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.008;

      particles.rotation.y += 0.002;
      particles.rotation.x += 0.0005;

      // Mouse influence
      particles.rotation.y += mouseRef.current.x * 0.002;
      particles.rotation.x += mouseRef.current.y * 0.001;

      // Pulse
      const scale = 1 + Math.sin(t) * 0.04;
      particles.scale.set(scale, scale, scale);
      lines.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };
    animate();

    // Progress simulation
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 8 + 2;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setTimeout(() => setPhase(1), 500);
      }
      setProgress(Math.floor(prog));
    }, 120);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (phase === 1) {
      setTimeout(() => onComplete?.(), 1000);
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {phase === 0 && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(234,249,249,0.9) 0.1%, rgba(239,249,251,0.95) 90.1%)', backgroundColor: '#eef9fb' }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.4)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#0891b2" strokeWidth="1.5" fill="none"/>
                    <circle cx="8" cy="8" r="2" fill="#0891b2"/>
                  </svg>
                </div>
                <span className="font-display text-sm font-semibold tracking-widest uppercase" style={{ color: 'rgba(8,145,178,0.9)', letterSpacing: '0.2em' }}>
                  LearnVault
                </span>
              </div>

              <h1 className="font-display text-4xl font-bold mb-2" style={{ color: '#0f1f22' }}>
                Analyzing Learning
                <br />
                <span className="text-gradient-orange">Patterns…</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-64"
            >
              <div className="flex justify-between mb-2">
                <span className="font-mono text-xs" style={{ color: 'rgba(8,145,178,0.7)' }}>Initializing AI engine</span>
                <span className="font-mono text-xs" style={{ color: 'rgba(8,145,178,0.9)' }}>{progress}%</span>
              </div>
              <div className="h-px w-full rounded-full" style={{ background: 'rgba(8,145,178,0.15)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4)', boxShadow: '0 0 8px rgba(8,145,178,0.5)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                {['Profiling…', 'Mapping paths…', 'Calibrating…'].map((msg, i) => (
                  <motion.span
                    key={msg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: progress > (i + 1) * 25 ? 1 : 0.2 }}
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2', border: '1px solid rgba(8,145,178,0.2)' }}
                  >
                    {msg}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
