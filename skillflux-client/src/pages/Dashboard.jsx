import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { Plus, Trash2, Code, Palette, Briefcase, Package, Sparkles, MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [newSkill, setNewSkill] = useState({ title: '', description: '', category: 'Coding' });
  const [newProduct, setNewProduct] = useState({ title: '', description: '', imageURL: '', requiredSkill: '' });

  const fetchData = async () => {
    if (!currentUser) return;
    
    // Fetch Skills
    const skillsQuery = query(collection(db, 'skills'), where('userId', '==', currentUser.uid));
    const skillsSnapshot = await getDocs(skillsQuery);
    setSkills(skillsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch Products
    const productsQuery = query(collection(db, 'products'), where('userId', '==', currentUser.uid));
    const productsSnapshot = await getDocs(productsQuery);
    setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    // Fetch Requests (sent and received)
    const receivedRequestsQuery = query(collection(db, 'requests'), where('receiverId', '==', currentUser.uid));
    const receivedSnapshot = await getDocs(receivedRequestsQuery);
    setRequests(receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'skills'), {
        ...newSkill,
        userId: currentUser.uid,
        userName: userData.displayName,
        createdAt: serverTimestamp()
      });
      setSkills([...skills, { id: docRef.id, ...newSkill }]);
      setIsAddingSkill(false);
      setNewSkill({ title: '', description: '', category: 'Coding' });
      toast.success('Skill added successfully!');
    } catch (err) {
      toast.error('Failed to add skill.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        userId: currentUser.uid,
        userName: userData.displayName,
        createdAt: serverTimestamp()
      });
      setProducts([...products, { id: docRef.id, ...newProduct }]);
      setIsAddingProduct(false);
      setNewProduct({ title: '', description: '', imageURL: '', requiredSkill: '' });
      toast.success('Product added successfully!');
    } catch (err) {
      toast.error('Failed to add product.');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      await deleteDoc(doc(db, type, id));
      if (type === 'skills') setSkills(skills.filter(s => s.id !== id));
      else setProducts(products.filter(p => p.id !== id));
      toast.success('Removed successfully!');
    } catch (err) {
      toast.error('Failed to remove.');
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), { status: action });
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: action } : r));
      toast.success(`Request ${action}!`);
      
      if (action === 'Accepted') {
        // Create chat
        const req = requests.find(r => r.id === requestId);
        await addDoc(collection(db, 'chats'), {
          requestId,
          participants: [req.senderId, req.receiverId],
          lastMessage: 'Exchange started!',
          lastMessageTime: serverTimestamp()
        });
      }
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen px-4 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black gradient-text mb-2">Welcome Back, {userData?.displayName}</h1>
        <p className="text-slate-600 font-medium">Manage your skills and track your product exchanges.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skills Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Code className="text-green-400" /> My Skills
            </h2>
            <button 
              onClick={() => setIsAddingSkill(true)}
              className="bg-green-600/20 text-green-400 p-2 rounded-lg hover:bg-green-600/30 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {skills.length === 0 && <p className="text-slate-500 italic text-sm">No skills added yet.</p>}
            {skills.map(skill => (
              <motion.div layout id={skill.id} key={skill.id} className="glass p-4 bg-white/60 flex justify-between items-start group">
                <div>
                  <h3 className="font-bold text-slate-700">{skill.title}</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-1 inline-block">{skill.category}</span>
                </div>
                <button onClick={() => handleDelete('skills', skill.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="text-emerald-400" /> My Products
            </h2>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-emerald-600/20 text-emerald-400 p-2 rounded-lg hover:bg-emerald-600/30 transition-all active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {products.length === 0 && <p className="text-slate-500 italic text-sm">No products listed yet.</p>}
            {products.map(product => (
              <motion.div layout id={product.id} key={product.id} className="glass p-4 bg-white/60 flex justify-between items-start group">
                <div>
                  <h3 className="font-bold text-slate-700">{product.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">Needs: {product.requiredSkill}</p>
                </div>
                <button onClick={() => handleDelete('products', product.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Requests & Notifications */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-amber-400" /> Recent Requests
          </h2>
          
          <div className="space-y-4">
            {requests.length === 0 && <p className="text-slate-500 italic text-sm">No incoming requests.</p>}
            {requests.map(request => (
              <div key={request.id} className="glass p-5 bg-white/80 border-slate-300/80">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-green-400 font-bold">
                      {request.senderName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{request.senderName}</p>
                      <p className="text-xs text-slate-500">wants your {request.itemTitle}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    request.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                    request.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {request.status}
                  </span>
                </div>

                {request.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRequestAction(request.id, 'Accepted')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button 
                      onClick={() => handleRequestAction(request.id, 'Rejected')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
                
                {request.status === 'Accepted' && (
                  <button 
                    onClick={() => navigate(`/chat/${request.id}`)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} /> Open Chat
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSkill(false)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white border border-slate-300 w-full max-w-md p-8 rounded-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Add New Skill</h2>
              <form onSubmit={handleAddSkill} className="space-y-4">
                <input 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500" 
                  placeholder="Skill Title (e.g. React Expert)"
                  value={newSkill.title}
                  onChange={e => setNewSkill({...newSkill, title: e.target.value})}
                  required
                />
                <textarea 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500 h-24" 
                  placeholder="Tell us more about it..."
                  value={newSkill.description}
                  onChange={e => setNewSkill({...newSkill, description: e.target.value})}
                  required
                />
                <select 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500 text-slate-600"
                  value={newSkill.category}
                  onChange={e => setNewSkill({...newSkill, category: e.target.value})}
                >
                  <option>Coding</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Writing</option>
                  <option>Business</option>
                </select>
                <button type="submit" className="btn-primary w-full py-3 mt-4">Add Skill</button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white border border-slate-300 w-full max-w-md p-8 rounded-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">List a Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <input 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500" 
                  placeholder="Product Name (e.g. Mechanical Keyboard)"
                  value={newProduct.title}
                  onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                  required
                />
                <textarea 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500 h-24" 
                  placeholder="Product Description..."
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  required
                />
                <input 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500" 
                  placeholder="Image URL"
                  value={newProduct.imageURL}
                  onChange={e => setNewProduct({...newProduct, imageURL: e.target.value})}
                />
                <input 
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500" 
                  placeholder="Required Skill (e.g. Python help)"
                  value={newProduct.requiredSkill}
                  onChange={e => setNewProduct({...newProduct, requiredSkill: e.target.value})}
                  required
                />
                <button type="submit" className="btn-primary w-full py-3 mt-4">List Product</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
