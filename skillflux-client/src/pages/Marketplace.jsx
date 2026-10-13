import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, getDocs, addDoc, serverTimestamp,
  where, orderBy, limit
} from 'firebase/firestore';
import {
  Search, Filter, Code, Package, Users, Sparkles,
  Send, MapPin, Star, ChevronDown, X, BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Avatar, SkeletonCard, EmptyState, Modal } from '../components/UI';
import {
  SKILL_CATEGORIES, PRODUCT_CATEGORIES, PRODUCT_CONDITIONS,
  EXPERIENCE_LEVELS, EXCHANGE_TYPES, calculateMatchScore,
  getStatusColor, timeAgo, getInitials, getAvatarColor
} from '../utils/helpers';

const TABS = ['Skills', 'Products', 'Members'];

const Marketplace = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Skills');
  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [exchangeModal, setExchangeModal] = useState(null);
  const [mySkills, setMySkills] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [proposal, setProposal] = useState({ offeredType: 'Skill', offeredId: '', offeredTitle: '', description: '', exchangeType: 'Skill for Skill' });
  const [sending, setSending] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [skillsSnap, productsSnap, usersSnap, mySkillsSnap, myProductsSnap] = await Promise.all([
        getDocs(query(collection(db, 'skills'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'products'), where('status', '==', 'Available'), orderBy('createdAt', 'desc'), limit(50))),
        getDocs(query(collection(db, 'users'), limit(50))),
        getDocs(query(collection(db, 'skills'), where('userId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'products'), where('userId', '==', currentUser.uid))),
      ]);

      const allSkills = skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.userId !== currentUser.uid);
      const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.userId !== currentUser.uid);
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.uid !== currentUser.uid && !u.isDemo);
      const ms = mySkillsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const mp = myProductsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setMySkills(ms);
      setMyProducts(mp);

      // Add demo items if empty
      const finalSkills = allSkills.length > 0 ? allSkills : DEMO_SKILLS;
      const finalProducts = allProducts.length > 0 ? allProducts : DEMO_PRODUCTS;
      const finalUsers = allUsers.length > 0 ? allUsers : DEMO_USERS;

      setSkills(finalSkills);
      setProducts(finalProducts);
      setMembers(finalUsers);

      // Compute smart matches
      const myOffered = [...ms.map(s => s.title), ...mp.map(p => p.title)].join(' ');
      const myWanted = [...(userData?.skillsWanted || []), ...(userData?.productsWanted || [])].join(' ');

      const skillMatches = finalSkills.map(s => ({
        ...s, _type: 'Skill',
        _score: calculateMatchScore(s.title + ' ' + (s.description || ''), myWanted || myOffered)
      })).filter(s => s._score > 10);

      const productMatches = finalProducts.map(p => ({
        ...p, _type: 'Product',
        _score: calculateMatchScore(p.desiredExchange || '', myOffered)
      })).filter(p => p._score > 10);

      const combined = [...skillMatches, ...productMatches]
        .sort((a, b) => b._score - a._score)
        .slice(0, 4);

      setMatches(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, userData]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!exchangeModal) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'exchanges'), {
        senderId: currentUser.uid,
        senderName: userData.displayName,
        recipientId: exchangeModal.userId || exchangeModal.uid,
        recipientName: exchangeModal.userName || exchangeModal.displayName,
        offeredType: proposal.offeredType,
        offeredId: proposal.offeredId,
        offeredTitle: proposal.offeredTitle,
        requestedId: exchangeModal.id,
        requestedTitle: exchangeModal.title,
        requestedType: exchangeModal._type || (activeTab === 'Skills' ? 'Skill' : 'Product'),
        exchangeType: proposal.exchangeType,
        description: proposal.description,
        status: 'Pending',
        senderConfirmed: false,
        recipientConfirmed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        recipientId: exchangeModal.userId || exchangeModal.uid,
        actorId: currentUser.uid,
        actorName: userData.displayName,
        type: 'exchange_request',
        message: `${userData.displayName} sent you an exchange proposal`,
        read: false,
        createdAt: serverTimestamp(),
      });

      toast.success('Exchange proposal sent!');
      setExchangeModal(null);
      setProposal({ offeredType: 'Skill', offeredId: '', offeredTitle: '', description: '', exchangeType: 'Skill for Skill' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send proposal.');
    } finally {
      setSending(false);
    }
  };

  const filteredSkills = skills.filter(s => {
    const search = searchTerm.toLowerCase();
    return (s.title?.toLowerCase().includes(search) || s.description?.toLowerCase().includes(search)) &&
      (categoryFilter === 'All' || s.category === categoryFilter);
  });

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return (p.title?.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search)) &&
      (categoryFilter === 'All' || p.category === categoryFilter) &&
      (conditionFilter === 'All' || p.condition === conditionFilter);
  });

  const filteredMembers = members.filter(m => {
    const search = searchTerm.toLowerCase();
    return m.displayName?.toLowerCase().includes(search) ||
      m.skillsOffered?.some(s => s.toLowerCase().includes(search));
  });

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Discover & Exchange</h1>
          <p className="text-slate-500 text-sm mt-1">Browse skills, products, and community members.</p>
        </div>

        {/* Smart Matches */}
        {matches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-amber-500" />
              <h2 className="font-bold text-slate-900">Best Matches for You</h2>
              <span className="badge-amber">Smart Match</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {matches.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="card p-4 border-l-4 border-l-amber-400 relative">
                  <div className="absolute top-2 right-2 badge-amber text-xs">{item._score}% match</div>
                  <span className={`text-xs font-medium ${item._type === 'Skill' ? 'text-emerald-600' : 'text-blue-600'}`}>{item._type}</span>
                  <p className="font-semibold text-slate-900 text-sm mt-1 pr-12 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.userName}</p>
                  <button onClick={() => setExchangeModal(item)} className="mt-2 w-full btn-primary text-xs py-1.5">
                    Propose Exchange
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                {tab === 'Skills' && <Code size={14} />}
                {tab === 'Products' && <Package size={14} />}
                {tab === 'Members' && <Users size={14} />}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className="form-input pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex-shrink-0 ${showFilters ? 'border-emerald-300' : ''}`}>
            <Filter size={15} /> Filters
            {(categoryFilter !== 'All' || conditionFilter !== 'All') && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-5 flex flex-wrap gap-4">
            <div>
              <label className="form-label text-xs">Category</label>
              <select className="form-input text-sm py-2" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option>All</option>
                {(activeTab === 'Skills' ? SKILL_CATEGORIES : PRODUCT_CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {activeTab === 'Products' && (
              <div>
                <label className="form-label text-xs">Condition</label>
                <select className="form-input text-sm py-2" value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
                  <option>All</option>
                  {PRODUCT_CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            {(categoryFilter !== 'All' || conditionFilter !== 'All') && (
              <button onClick={() => { setCategoryFilter('All'); setConditionFilter('All'); }}
                className="self-end text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {activeTab === 'Skills' && (
              filteredSkills.length === 0
                ? <EmptyState icon={Code} title="No skills found" description="Try a different search or category filter." />
                : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSkills.map((skill, i) => (
                      <motion.div key={skill.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="card p-5 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <span className="badge-green text-xs">{skill.category}</span>
                          <span className="badge-slate text-xs">{skill.experienceLevel}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{skill.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{skill.description}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <Link to={`/profile/${skill.userId}`} className="flex items-center gap-2 hover:opacity-80">
                            <div className={`w-7 h-7 ${getAvatarColor(skill.userId)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                              {getInitials(skill.userName)}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{skill.userName}</span>
                          </Link>
                          {skill.userId !== currentUser.uid && (
                            <button onClick={() => setExchangeModal({ ...skill, _type: 'Skill' })} className="btn-primary text-xs py-1.5 px-3">
                              <Send size={12} /> Propose
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
            )}

            {activeTab === 'Products' && (
              filteredProducts.length === 0
                ? <EmptyState icon={Package} title="No products found" description="Try a different search or filter." />
                : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product, i) => (
                      <motion.div key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="card flex flex-col overflow-hidden">
                        {product.imageURL ? (
                          <img src={product.imageURL} alt={product.title} className="h-40 w-full object-cover" onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div className="h-40 bg-slate-100 flex items-center justify-center">
                            <Package size={32} className="text-slate-300" />
                          </div>
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="badge-blue text-xs">{product.category}</span>
                            <span className="badge-slate text-xs">{product.condition}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 mb-1">{product.title}</h3>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-3 flex-1">{product.description}</p>
                          {product.desiredExchange && (
                            <p className="text-xs text-slate-500 mb-3">
                              <span className="font-medium">Wants:</span> {product.desiredExchange}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <Link to={`/profile/${product.userId}`} className="flex items-center gap-2 hover:opacity-80">
                              <div className={`w-7 h-7 ${getAvatarColor(product.userId)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                {getInitials(product.userName)}
                              </div>
                              <span className="text-xs font-medium text-slate-700">{product.userName}</span>
                            </Link>
                            {product.userId !== currentUser.uid && (
                              <button onClick={() => setExchangeModal({ ...product, _type: 'Product' })} className="btn-primary text-xs py-1.5 px-3">
                                <Send size={12} /> Propose
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
            )}

            {activeTab === 'Members' && (
              filteredMembers.length === 0
                ? <EmptyState icon={Users} title="No members found" />
                : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member, i) => (
                      <motion.div key={member.id || member.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="card p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 ${getAvatarColor(member.uid || member.id)} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                            {member.avatar
                              ? <img src={member.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                              : getInitials(member.displayName)
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{member.displayName}</p>
                            <p className="text-xs text-slate-500">{member.location || 'Community Member'}</p>
                          </div>
                        </div>
                        {member.bio && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{member.bio}</p>}
                        {(member.skillsOffered?.length > 0) && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-slate-500 mb-1.5">Offers</p>
                            <div className="flex flex-wrap gap-1">
                              {member.skillsOffered.slice(0, 3).map(s => <span key={s} className="badge-green text-xs">{s}</span>)}
                              {member.skillsOffered.length > 3 && <span className="badge-slate text-xs">+{member.skillsOffered.length - 3}</span>}
                            </div>
                          </div>
                        )}
                        <Link to={`/profile/${member.uid || member.id}`}
                          className="btn-secondary w-full text-xs py-2">
                          View Profile
                        </Link>
                      </motion.div>
                    ))}
                  </div>
            )}
          </>
        )}
      </div>

      {/* Exchange Proposal Modal */}
      <Modal open={!!exchangeModal} onClose={() => setExchangeModal(null)} title="Propose an Exchange">
        {exchangeModal && (
          <form onSubmit={handlePropose} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-0.5">You're proposing for:</p>
              <p className="font-semibold text-slate-900">{exchangeModal.title}</p>
              <p className="text-xs text-slate-500">by {exchangeModal.userName || exchangeModal.displayName}</p>
            </div>

            <div>
              <label className="form-label">Exchange Type</label>
              <select className="form-input" value={proposal.exchangeType} onChange={e => setProposal(p => ({ ...p, exchangeType: e.target.value }))}>
                {EXCHANGE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">What you're offering</label>
              <select className="form-input" onChange={e => {
                const val = e.target.value;
                if (val === '') { setProposal(p => ({ ...p, offeredId: '', offeredTitle: '', offeredType: 'Skill' })); return; }
                const [type, id, ...titleParts] = val.split('|');
                setProposal(p => ({ ...p, offeredType: type, offeredId: id, offeredTitle: titleParts.join('|') }));
              }}>
                <option value="">Select what you offer...</option>
                {mySkills.length > 0 && <optgroup label="My Skills">
                  {mySkills.map(s => <option key={s.id} value={`Skill|${s.id}|${s.title}`}>{s.title} (Skill)</option>)}
                </optgroup>}
                {myProducts.length > 0 && <optgroup label="My Products">
                  {myProducts.map(p => <option key={p.id} value={`Product|${p.id}|${p.title}`}>{p.title} (Product)</option>)}
                </optgroup>}
              </select>
              {mySkills.length === 0 && myProducts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">⚠ Add skills or products in your dashboard first.</p>
              )}
            </div>

            <div>
              <label className="form-label">Proposal message</label>
              <textarea className="form-input resize-none" rows={3}
                placeholder="Describe the exchange in detail. What do you propose? When can you start?"
                value={proposal.description} onChange={e => setProposal(p => ({ ...p, description: e.target.value }))}
                required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setExchangeModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={sending || (!proposal.offeredId)} className="btn-primary flex-1">
                {sending ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={14} /> Send Proposal</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// Demo data for empty state
const DEMO_SKILLS = [
  { id: 'd_s1', title: 'React.js Development', category: 'Web Development', experienceLevel: 'Advanced', userId: 'demo1', userName: 'Aarav Sharma', description: 'Building modern web apps with React, hooks, and TypeScript.', status: 'Active' },
  { id: 'd_s2', title: 'UI/UX Design (Figma)', category: 'UI/UX Design', experienceLevel: 'Advanced', userId: 'demo2', userName: 'Priya Reddy', description: 'Creating beautiful, user-centered interfaces using Figma.', status: 'Active' },
  { id: 'd_s3', title: 'Python Programming', category: 'Java & Python', experienceLevel: 'Intermediate', userId: 'demo3', userName: 'Rahul Verma', description: 'Python scripting, automation, and data processing.', status: 'Active' },
  { id: 'd_s4', title: 'Digital Marketing', category: 'Digital Marketing', experienceLevel: 'Expert', userId: 'demo6', userName: 'Sneha Rao', description: 'SEO, social media strategy, and growth hacking.', status: 'Active' },
  { id: 'd_s5', title: 'Video Editing (Premiere)', category: 'Video Editing', experienceLevel: 'Intermediate', userId: 'demo5', userName: 'Kiran Kumar', description: 'Professional video editing for YouTube and social media.', status: 'Active' },
  { id: 'd_s6', title: 'Java Development', category: 'Java & Python', experienceLevel: 'Advanced', userId: 'demo8', userName: 'Neha Singh', description: 'Spring Boot, microservices, and backend development.', status: 'Active' },
];

const DEMO_PRODUCTS = [
  { id: 'd_p1', title: 'Mechanical Keyboard', category: 'Keyboards & Mice', condition: 'Like New', userId: 'demo9', userName: 'Rohan Das', description: 'Cherry MX Blue switches, RGB backlit. Barely used.', desiredExchange: 'Python tutoring or web dev help', status: 'Available' },
  { id: 'd_p2', title: 'Sony WH-1000XM4 Headphones', category: 'Audio & Headphones', condition: 'Good', userId: 'demo10', userName: 'Meera Nair', description: 'Industry-leading noise cancellation. Perfect condition.', desiredExchange: 'Any academic tutoring', imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', status: 'Available' },
  { id: 'd_p3', title: 'Drawing Tablet (Wacom)', category: 'Art Supplies', condition: 'Good', userId: 'demo4', userName: 'Ananya Patel', description: 'Wacom Intuos Medium. Great for digital art and design.', desiredExchange: 'Photography lessons', status: 'Available' },
  { id: 'd_p4', title: 'Python Programming Book (3rd Ed)', category: 'Books & Education', condition: 'Like New', userId: 'demo3', userName: 'Rahul Verma', description: 'Learning Python by Mark Lutz. Comprehensive 1600-page reference.', desiredExchange: 'Web development mentoring', status: 'Available' },
  { id: 'd_p5', title: 'Tripod (Joby GorillaPod)', category: 'Photography Gear', condition: 'New', userId: 'demo7', userName: 'Arjun Mehta', description: 'Flexible tripod for photography and videography.', desiredExchange: 'Graphic design lessons', status: 'Available' },
  { id: 'd_p6', title: 'Wireless Mouse (Logitech MX)', category: 'Keyboards & Mice', condition: 'Like New', userId: 'demo11', userName: 'Vikram Joshi', description: 'Logitech MX Master 3. Multi-device support, excellent for work.', desiredExchange: 'Python or data science mentoring', status: 'Available' },
];

const DEMO_USERS = [
  { uid: 'demo1', displayName: 'Aarav Sharma', bio: 'React developer offering mentoring in exchange for UI/UX lessons.', skillsOffered: ['React.js', 'TypeScript'], skillsWanted: ['UI/UX Design'] },
  { uid: 'demo2', displayName: 'Priya Reddy', bio: 'UI/UX designer wanting to learn frontend development.', skillsOffered: ['Figma', 'UI Design'], skillsWanted: ['React.js'] },
  { uid: 'demo4', displayName: 'Ananya Patel', bio: 'Graphic designer exchanging skills and a drawing tablet.', skillsOffered: ['Graphic Design', 'Illustrator'], skillsWanted: ['Photography'] },
  { uid: 'demo5', displayName: 'Kiran Kumar', bio: 'Video editor wanting digital marketing knowledge.', skillsOffered: ['Video Editing', 'Premiere Pro'], skillsWanted: ['Digital Marketing'] },
];

export default Marketplace;
