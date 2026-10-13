import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

const Register = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords don't match."); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (!form.name.trim()) { toast.error('Please enter your name.'); return; }
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name.trim());
      toast.success('Account created! Let\'s set up your profile.');
      navigate('/onboarding');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered.'
        : err.code === 'auth/invalid-email' ? 'Invalid email address.'
        : err.code === 'auth/weak-password' ? 'Password is too weak.'
        : 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 bg-slate-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-black text-2xl mb-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            Skill<span className="text-emerald-600">Flux</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start exchanging skills and products — free.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Your Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="form-input pl-9"
                  placeholder="Aarav Sharma"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-9 pr-10"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className={`form-input pl-9 ${form.confirm && form.confirm !== form.password ? 'border-red-400' : ''}`}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match.</p>
              )}
            </div>

            <p className="text-xs text-slate-500">
              By signing up you agree to our{' '}
              <span className="text-emerald-600 cursor-pointer hover:underline">Terms of Service</span> and{' '}
              <span className="text-emerald-600 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
