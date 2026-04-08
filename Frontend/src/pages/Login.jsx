import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-deep">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-card border border-white/5 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome Back</h1>
          <p className="text-text-secondary text-sm">Continue your personalized learning journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-orange-primary uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-primary/50 transition-colors"
              placeholder="arjun@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-orange-primary uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-orange-primary/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 rounded-xl bg-orange-primary text-white font-bold hover:bg-orange-secondary transition-all shadow-lg shadow-orange-primary/20"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-primary hover:underline font-medium">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
