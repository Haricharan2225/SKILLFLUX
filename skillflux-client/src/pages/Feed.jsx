import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp, orderBy, limit, where
} from 'firebase/firestore';
import { PlusCircle, Edit3, Trash2, MessageSquare, Heart, Code, Package, Repeat2, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, EmptyState, SkeletonCard, Modal } from '../components/UI';
import { timeAgo, getInitials, getAvatarColor } from '../utils/helpers';

const POST_TYPES = ['Text', 'Skill Offer', 'Learning Request', 'Product Offer', 'Product Request', 'Project Update'];

const Feed = () => {
  const { currentUser, userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [newPost, setNewPost] = useState({ content: '', type: 'Text' });
  const [posting, setPosting] = useState(false);

  const FILTERS = ['All', 'Skills', 'Products', 'Learning', 'Projects'];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30)));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const final = fetched.length > 0 ? fetched : DEMO_POSTS;
      setPosts(final);
    } catch (err) {
      console.error(err);
      setPosts(DEMO_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;
    setPosting(true);
    try {
      const myName = userData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
      const myAvatar = userData?.avatar || currentUser?.photoURL || '';
      const ref = await addDoc(collection(db, 'posts'), {
        content: newPost.content.trim(),
        type: newPost.type,
        authorId: currentUser.uid,
        authorName: myName,
        authorAvatar: myAvatar,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      setPosts(prev => [{
        id: ref.id, ...newPost, authorId: currentUser.uid, authorName: myName,
        likes: [], commentCount: 0, createdAt: { toDate: () => new Date() }
      }, ...prev]);
      setNewPost({ content: '', type: 'Text' });
      setComposing(false);
      toast.success('Post published!');
    } catch { toast.error('Failed to post.'); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const liked = (post.likes || []).includes(currentUser.uid);
    const newLikes = liked
      ? (post.likes || []).filter(id => id !== currentUser.uid)
      : [...(post.likes || []), currentUser.uid];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    try {
      await import('firebase/firestore').then(({ updateDoc }) =>
        updateDoc(doc(db, 'posts', postId), { likes: newLikes })
      );
    } catch { /* revert would go here */ }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Skill Offer': return <Code size={12} className="text-emerald-600" />;
      case 'Learning Request': return <BookOpen size={12} className="text-blue-600" />;
      case 'Product Offer': case 'Product Request': return <Package size={12} className="text-amber-600" />;
      case 'Project Update': return <Repeat2 size={12} className="text-purple-600" />;
      default: return <MessageSquare size={12} className="text-slate-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Skill Offer': return 'badge-green';
      case 'Learning Request': return 'badge bg-blue-50 text-blue-700 border border-blue-100';
      case 'Product Offer': return 'badge bg-amber-50 text-amber-700 border border-amber-100';
      case 'Product Request': return 'badge bg-orange-50 text-orange-700 border border-orange-100';
      case 'Project Update': return 'badge bg-purple-50 text-purple-700 border border-purple-100';
      default: return 'badge-slate';
    }
  };

  const filterMap = { 'Skills': ['Skill Offer'], 'Products': ['Product Offer', 'Product Request'], 'Learning': ['Learning Request'], 'Projects': ['Project Update'] };

  const filtered = posts.filter(p =>
    filter === 'All' || (filterMap[filter] || []).includes(p.type)
  );

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Community Feed</h1>
          <p className="text-slate-500 text-sm mt-1">See what the community is offering and looking for.</p>
        </div>

        {/* Compose */}
        <div className="card p-4 mb-5">
          {!composing ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setComposing(true)}>
              <div className={`w-9 h-9 ${getAvatarColor(currentUser?.uid)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {getInitials(userData?.displayName)}
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-pointer hover:bg-slate-200 transition-colors">
                Share a skill, ask for help, or post a product...
              </div>
              <button className="btn-primary text-sm py-2 px-4 flex-shrink-0">
                <PlusCircle size={15} /> Post
              </button>
            </div>
          ) : (
            <form onSubmit={handlePost} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${getAvatarColor(currentUser?.uid)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {getInitials(userData?.displayName)}
                </div>
                <select className="form-input text-sm py-2" value={newPost.type} onChange={e => setNewPost(p => ({ ...p, type: e.target.value }))}>
                  {POST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <textarea
                className="form-input resize-none"
                rows={4}
                placeholder="What's on your mind? Share a skill, announce a product exchange, ask for help..."
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                required
                maxLength={500}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{newPost.content.length}/500</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setComposing(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                  <button type="submit" disabled={posting || !newPost.content.trim()} className="btn-primary text-sm py-2 px-4">
                    {posting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No posts yet" description="Be the first to share something with the community." />
        ) : (
          <div className="space-y-4">
            {filtered.map((post, i) => {
              const liked = (post.likes || []).includes(currentUser?.uid);
              const isOwn = post.authorId === currentUser?.uid;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card p-5">
                  {/* Author */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 ${getAvatarColor(post.authorId)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {getInitials(post.authorName)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{post.authorName}</p>
                        <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.type !== 'Text' && (
                        <span className={`${getTypeColor(post.type)} flex items-center gap-1`}>
                          {getTypeIcon(post.type)} {post.type}
                        </span>
                      )}
                      {isOwn && (
                        <button onClick={() => handleDelete(post.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                      <span>{(post.likes || []).length}</span>
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-slate-400">
                      <MessageSquare size={16} />
                      <span>{post.commentCount || 0}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DEMO_POSTS = [
  { id: 'dp1', type: 'Skill Offer', content: "I'm offering React.js mentoring sessions! I've been building web apps for 4 years. Looking to exchange for UI/UX design lessons or feedback on my designs. Who's interested? 🚀", authorId: 'demo1', authorName: 'Aarav Sharma', likes: ['u1', 'u2', 'u3'], commentCount: 4, createdAt: { toDate: () => new Date(Date.now() - 1800000) } },
  { id: 'dp2', type: 'Product Offer', content: "Offering my Wacom drawing tablet (barely used) in exchange for photography lessons or a photography course. It's the Intuos Medium — perfect for digital illustration.", authorId: 'demo4', authorName: 'Ananya Patel', likes: ['u1', 'u4'], commentCount: 2, createdAt: { toDate: () => new Date(Date.now() - 7200000) } },
  { id: 'dp3', type: 'Learning Request', content: "Anyone teaching digital marketing? I know video editing (Premiere Pro) well and can help you create YouTube content, ads, or reels in exchange for marketing mentoring!", authorId: 'demo5', authorName: 'Kiran Kumar', likes: ['u2', 'u3', 'u5'], commentCount: 6, createdAt: { toDate: () => new Date(Date.now() - 18000000) } },
  { id: 'dp4', type: 'Text', content: "Just completed my first skill exchange! Taught Python basics to Meera who helped me with academic tutoring for my data science course. This platform is amazing 🎉", authorId: 'demo3', authorName: 'Rahul Verma', likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'], commentCount: 8, createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
  { id: 'dp5', type: 'Product Request', content: "Looking for a used mechanical keyboard. I can offer Python programming lessons (beginner to intermediate), or we can work out a product-for-product exchange. Blue/brown switches preferred.", authorId: 'demo3', authorName: 'Rahul Verma', likes: ['u3', 'u4'], commentCount: 3, createdAt: { toDate: () => new Date(Date.now() - 172800000) } },
];

export default Feed;
