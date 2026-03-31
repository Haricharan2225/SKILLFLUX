import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('Account created! Welcome to SkillFlux.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-slate-50 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-600/10 blur-[150px] pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-2 tracking-tight">Join SkillFlux</h2>
          <p className="text-slate-600 font-medium">Start swapping your talents today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={18} />
              <input
                type="text"
                required
                className="w-full bg-white/80 border border-slate-300/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10 transition-all font-medium"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full bg-white/80 border border-slate-300/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10 transition-all font-medium"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" size={18} />
              <input
                type="password"
                required
                className="w-full bg-white/80 border border-slate-300/50 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 h-14 text-lg font-bold glow-effect disabled:opacity-70 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-600 font-medium">
            Already have an account? <Link to="/login" className="text-green-400 hover:text-primary-300 transition-colors font-bold">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
