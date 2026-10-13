import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp, orderBy, limit, onSnapshot
} from 'firebase/firestore';
import {
  Plus, Trash2, Code, Package, Bell, Repeat2, MessageCircle,
  CheckCircle, XCircle, Users, Star, TrendingUp, Edit3, LayoutDashboard,
  Compass, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Avatar, SkeletonCard, EmptyState, Modal, StatCard } from '../components/UI';
import { SKILL_CATEGORIES, PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, timeAgo, getStatusColor } from '../utils/helpers';

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const [newSkill, setNewSkill] = useState({ title: '', description: '', category: 'Web Development', experienceLevel: 'Intermediate', availability: 'Flexible' });
  const [newProduct, setNewProduct] = useState({ title: '', description: '', category: 'Electronics', condition: 'Good', desiredExchange: '', imageURL: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [skillsSnap, productsSnap, sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(collection(db, 'skills'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'products'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'exchanges'), where('senderId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'exchanges'), where('recipientId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(20))),
      ]);
      setSkills(skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Merge and deduplicate
      const all = [...sentSnap.docs, ...receivedSnap.docs].map(d => ({ id: d.id, ...d.data() }));
      const unique = Array.from(new Map(all.map(e => [e.id, e])).values());
      unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setExchanges(unique);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, 'skills'), {
        ...newSkill,
        userId: currentUser.uid,
        userName: userData.displayName,
        userAvatar: userData.avatar || '',
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSkills(prev => [{ id: ref.id, ...newSkill, userId: currentUser.uid }, ...prev]);
      setAddSkillOpen(false);
      setNewSkill({ title: '', description: '', category: 'Web Development', experienceLevel: 'Intermediate', availability: 'Flexible' });
      toast.success('Skill listed successfully!');
    } catch { toast.error('Failed to add skill.'); }
    finally { setSubmitting(false); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, 'products'), {
        ...newProduct,
        userId: currentUser.uid,
        userName: userData.displayName,
        userAvatar: userData.avatar || '',
        status: 'Available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setProducts(prev => [{ id: ref.id, ...newProduct, userId: currentUser.uid }, ...prev]);
      setAddProductOpen(false);
      setNewProduct({ title: '', description: '', category: 'Electronics', condition: 'Good', desiredExchange: '', imageURL: '' });
      toast.success('Product listed successfully!');
    } catch { toast.error('Failed to add product.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Remove this ${type === 'skills' ? 'skill' : 'product'}?`)) return;
    try {
      await deleteDoc(doc(db, type, id));
      if (type === 'skills') setSkills(prev => prev.filter(s => s.id !== id));
      else setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Removed successfully.');
    } catch { toast.error('Failed to remove.'); }
  };

  const handleExchangeAction = async (exchangeId, newStatus) => {
    try {
      await import('firebase/firestore').then(({ updateDoc }) => updateDoc(doc(db, 'exchanges', exchangeId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      }));
      setExchanges(prev => prev.map(e => e.id === exchangeId ? { ...e, status: newStatus } : e));
      toast.success(`Exchange ${newStatus.toLowerCase()}.`);
      if (newStatus === 'Accepted') {
        // Create chat conversation
        const ex = exchanges.find(e => e.id === exchangeId);
        if (ex) {
          const chatRef = await addDoc(collection(db, 'chats'), {
            exchangeId,
            participants: [ex.senderId, ex.recipientId],
            participantNames: { [ex.senderId]: ex.senderName, [ex.recipientId]: ex.recipientName },
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch { toast.error('Action failed.'); }
  };

  const pendingReceived = exchanges.filter(e => e.recipientId === currentUser?.uid && e.status === 'Pending');
  const active = exchanges.filter(e => ['Accepted', 'In Progress'].includes(e.status));
  const completed = exchanges.filter(e => e.status === 'Completed').length;

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Welcome back, {userData?.displayName?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here's what's happening with your exchanges.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/marketplace" className="btn-secondary text-sm">
              <Compass size={16} /> Discover
            </Link>
            <Link to={`/profile/${currentUser?.uid}`} className="btn-ghost text-sm">
              <User size={16} /> Profile
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-black text-slate-900">{skills.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active Skills</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-black text-slate-900">{products.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Listed Products</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-black text-emerald-600">{active.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active Exchanges</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-black text-slate-900">{completed}</p>
            <p className="text-xs text-slate-500 mt-0.5">Completed</p>
          </div>
        </div>

        {/* Onboarding prompt */}
        {!userData?.onboardingComplete && (
          <div className="card p-5 mb-6 border-l-4 border-l-emerald-500 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">Complete your profile</p>
              <p className="text-sm text-slate-500">Add your skills and preferences to get better exchange matches.</p>
            </div>
            <Link to="/onboarding" className="btn-primary text-sm flex-shrink-0">Set up profile</Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Code size={18} className="text-emerald-600" /> My Skills</h2>
              <button onClick={() => setAddSkillOpen(true)} className="btn-primary text-xs py-1.5 px-3">
                <Plus size={14} /> Add
              </button>
            </div>
            {loading ? <SkeletonCard /> : skills.length === 0 ? (
              <div className="card p-6 text-center">
                <Code size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No skills listed yet.</p>
                <button onClick={() => setAddSkillOpen(true)} className="text-emerald-600 text-sm font-medium mt-2 hover:underline">Add your first skill →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {skills.map(skill => (
                  <div key={skill.id} className="card p-4 flex items-start justify-between group">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{skill.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-green text-xs">{skill.category}</span>
                        <span className="badge-slate text-xs">{skill.experienceLevel}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('skills', skill.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Package size={18} className="text-blue-600" /> My Products</h2>
              <button onClick={() => setAddProductOpen(true)} className="btn-primary text-xs py-1.5 px-3">
                <Plus size={14} /> Add
              </button>
            </div>
            {loading ? <SkeletonCard /> : products.length === 0 ? (
              <div className="card p-6 text-center">
                <Package size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No products listed yet.</p>
                <button onClick={() => setAddProductOpen(true)} className="text-emerald-600 text-sm font-medium mt-2 hover:underline">List a product →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map(product => (
                  <div key={product.id} className="card p-4 flex items-start justify-between group">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{product.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-blue text-xs">{product.category}</span>
                        <span className="badge-slate text-xs">{product.condition}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('products', product.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exchanges */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Repeat2 size={18} className="text-amber-600" /> Exchanges
                {pendingReceived.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingReceived.length}</span>
                )}
              </h2>
              <Link to="/exchanges" className="text-xs text-emerald-600 hover:underline">View all →</Link>
            </div>
            {loading ? <SkeletonCard /> : exchanges.length === 0 ? (
              <div className="card p-6 text-center">
                <Repeat2 size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No exchanges yet.</p>
                <Link to="/marketplace" className="text-emerald-600 text-sm font-medium mt-2 hover:underline block">Browse marketplace →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {exchanges.slice(0, 5).map(ex => (
                  <div key={ex.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{ex.offeredTitle || 'Exchange'}</p>
                        <p className="text-xs text-slate-500">
                          {ex.senderId === currentUser.uid ? `→ ${ex.recipientName}` : `← ${ex.senderName}`}
                        </p>
                      </div>
                      <span className={`${getStatusColor(ex.status)} flex-shrink-0`}>{ex.status}</span>
                    </div>
                    {ex.status === 'Pending' && ex.recipientId === currentUser.uid && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleExchangeAction(ex.id, 'Accepted')}
                          className="flex-1 text-xs py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium flex items-center justify-center gap-1 transition-colors">
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => handleExchangeAction(ex.id, 'Rejected')}
                          className="flex-1 text-xs py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center justify-center gap-1 transition-colors">
                          <XCircle size={12} /> Decline
                        </button>
                      </div>
                    )}
                    {ex.status === 'Accepted' && (
                      <Link to="/chat" className="mt-2 text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium">
                        <MessageCircle size={12} /> Open Chat
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card p-5">
          <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Skill', icon: Code, action: () => setAddSkillOpen(true), color: 'emerald' },
              { label: 'List Product', icon: Package, action: () => setAddProductOpen(true), color: 'blue' },
              { label: 'Marketplace', icon: Compass, action: () => navigate('/marketplace'), color: 'amber' },
              { label: 'Community', icon: Users, action: () => navigate('/feed'), color: 'purple' },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="card p-4 flex flex-col items-center gap-2 hover:border-emerald-300 transition-colors group">
                <item.icon size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="Add a Skill">
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="form-label">Skill Title *</label>
            <input className="form-input" placeholder="e.g. React.js Development" value={newSkill.title} onChange={e => setNewSkill(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea className="form-input resize-none" rows={3} placeholder="Describe what you can teach or help with..." value={newSkill.description} onChange={e => setNewSkill(p => ({ ...p, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={newSkill.category} onChange={e => setNewSkill(p => ({ ...p, category: e.target.value }))}>
                {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Level</label>
              <select className="form-input" value={newSkill.experienceLevel} onChange={e => setNewSkill(p => ({ ...p, experienceLevel: e.target.value }))}>
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Availability</label>
            <select className="form-input" value={newSkill.availability} onChange={e => setNewSkill(p => ({ ...p, availability: e.target.value }))}>
              {['Flexible', 'Weekdays', 'Weekends', 'Evenings Only', 'Limited'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddSkillOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <Modal open={addProductOpen} onClose={() => setAddProductOpen(false)} title="List a Product">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="form-label">Product Name *</label>
            <input className="form-input" placeholder="e.g. Mechanical Keyboard" value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea className="form-input resize-none" rows={3} placeholder="Describe the product, its condition, specs..." value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Condition</label>
              <select className="form-input" value={newProduct.condition} onChange={e => setNewProduct(p => ({ ...p, condition: e.target.value }))}>
                {PRODUCT_CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">What you want in exchange</label>
            <input className="form-input" placeholder="e.g. Python tutoring, UI design help" value={newProduct.desiredExchange} onChange={e => setNewProduct(p => ({ ...p, desiredExchange: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Image URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="form-input" placeholder="https://..." value={newProduct.imageURL} onChange={e => setNewProduct(p => ({ ...p, imageURL: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddProductOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'List Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;

