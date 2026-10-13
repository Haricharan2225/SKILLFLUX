import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Exchanges from './pages/Exchanges';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import AIChatbot from './components/AIChatbot';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, userData, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && userData?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontWeight: '500' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <AIChatbot />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/exchanges" element={<ProtectedRoute><Exchanges /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile/:uid" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
