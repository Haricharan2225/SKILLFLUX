import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getInitials, getAvatarColor } from '../utils/helpers';
import {
  Home, Compass, Repeat2, Package, Users, MessageCircle,
  Bell, LayoutDashboard, User, Settings, LogOut, Menu, X,
  ChevronDown, Zap, Plus
} from 'lucide-react';

const NavLink = ({ to, icon: Icon, label, badge, onClick }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

const Navbar = () => {
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, snap => setUnreadNotif(snap.size));
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setProfileOpen(false);
  };

  const navLinks = currentUser ? [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/marketplace', icon: Compass, label: 'Discover' },
    { to: '/exchanges', icon: Repeat2, label: 'Exchanges' },
    { to: '/chat', icon: MessageCircle, label: 'Messages', badge: unreadMsg },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotif },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ] : [];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-2 font-black text-xl text-slate-900">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span>Skill<span className="text-emerald-600">Flux</span></span>
        </Link>

        {/* Desktop Nav */}
        {currentUser && (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink key={link.to} {...link} />
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {/* Quick Add Skill button */}
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex btn-primary text-xs py-1.5 px-3 rounded-lg shadow-xs"
                title="Add a new skill"
              >
                <Plus size={14} /> Add Skill
              </Link>

              {/* Notification bell (mobile) */}
              <Link to="/notifications" className="lg:hidden relative p-2 hover:bg-slate-100 rounded-lg">
                <Bell size={20} className="text-slate-600" />
                {unreadNotif > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(currentUser.uid)}`}>
                    {userData?.avatar
                      ? <img src={userData.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : getInitials(userData?.displayName)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {userData?.displayName}
                  </span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{userData?.displayName}</p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to={`/profile/${currentUser.uid}`} onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <User size={16} /> My Profile
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Settings size={16} /> Settings
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50">
                          <LayoutDashboard size={16} /> Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 py-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && currentUser && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <NavLink key={link.to} {...link} onClick={() => setMenuOpen(false)} />
          ))}
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
            <NavLink to={`/profile/${currentUser.uid}`} icon={User} label="My Profile" onClick={() => setMenuOpen(false)} />
            <NavLink to="/settings" icon={Settings} label="Settings" onClick={() => setMenuOpen(false)} />
            {isAdmin && <NavLink to="/admin" icon={LayoutDashboard} label="Admin Panel" onClick={() => setMenuOpen(false)} />}
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
