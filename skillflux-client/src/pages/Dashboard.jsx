import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp, limit
} from 'firebase/firestore';
import {
  Plus, Trash2, Code, Package, Repeat2, MessageCircle,
  CheckCircle, XCircle, Users, Star, Sparkles, Compass,
  ArrowRight, ShieldCheck, Zap, Layers, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SkeletonCard, Modal } from '../components/UI';
import {
  SKILL_CATEGORIES, PRODUCT_CATEGORIES, PRODUCT_CONDITIONS,
  getStatusColor, timeAgo, getInitials, getAvatarColor
} from '../utils/helpers';

const LOCAL_SKILLS_KEY = 'skillflux_local_skills';
const LOCAL_PRODUCTS_KEY = 'skillflux_local_products';

const Dashboard = () => {
  const { currentUser, userData, updateUserData } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('skills');

  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const [newSkill, setNewSkill] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    experienceLevel: 'Intermediate',
    availability: 'Flexible'
  });

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    condition: 'Good',
    desiredExchange: '',
    imageURL: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Load from both Firestore and LocalStorage
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Get from LocalStorage
      const localSkillsRaw = localStorage.getItem(`${LOCAL_SKILLS_KEY}_${currentUser.uid}`);
      const localSkills = localSkillsRaw ? JSON.parse(localSkillsRaw) : [];

      const localProductsRaw = localStorage.getItem(`${LOCAL_PRODUCTS_KEY}_${currentUser.uid}`);
      const localProducts = localProductsRaw ? JSON.parse(localProductsRaw) : [];

      // 2. Try Firestore fetch
      let firestoreSkills = [];
      let firestoreProducts = [];
      let firestoreExchanges = [];

      try {
        const [skillsSnap, productsSnap, sentSnap, receivedSnap] = await Promise.all([
          getDocs(query(collection(db, 'skills'), where('userId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'products'), where('userId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'exchanges'), where('senderId', '==', currentUser.uid), limit(50))),
          getDocs(query(collection(db, 'exchanges'), where('recipientId', '==', currentUser.uid), limit(50))),
        ]);

        firestoreSkills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        firestoreProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allEx = [...sentSnap.docs, ...receivedSnap.docs].map(d => ({ id: d.id, ...d.data() }));
        const unique = Array.from(new Map(allEx.map(e => [e.id, e])).values());
        unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        firestoreExchanges = unique;
      } catch (err) {
        console.warn('Firestore load notice:', err.message);
      }

      // Merge and deduplicate
      const combinedSkillsMap = new Map();
      [...localSkills, ...firestoreSkills].forEach(s => combinedSkillsMap.set(s.id || s.title, s));
      const mergedSkills = Array.from(combinedSkillsMap.values());
      mergedSkills.sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
      setSkills(mergedSkills);

      const combinedProductsMap = new Map();
      [...localProducts, ...firestoreProducts].forEach(p => combinedProductsMap.set(p.id || p.title, p));
      const mergedProducts = Array.from(combinedProductsMap.values());
      mergedProducts.sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
      setProducts(mergedProducts);

      setExchanges(firestoreExchanges);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be signed in.');
      return;
    }
    if (!newSkill.title.trim()) {
      toast.error('Please enter a skill title.');
      return;
    }

    setSubmitting(true);
    const displayName = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    const userAvatar = userData?.avatar || currentUser.photoURL || '';
    const tempId = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const skillItem = {
      id: tempId,
      title: newSkill.title.trim(),
      description: newSkill.description.trim(),
      category: newSkill.category || 'Web Development',
      experienceLevel: newSkill.experienceLevel || 'Intermediate',
      availability: newSkill.availability || 'Flexible',
      userId: currentUser.uid,
      userName: displayName,
      userAvatar: userAvatar,
      status: 'Active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 1. Optimistic save to state and LocalStorage immediately
    const updatedSkills = [skillItem, ...skills.filter(s => s.id !== tempId)];
    setSkills(updatedSkills);
    try {
      localStorage.setItem(`${LOCAL_SKILLS_KEY}_${currentUser.uid}`, JSON.stringify(updatedSkills));
      // Save to community skills pool for marketplace discovery
      const commSkills = JSON.parse(localStorage.getItem('skillflux_community_skills') || '[]');
      localStorage.setItem('skillflux_community_skills', JSON.stringify([skillItem, ...commSkills]));
      // Update user profile skillsOffered list
      const curOffered = userData?.skillsOffered || [];
      if (!curOffered.includes(skillItem.title)) {
        updateUserData({ skillsOffered: [...curOffered, skillItem.title] });
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    setAddSkillOpen(false);
    setNewSkill({ title: '', description: '', category: 'Web Development', experienceLevel: 'Intermediate', availability: 'Flexible' });
    toast.success('Skill listed successfully! 🚀');

    // 2. Sync to Firestore in the background
    try {
      const { id: _, ...firestoreData } = skillItem;
      const docRef = await addDoc(collection(db, 'skills'), {
        ...firestoreData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Replace with genuine Firestore ID
      const syncedSkills = updatedSkills.map(s => s.id === tempId ? { ...s, id: docRef.id } : s);
      setSkills(syncedSkills);
      localStorage.setItem(`${LOCAL_SKILLS_KEY}_${currentUser.uid}`, JSON.stringify(syncedSkills));
    } catch (cloudErr) {
      console.info('Cloud sync notice (saved locally):', cloudErr.code || cloudErr.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be signed in.');
      return;
    }
    if (!newProduct.title.trim()) {
      toast.error('Please enter a product name.');
      return;
    }

    setSubmitting(true);
    const displayName = userData?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
    const userAvatar = userData?.avatar || currentUser.photoURL || '';
    const tempId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const productItem = {
      id: tempId,
      title: newProduct.title.trim(),
      description: newProduct.description.trim(),
      category: newProduct.category || 'Electronics',
      condition: newProduct.condition || 'Good',
      desiredExchange: newProduct.desiredExchange.trim() || 'Any skill or product',
      imageURL: newProduct.imageURL.trim(),
      userId: currentUser.uid,
      userName: displayName,
      userAvatar: userAvatar,
      status: 'Available',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 1. Optimistic save to state and LocalStorage
    // 1. Optimistic save to state and LocalStorage immediately
    const updatedProducts = [productItem, ...products.filter(p => p.id !== tempId)];
    setProducts(updatedProducts);
    try {
      localStorage.setItem(`${LOCAL_PRODUCTS_KEY}_${currentUser.uid}`, JSON.stringify(updatedProducts));
      // Save to community products pool for marketplace discovery
      const commProds = JSON.parse(localStorage.getItem('skillflux_community_products') || '[]');
      localStorage.setItem('skillflux_community_products', JSON.stringify([productItem, ...commProds]));
      // Update profile
      const curOffered = userData?.productsOffered || [];
      if (!curOffered.includes(productItem.title)) {
        updateUserData({ productsOffered: [...curOffered, productItem.title] });
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }

    setAddProductOpen(false);
    setNewProduct({ title: '', description: '', category: 'Electronics', condition: 'Good', desiredExchange: '', imageURL: '' });
    toast.success('Product listed successfully! 📦');

    // 2. Sync to Firestore in the background
    try {
      const { id: _, ...firestoreData } = productItem;
      const docRef = await addDoc(collection(db, 'products'), {
        ...firestoreData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const syncedProducts = updatedProducts.map(p => p.id === tempId ? { ...p, id: docRef.id } : p);
      setProducts(syncedProducts);
      localStorage.setItem(`${LOCAL_PRODUCTS_KEY}_${currentUser.uid}`, JSON.stringify(syncedProducts));
    } catch (cloudErr) {
      console.info('Cloud sync notice (saved locally):', cloudErr.code || cloudErr.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Remove this ${type === 'skills' ? 'skill' : 'product'}?`)) return;
    try {
      if (type === 'skills') {
        const next = skills.filter(s => s.id !== id);
        setSkills(next);
        localStorage.setItem(`${LOCAL_SKILLS_KEY}_${currentUser.uid}`, JSON.stringify(next));
        const commSkills = JSON.parse(localStorage.getItem('skillflux_community_skills') || '[]');
        localStorage.setItem('skillflux_community_skills', JSON.stringify(commSkills.filter(s => s.id !== id)));
      } else {
        const next = products.filter(p => p.id !== id);
        setProducts(next);
        localStorage.setItem(`${LOCAL_PRODUCTS_KEY}_${currentUser.uid}`, JSON.stringify(next));
        const commProds = JSON.parse(localStorage.getItem('skillflux_community_products') || '[]');
        localStorage.setItem('skillflux_community_products', JSON.stringify(commProds.filter(p => p.id !== id)));
      }
      // Try Firestore delete
      try { await deleteDoc(doc(db, type, id)); } catch (_) {}
      toast.success('Removed successfully.');
    } catch {
      toast.error('Failed to remove.');
    }
  };

  const displayName = userData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Member';
  const pendingReceived = exchanges.filter(e => e.recipientId === currentUser?.uid && e.status === 'Pending');
  const activeExchanges = exchanges.filter(e => ['Accepted', 'In Progress'].includes(e.status));
  const completedExchanges = exchanges.filter(e => e.status === 'Completed').length;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Hero Banner Bento */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 md:p-10 mb-8 shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 ${getAvatarColor(currentUser?.uid || '')} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/20 flex-shrink-0`}>
                {userData?.avatar
                  ? <img src={userData.avatar} className="w-full h-full rounded-2xl object-cover" alt="" />
                  : getInitials(displayName)
                }
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck size={12} /> Verified Trader
                  </span>
                </div>
                <p className="text-slate-300 text-sm">
                  {userData?.location ? `📍 ${userData.location} · ` : ''}Zero-Money Barter Member
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setAddSkillOpen(true)}
                className="btn-primary py-3 px-5 text-sm flex-1 sm:flex-initial"
              >
                <Plus size={16} /> List Skill
              </button>
              <button
                onClick={() => setAddProductOpen(true)}
                className="btn-secondary py-3 px-5 text-sm flex-1 sm:flex-initial"
              >
                <Package size={16} /> List Product
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Skills Offered</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">{skills.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Products Listed</p>
              <p className="text-2xl sm:text-3xl font-black text-teal-300 mt-0.5">{products.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Swaps</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">{activeExchanges.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{completedExchanges}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200/80 mb-6">
          <div className="flex gap-2">
            {[
              { id: 'skills', label: 'My Skills', icon: Code, count: skills.length },
              { id: 'products', label: 'My Products', icon: Package, count: products.length },
              { id: 'exchanges', label: 'Exchange Requests', icon: Repeat2, count: pendingReceived.length, alert: pendingReceived.length > 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 px-3 sm:px-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-emerald-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  tab.alert
                    ? 'bg-rose-500 text-white animate-pulse'
                    : activeTab === tab.id
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                  />
                )}
              </button>
            ))}
          </div>

          <Link
            to="/marketplace"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Explore Marketplace <ArrowRight size={14} />
          </Link>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* SKILLS TAB */}
            {activeTab === 'skills' && (
              skills.length === 0 ? (
                <div className="card p-12 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <Code size={30} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No skills listed yet</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    What can you teach or help with? Coding, design, tutoring, language practice, or video editing?
                  </p>
                  <button onClick={() => setAddSkillOpen(true)} className="btn-primary mx-auto">
                    <Plus size={16} /> Add Your First Skill
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {skills.map(skill => (
                    <motion.div
                      layout
                      key={skill.id}
                      className="card-interactive p-6 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className="badge-green">{skill.category}</span>
                          <span className="badge-slate">{skill.experienceLevel}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">
                          {skill.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                          {skill.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-slate-400" /> {skill.availability}
                        </span>
                        <button
                          onClick={() => handleDelete('skills', skill.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              products.length === 0 ? (
                <div className="card p-12 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                    <Package size={30} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No products listed yet</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    List a book, electronics, accessories, or equipment you want to trade for useful skills.
                  </p>
                  <button onClick={() => setAddProductOpen(true)} className="btn-primary mx-auto">
                    <Plus size={16} /> List a Product
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(product => (
                    <motion.div
                      layout
                      key={product.id}
                      className="card-interactive overflow-hidden flex flex-col justify-between group"
                    >
                      {product.imageURL ? (
                        <div className="h-44 w-full overflow-hidden bg-slate-100">
                          <img
                            src={product.imageURL}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="h-28 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center justify-center border-b border-slate-100">
                          <Package size={32} className="text-teal-400/80" />
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="badge-blue">{product.category}</span>
                            <span className="badge-slate">{product.condition}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">
                            {product.title}
                          </h3>
                          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-3">
                            {product.description}
                          </p>
                          {product.desiredExchange && (
                            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-4">
                              <strong className="text-slate-700">Wants:</strong> {product.desiredExchange}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="text-emerald-700 font-semibold">{product.status || 'Available'}</span>
                          <button
                            onClick={() => handleDelete('products', product.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* EXCHANGES TAB */}
            {activeTab === 'exchanges' && (
              exchanges.length === 0 ? (
                <div className="card p-12 text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                    <Repeat2 size={30} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No exchange requests yet</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Browse the marketplace and propose an exchange to connect with other members.
                  </p>
                  <Link to="/marketplace" className="btn-primary mx-auto">
                    <Compass size={16} /> Explore Marketplace
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {exchanges.map(ex => (
                    <div key={ex.id} className="card-interactive p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {ex.senderId === currentUser.uid ? `Offer to ${ex.recipientName}` : `Request from ${ex.senderName}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{timeAgo(ex.createdAt)}</p>
                        </div>
                        <span className={getStatusColor(ex.status)}>{ex.status}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 mb-3 flex items-center gap-2">
                        <span className="font-semibold">{ex.offeredTitle || 'Offer'}</span>
                        <Repeat2 size={13} className="text-emerald-500" />
                        <span className="font-semibold">{ex.requestedTitle || 'Requirement'}</span>
                      </div>
                      {ex.status === 'Accepted' && (
                        <Link to={`/chat`} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                          <MessageCircle size={14} /> Open Conversation
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modern Add Skill Modal */}
      <Modal open={addSkillOpen} onClose={() => setAddSkillOpen(false)} title="List a Skill for Exchange">
        <form onSubmit={handleAddSkill} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Quick Presets (Click to autofill)</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { title: 'Full-Stack React & Node', cat: 'Web Development', desc: 'Offering frontend React UI building and backend Node.js API development.' },
                { title: 'Python & Data Automation', cat: 'Java & Python', desc: 'Can teach Python scripting, pandas data analysis, and automation.' },
                { title: 'UI/UX & Figma Design', cat: 'UI/UX Design', desc: 'Designing modern responsive web and mobile interfaces in Figma.' },
                { title: 'English Fluency & Speaking', cat: 'Language Learning', desc: 'Conversational English practice, pronunciation coaching, and interview prep.' },
                { title: 'Video Editing & Premiere', cat: 'Video Editing', desc: 'Editing short-form Reels/TikToks or long-form YouTube videos.' },
              ].map(p => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setNewSkill(prev => ({ ...prev, title: p.title, category: p.cat, description: p.desc }))}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  ⚡ {p.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Skill Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Full-Stack React & Node Development"
              value={newSkill.title}
              onChange={e => setNewSkill(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="form-label">What can you teach or help with? *</label>
            <textarea
              className="form-input resize-none"
              rows={3}
              placeholder="Describe your expertise, what projects you can help build, and what you're open to teaching..."
              value={newSkill.description}
              onChange={e => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={newSkill.category}
                onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
              >
                {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Experience Level</label>
              <select
                className="form-input"
                value={newSkill.experienceLevel}
                onChange={e => setNewSkill(prev => ({ ...prev, experienceLevel: e.target.value }))}
              >
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Availability</label>
            <select
              className="form-input"
              value={newSkill.availability}
              onChange={e => setNewSkill(prev => ({ ...prev, availability: e.target.value }))}
            >
              {['Flexible', 'Weekdays', 'Weekends', 'Evenings Only', 'Limited'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAddSkillOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Listing...' : 'List Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modern List Product Modal */}
      <Modal open={addProductOpen} onClose={() => setAddProductOpen(false)} title="List a Product for Exchange">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div>
            <label className="form-label">Product Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Keychron Mechanical Keyboard"
              value={newProduct.title}
              onChange={e => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="form-label">Description & Condition details *</label>
            <textarea
              className="form-input resize-none"
              rows={3}
              placeholder="Provide item specs, usage history, and condition..."
              value={newProduct.description}
              onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={newProduct.category}
                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
              >
                {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Condition</label>
              <select
                className="form-input"
                value={newProduct.condition}
                onChange={e => setNewProduct(prev => ({ ...prev, condition: e.target.value }))}
              >
                {PRODUCT_CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">What do you want in exchange?</label>
            <input
              className="form-input"
              placeholder="e.g. Python backend guidance, UI design help"
              value={newProduct.desiredExchange}
              onChange={e => setNewProduct(prev => ({ ...prev, desiredExchange: e.target.value }))}
            />
          </div>

          <div>
            <label className="form-label">Photo Image URL (Optional)</label>
            <input
              className="form-input"
              placeholder="https://images.unsplash.com/..."
              value={newProduct.imageURL}
              onChange={e => setNewProduct(prev => ({ ...prev, imageURL: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setAddProductOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Listing...' : 'List Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
