import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, ShoppingBag, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-50/50 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 bg-green-600 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img src="/logo.png" alt="SkillFlux" className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-2xl font-bold gradient-text tracking-tight">SkillFlux</span>
        </Link>
        
        <div className="flex items-center gap-6">
          {currentUser ? (
            <>
              <Link to="/marketplace" className="flex items-center gap-2 text-slate-600 hover:text-green-400 transition-colors">
                <ShoppingBag size={20} />
                <span className="hidden md:inline font-medium">Marketplace</span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-green-400 transition-colors">
                <LayoutDashboard size={20} />
                <span className="hidden md:inline font-medium">Dashboard</span>
              </Link>
              {userData?.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 text-slate-600 hover:text-amber-400 transition-colors">
                  <ShieldCheck size={20} />
                  <span className="hidden md:inline font-medium">Admin</span>
                </Link>
              )}
              <div className="h-6 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-slate-700">{userData?.displayName}</span>
                  <span className="text-xs text-slate-500 capitalize">{userData?.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-200 transition-all active:scale-95"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium">Login</Link>
              <Link to="/register" className="btn-primary py-2 px-5 text-sm h-10">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
