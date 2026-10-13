import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.code === 'auth/user-not-found' ? 'No account found with this email.'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.'
        : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Enter your email first.'); return; }
    setLoading(true);
    try {
      await resetPassword(form.email);
      toast.success('Password reset email sent!');
      setResetMode(false);
    } catch {
      toast.error('Could not send reset email. Check the address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 bg-slate-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-black text-2xl mb-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            Skill<span className="text-emerald-600">Flux</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {resetMode ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {resetMode ? "We'll send you a reset link." : "Sign in to your account."}
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="form-input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {!resetMode && (
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pl-9 pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : resetMode ? 'Send Reset Link' : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => setResetMode(!resetMode)}
              className="text-sm text-emerald-600 hover:underline"
            >
              {resetMode ? '← Back to sign in' : 'Forgot your password?'}
            </button>
            {!resetMode && (
              <p className="text-sm text-slate-500">
                No account?{' '}
                <Link to="/register" className="text-emerald-600 font-semibold hover:underline">Create one →</Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
