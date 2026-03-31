import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Search, Filter, Sparkles, Send, MapPin, Zap, Info, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Marketplace = () => {
  const { currentUser, userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Skills'); // Skills or Products

  const [matches, setMatches] = useState([]);

  // Simple AI Matching Logic
  const getKeywords = (text) => {
    if (!text) return new Set();
    return new Set(text.toLowerCase().match(/\b(\w+)\b/g).filter(word => word.length > 2));
  };

  const calculateScore = (text1, text2) => {
    const k1 = getKeywords(text1);
    const k2 = getKeywords(text2);
    if (k1.size === 0 || k2.size === 0) return 0;
    let crossMatches = 0;
    k1.forEach(w => { if (k2.has(w)) crossMatches++; });
    return Math.round((crossMatches / Math.max(k1.size, k2.size)) * 100);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const skillsSnapshot = await getDocs(collection(db, 'skills'));
      const productsSnapshot = await getDocs(collection(db, 'products'));
      
      const allSkills = skillsSnapshot.docs.map(doc => ({ id: doc.id, type: 'Skill', ...doc.data() }));
      const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, type: 'Product', ...doc.data() }));
      
      const combined = [...allSkills, ...allProducts].filter(item => item.userId !== currentUser.uid);
      
      if (combined.length === 0) {
        // Fallback demo items for a professional look
        const mockItems = [
          { id: 'm1', type: 'Skill', title: 'React Expert Dev', userName: 'Alex Rivera', description: 'Can help you build startup-level frontends with AI integration.', category: 'Coding' },
          { id: 'm2', type: 'Product', title: 'iPad Pro 12.9"', userName: 'Sarah Design', description: 'M2 Chip, 256GB. Barely used. Perfect for digital art.', requiredSkill: 'Web Development', imageURL: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0' },
          { id: 'm3', type: 'Skill', title: 'Growth Marketing', userName: 'Mike Ross', description: 'Experienced in scaling SaaS products from $0 to $1M ARR.', category: 'Business' },
          { id: 'm4', type: 'Product', title: 'Sony Headset', userName: 'Elena G', description: 'WH-1000XM4. Industry leading noise cancellation.', requiredSkill: 'Python Automation', imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e' },
          { id: 'm5', type: 'Skill', title: 'Cyber Security', userName: 'Tom Hardy', description: 'Penetration testing and security auditing for startups.', category: 'Coding' },
          { id: 'm6', type: 'Product', title: 'Custom Keyboard', userName: 'David M', description: 'Mechanical keyboard with blue switches and RGB.', requiredSkill: 'UI/UX Design', imageURL: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae' }
        ];
        setItems(mockItems);
      } else {
        setItems(combined);
      }
      
      // Perform AI Matching based on current user's needs/skills
      // 1. Match User's Skills with other's Products
      // 2. Match User's Product requirements with other's Skills
      const mySkillsQuery = await getDocs(collection(db, 'skills'));
      const mySkills = mySkillsQuery.docs.filter(d => d.data().userId === currentUser.uid).map(d => d.data());
      
      const myProductsQuery = await getDocs(collection(db, 'products'));
      const myProducts = myProductsQuery.docs.filter(d => d.data().userId === currentUser.uid).map(d => d.data());

      const bestMatches = [];
      
      combined.forEach(item => {
        let maxScore = 0;
        if (item.type === 'Product') {
          // If it's a product, check if my skills match its requirements
          mySkills.forEach(myS => {
            const score = calculateScore(myS.title, item.requiredSkill);
            if (score > maxScore) maxScore = score;
          });
        } else {
          // If it's a skill, check if it matches my products' requirements
          myProducts.forEach(myP => {
            const score = calculateScore(item.title, myP.requiredSkill);
            if (score > maxScore) maxScore = score;
          });
        }
        
        if (maxScore > 20) {
          bestMatches.push({ ...item, matchScore: maxScore });
        }
      });

      setMatches(bestMatches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4));

    } catch (err) {
      console.error(err);
      toast.error('Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchItems();
  }, [currentUser]);

  const handleRequestExchange = async (item) => {
    try {
      await addDoc(collection(db, 'requests'), {
        senderId: currentUser.uid,
        senderName: userData.displayName,
        receiverId: item.userId,
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      toast.success(`Request sent for ${item.title}!`);
    } catch (err) {
      toast.error('Failed to send request.');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = item.type === activeTab.slice(0, -1);
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesTab && matchesCategory;
  });

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black gradient-text mb-4">Discover Opportunities</h1>
          <p className="text-slate-600 font-medium leading-relaxed">
            Browse through skills and products listing from our global community. Our AI matching system 
            is currently analyzing your profile to find the best possible swaps for you.
          </p>
        </div>
        
        <div className="flex gap-4">
          {['Skills', 'Products'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab 
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/20 scale-105' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* AI Matches Section */}
      {matches.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold">Best Matches for Your Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {matches.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={`match-${item.id}`}
                className="glass-card p-6 border-amber-500/30 bg-amber-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-[10px] font-black text-slate-900 rounded-bl-xl uppercase tracking-tighter">
                  {item.matchScore}% Match
                </div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">{item.type}</span>
                    <button 
                      onClick={() => handleRequestExchange(item)}
                      className="text-green-400 hover:text-white transition-colors"
                    >
                      <Send size={18} />
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search for software development, design, gadgets..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-green-500/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none text-slate-600 font-bold focus:border-green-500/50"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option>All Categories</option>
          <option>Coding</option>
          <option>Design</option>
          <option>Marketing</option>
          <option>Hardware</option>
        </select>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/50 animate-pulse rounded-2xl border border-slate-200"></div>)
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <Info className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 font-medium">No {activeTab.toLowerCase()} found matching your criteria.</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <motion.div
              layout
              key={item.id}
              className="glass-card flex flex-col group h-full"
            >
              {item.type === 'Product' && item.imageURL && (
                <div className="h-48 rounded-t-2xl overflow-hidden">
                  <img src={item.imageURL} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    item.type === 'Skill' ? 'bg-green-500/10 text-green-400' : 'bg-cyan-500/10 text-emerald-400'
                  }`}>
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Zap size={12} className="text-amber-500" />
                    Popular
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">{item.title}</h3>
                <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
                
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-300">
                      {item.userName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item.userName}</p>
                      <p className="text-[10px] text-slate-500">Member since 2024</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRequestExchange(item)}
                    className="btn-primary p-3 rounded-xl active:scale-90"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;
