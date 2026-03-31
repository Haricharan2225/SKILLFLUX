import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Code, Package, Repeat, Trash2, ShieldCheck, Activity, BarChart3, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Admin = () => {
  const { userData } = useAuth();
  const [counts, setCounts] = useState({ users: 0, skills: 0, products: 0, exchanges: 0 });
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      const sSnap = await getDocs(collection(db, 'skills'));
      const pSnap = await getDocs(collection(db, 'products'));
      const rSnap = await getDocs(collection(db, 'requests'));

      setCounts({
        users: uSnap.size,
        skills: sSnap.size,
        products: pSnap.size,
        exchanges: rSnap.size
      });

      setUsers(uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSkills(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (coll, id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteDoc(doc(db, coll, id));
      fetchData();
      toast.success('Deleted successfully.');
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  const seedDemoData = async () => {
    try {
        const demoUsers = [
            { uid: 'u1', email: 'alex@dev.com', displayName: 'Alex Rivera', role: 'user' },
            { uid: 'u2', email: 'sarah@design.me', displayName: 'Sarah Chen', role: 'user' },
            { uid: 'u3', email: 'mike@marketing.io', displayName: 'Mike Ross', role: 'user' },
            { uid: 'u4', email: 'elena@write.co', displayName: 'Elena Gilbert', role: 'user' },
            { uid: 'u5', email: 'david@code.net', displayName: 'David Miller', role: 'user' },
            { uid: 'u6', email: 'lisa@product.biz', displayName: 'Lisa Wang', role: 'user' },
            { uid: 'u7', email: 'tom@tech.com', displayName: 'Tom Hardy', role: 'user' },
            { uid: 'u8', email: 'anna@creative.com', displayName: 'Anna Scott', role: 'user' },
            { uid: 'u9', email: 'james@startup.co', displayName: 'James Bond', role: 'user' },
            { uid: 'u10', email: 'admin@skillflux.com', displayName: 'Flux Admin', role: 'admin' }
        ];

        for (const u of demoUsers) {
            await setDoc(doc(db, 'users', u.uid), { ...u, createdAt: serverTimestamp() });
        }

        const demoSkills = [
            { userId: 'u1', userName: 'Alex Rivera', title: 'React & Next.js Mastery', description: 'Can build complex dashboards and web apps.', category: 'Coding' },
            { userId: 'u2', userName: 'Sarah Chen', title: 'UI/UX Brand Design', description: 'Creating premium visual identities.', category: 'Design' },
            { userId: 'u3', userName: 'Mike Ross', title: 'SEO & Growth Hacking', description: 'Scaling startups from 0 to 100k users.', category: 'Marketing' },
            { userId: 'u4', userName: 'Elena Gilbert', title: 'Copywriting & Content Strategy', description: 'Compelling stories that convert.', category: 'Writing' },
            { userId: 'u5', userName: 'David Miller', title: 'Cloud Infrastructure (AWS)', description: 'Setting up scalable server environments.', category: 'Coding' },
            { userId: 'u6', userName: 'Lisa Wang', title: 'Product Management', description: 'Roadmapping and agile execution.', category: 'Business' },
            { userId: 'u7', userName: 'Tom Hardy', title: 'Cyber Security Auditing', description: 'Penetration testing and security reports.', category: 'Coding' },
            { userId: 'u8', userName: 'Anna Scott', title: 'Motion Graphics (AE)', description: 'Stunning 2D/3D animations.', category: 'Design' },
            { userId: 'u9', userName: 'James Bond', title: 'Fintech Consulting', description: 'Navigating financial regulations and tech.', category: 'Business' }
        ];

        for (const s of demoSkills) {
            await addDoc(collection(db, 'skills'), { ...s, createdAt: serverTimestamp() });
        }

        const demoProducts = [
            { userId: 'u1', userName: 'Alex Rivera', title: 'Mechanical Keyboard (Custom)', description: 'GMMK Pro with Panda switches.', requiredSkill: 'UI/UX Design', imageURL: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=2070' },
            { userId: 'u2', userName: 'Sarah Chen', title: 'iPad Pro 12.9" (2022)', description: 'Barely used, includes Pencil.', requiredSkill: 'React help', imageURL: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=2070' },
            { userId: 'u3', userName: 'Mike Ross', title: 'Sony WH-1000XM4', description: 'Industry leading noise canceling.', requiredSkill: 'Python Automation', imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070' },
            { userId: 'u4', userName: 'Elena Gilbert', title: 'Herman Miller Embody', description: 'Ergonomic chair for long work hours.', requiredSkill: 'Web Development', imageURL: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?q=80&w=1974' },
            { userId: 'u5', userName: 'David Miller', title: 'RTX 4090 GPU', description: 'Brand new, unopened box.', requiredSkill: 'Cyber Security help', imageURL: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=2070' },
            { userId: 'u6', userName: 'Lisa Wang', title: 'MacBook Pro M2 Max', description: '32GB RAM, 1TB SSD.', requiredSkill: 'Growth Marketing', imageURL: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2052' },
            { userId: 'u7', userName: 'Tom Hardy', title: 'DJI Mavic 3 Drone', description: 'Great for cinematic shots.', requiredSkill: 'Next.js Dev', imageURL: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070' },
            { userId: 'u8', userName: 'Anna Scott', title: 'Wacom Cintiq 16', description: 'Perfect for digital illustrators.', requiredSkill: 'React Native', imageURL: 'https://images.unsplash.com/photo-1542744173-05336fcc7ad4?q=80&w=2002' },
            { userId: 'u9', userName: 'James Bond', title: 'Coffee Machine (E6)', description: 'Premium Swiss espresso machine.', requiredSkill: 'iOS Development', imageURL: 'https://images.unsplash.com/photo-1520970014086-2208ec0bd9af?q=80&w=1974' }
        ];

        for (const p of demoProducts) {
            await addDoc(collection(db, 'products'), { ...p, createdAt: serverTimestamp() });
        }

        // Add some sample requests
        const demoRequests = [
            { senderId: 'u2', senderName: 'Sarah Chen', receiverId: 'u1', itemTitle: 'Mechanical Keyboard (Custom)', itemType: 'Product', status: 'Accepted' },
            { senderId: 'u3', senderName: 'Mike Ross', receiverId: 'u2', itemTitle: 'UI/UX Brand Design', itemType: 'Skill', status: 'Pending' }
        ];

        for (const r of demoRequests) {
            await addDoc(collection(db, 'requests'), { ...r, createdAt: serverTimestamp() });
        }

        toast.success('Professional demo data seeded with 10 users!');
        fetchData();
    } catch (err) {
        console.error(err);
        toast.error('Failed to seed demo data.');
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 font-medium">Platform monitoring and user management</p>
        </div>
        <button 
          onClick={seedDemoData}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all border border-slate-300 active:scale-95 shadow-xl"
        >
          <Database size={18} className="text-green-400" />
          Seed Demo Data
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users className="text-green-400" />} label="Total Users" value={counts.users} color="border-green-500/20" />
        <StatCard icon={<Code className="text-emerald-400" />} label="Skills Listed" value={counts.skills} color="border-cyan-500/20" />
        <StatCard icon={<Package className="text-amber-400" />} label="Products Listed" value={counts.products} color="border-amber-500/20" />
        <StatCard icon={<Repeat className="text-emerald-400" />} label="Total Exchanges" value={counts.exchanges} color="border-emerald-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <section className="glass p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users size={24} className="text-slate-600" /> User Directory
          </h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold">{u.displayName || u.email}</p>
                  <p className="text-xs text-slate-500">{u.email} • {u.role}</p>
                </div>
                {u.email !== 'haripatel2225@gmail.com' && (
                  <button onClick={() => handleDelete('users', u.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Listings Monitor */}
        <section className="glass p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
             <Activity size={24} className="text-slate-600" /> Recent Postings
          </h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {[...skills, ...products].sort((a,b) => b.createdAt - a.createdAt).map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'Skill' ? 'bg-green-500/10 text-green-400' : 'bg-cyan-500/10 text-emerald-400'}`}>
                    {item.type === 'Skill' ? <Code size={14} /> : <Package size={14} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black uppercase tracking-widest">{item.userName}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(item.type === 'Skill' ? 'skills' : 'products', item.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`glass-card p-8 bg-white/40 border ${color}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
        {icon}
      </div>
      <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">{label}</p>
    </div>
    <p className="text-4xl font-black">{value}</p>
  </div>
);

export default Admin;
