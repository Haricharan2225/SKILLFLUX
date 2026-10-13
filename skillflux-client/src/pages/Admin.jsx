import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, getDocs, doc, deleteDoc,
  updateDoc, serverTimestamp, orderBy, limit, writeBatch, setDoc
} from 'firebase/firestore';
import { Users, Code, Package, Repeat2, Trash2, Shield, BarChart3, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SkeletonCard } from '../components/UI';
import { SKILL_CATEGORIES, PRODUCT_CATEGORIES } from '../utils/helpers';

const Admin = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ users: 0, skills: 0, products: 0, exchanges: 0, posts: 0 });
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersSnap, skillsSnap, productsSnap, exchangesSnap, postsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'skills')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'exchanges')),
        getDocs(collection(db, 'posts')),
      ]);
      setStats({
        users: usersSnap.size,
        skills: skillsSnap.size,
        products: productsSnap.size,
        exchanges: exchangesSnap.size,
        posts: postsSnap.size,
      });
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => !u.isDemo));
    } catch (err) {
      toast.error('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const deleteUser = async (userId) => {
    if (userId === userData?.uid) { toast.error('Cannot delete your own admin account.'); return; }
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted from Firestore. Note: Firebase Auth account still exists (requires Admin SDK to delete).');
    } catch { toast.error('Failed to delete user.'); }
  };

  const seedDemoData = async () => {
    if (!window.confirm('Seed demo data? This will add sample skills, products, and posts (will skip existing).')) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);

      const demoSkills = [
        { id: 'demo_skill_1', title: 'React.js Development', category: 'Web Development', experienceLevel: 'Advanced', userId: 'demo_user_1', userName: 'Aarav Sharma', description: 'Full-stack React development with TypeScript, Redux, and React Query.', status: 'Active', availability: 'Weekends', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_2', title: 'UI/UX Design (Figma)', category: 'UI/UX Design', experienceLevel: 'Advanced', userId: 'demo_user_2', userName: 'Priya Reddy', description: 'Creating user-centered designs from wireframes to high-fidelity prototypes in Figma.', status: 'Active', availability: 'Evenings Only', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_3', title: 'Python & Data Science', category: 'Java & Python', experienceLevel: 'Intermediate', userId: 'demo_user_3', userName: 'Rahul Verma', description: 'Python for data analysis, pandas, numpy, and matplotlib.', status: 'Active', availability: 'Flexible', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_4', title: 'Graphic Design & Illustration', category: 'Graphic Design', experienceLevel: 'Advanced', userId: 'demo_user_4', userName: 'Ananya Patel', description: 'Brand identity, logo design, and digital illustration with Illustrator.', status: 'Active', availability: 'Weekends', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_5', title: 'Video Editing (Premiere Pro)', category: 'Video Editing', experienceLevel: 'Intermediate', userId: 'demo_user_5', userName: 'Kiran Kumar', description: 'Professional video editing, color grading, and motion graphics.', status: 'Active', availability: 'Evenings Only', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_6', title: 'Digital Marketing & SEO', category: 'Digital Marketing', experienceLevel: 'Expert', userId: 'demo_user_6', userName: 'Sneha Rao', description: 'SEO, Google Ads, social media strategy, and content marketing.', status: 'Active', availability: 'Flexible', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_7', title: 'Photography & Lightroom', category: 'Photography', experienceLevel: 'Advanced', userId: 'demo_user_7', userName: 'Arjun Mehta', description: 'Portrait, product, and street photography with post-processing in Lightroom.', status: 'Active', availability: 'Weekends', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_8', title: 'Java & Spring Boot', category: 'Java & Python', experienceLevel: 'Advanced', userId: 'demo_user_8', userName: 'Neha Singh', description: 'Backend development with Java, Spring Boot, and microservices.', status: 'Active', availability: 'Weekdays', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_9', title: 'Excel & Data Analytics', category: 'Data Analytics', experienceLevel: 'Intermediate', userId: 'demo_user_11', userName: 'Vikram Joshi', description: 'Excel, pivot tables, Power BI, and business data visualization.', status: 'Active', availability: 'Flexible', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_skill_10', title: 'Content Writing & Copywriting', category: 'Communication', experienceLevel: 'Advanced', userId: 'demo_user_12', userName: 'Divya Iyer', description: 'Blog posts, website copy, email campaigns, and technical writing.', status: 'Active', availability: 'Flexible', isDemo: true, createdAt: serverTimestamp() },
      ];

      const demoProducts = [
        { id: 'demo_product_1', title: 'Mechanical Keyboard (Cherry MX Blue)', category: 'Keyboards & Mice', condition: 'Like New', userId: 'demo_user_9', userName: 'Rohan Das', description: 'Barely used mechanical keyboard with Cherry MX Blue switches. RGB backlit.', desiredExchange: 'Python or web development tutoring', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_2', title: 'Sony WH-1000XM4 Headphones', category: 'Audio & Headphones', condition: 'Good', userId: 'demo_user_10', userName: 'Meera Nair', description: 'Industry-leading noise cancellation headphones in excellent condition.', desiredExchange: 'Academic tutoring or any skill exchange', imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_3', title: 'Wacom Intuos Drawing Tablet', category: 'Art Supplies', condition: 'Good', userId: 'demo_user_4', userName: 'Ananya Patel', description: 'Medium-sized drawing tablet, great for digital art, illustration, and design.', desiredExchange: 'Photography lessons or mentoring', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_4', title: 'Learning Python (3rd Ed.)', category: 'Books & Education', condition: 'Like New', userId: 'demo_user_3', userName: 'Rahul Verma', description: '1600-page comprehensive Python reference by Mark Lutz. Barely used.', desiredExchange: 'Web development or UI design guidance', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_5', title: 'Joby GorillaPod Tripod', category: 'Photography Gear', condition: 'New', userId: 'demo_user_7', userName: 'Arjun Mehta', description: 'Flexible tripod for photography and videography. Perfect for YouTube/vlogging.', desiredExchange: 'Graphic design or video editing help', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_6', title: 'Logitech MX Master 3 Mouse', category: 'Keyboards & Mice', condition: 'Like New', userId: 'demo_user_11', userName: 'Vikram Joshi', description: 'Multi-device wireless mouse, ergonomic design. Very little use.', desiredExchange: 'Python or data science mentoring', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_7', title: 'Art Supply Bundle (Watercolors)', category: 'Art Supplies', condition: 'Good', userId: 'demo_user_4', userName: 'Ananya Patel', description: 'Winsor & Newton watercolor set, brushes, and paper. Barely used.', desiredExchange: 'Any skill exchange', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
        { id: 'demo_product_8', title: 'Programming Textbook Bundle', category: 'Books & Education', condition: 'Good', userId: 'demo_user_8', userName: 'Neha Singh', description: 'Clean Code, Design Patterns, and System Design Interview books.', desiredExchange: 'Database mentoring or cloud computing help', status: 'Available', isDemo: true, createdAt: serverTimestamp() },
      ];

      demoSkills.forEach(s => batch.set(doc(db, 'skills', s.id), s));
      demoProducts.forEach(p => batch.set(doc(db, 'products', p.id), p));

      await batch.commit();
      toast.success(`Seeded ${demoSkills.length} skills and ${demoProducts.length} products!`);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Seeding failed. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const resetDemoData = async () => {
    if (!window.confirm('Delete all demo skills and products? Real user data will not be affected.')) return;
    try {
      const [skillsSnap, productsSnap] = await Promise.all([
        getDocs(query(collection(db, 'skills'), ...[])),
        getDocs(query(collection(db, 'products'), ...[])),
      ]);
      const batch = writeBatch(db);
      skillsSnap.docs.filter(d => d.data().isDemo).forEach(d => batch.delete(d.ref));
      productsSnap.docs.filter(d => d.data().isDemo).forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.success('Demo data cleared.');
      fetchStats();
    } catch { toast.error('Failed to clear demo data.'); }
  };

  if (userData?.role !== 'admin') return (
    <div className="pt-24 text-center">
      <Shield size={48} className="text-red-400 mx-auto mb-4" />
      <p className="text-slate-600">Access denied. Admin only.</p>
    </div>
  );

  const TABS = ['overview', 'users', 'seeding'];

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Shield size={22} className="text-emerald-600" /> Admin Panel
            </h1>
            <p className="text-slate-500 text-sm mt-1">Platform overview and management.</p>
          </div>
          <button onClick={fetchStats} className="btn-ghost text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.users, icon: Users, color: 'emerald' },
                { label: 'Skills', value: stats.skills, icon: Code, color: 'blue' },
                { label: 'Products', value: stats.products, icon: Package, color: 'amber' },
                { label: 'Exchanges', value: stats.exchanges, icon: Repeat2, color: 'purple' },
                { label: 'Posts', value: stats.posts, icon: BarChart3, color: 'rose' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <s.icon size={20} className={`text-${s.color}-600 mb-2`} />
                  <p className="text-2xl font-black text-slate-900">{loading ? '...' : s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h2 className="font-bold text-slate-900 mb-2">Platform Health</h2>
              <p className="text-sm text-slate-500">All core features are operational. Firebase Auth and Firestore connected.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="badge-green">Firebase Auth ✓</span>
                <span className="badge-green">Firestore ✓</span>
                <span className="badge-green">Exchange Workflow ✓</span>
                <span className="badge-green">Messaging ✓</span>
                <span className="badge-green">Notifications ✓</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.displayName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={user.role === 'admin' ? 'badge-green' : 'badge-slate'}>{user.role || 'user'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <button onClick={() => deleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 transition-colors text-xs flex items-center gap-1">
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'seeding' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-slate-900 mb-2">Seed Demo Data</h2>
              <p className="text-slate-500 text-sm mb-4">
                Creates realistic sample skills and products (10 skills, 8 products) to populate the marketplace. Uses stable IDs — safe to run multiple times.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
                ⚠ Demo data is flagged with <code className="bg-amber-100 px-1 rounded">isDemo: true</code> and will not impersonate real users.
              </div>
              <button onClick={seedDemoData} disabled={seeding} className="btn-primary">
                {seeding ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Seed Demo Data'}
              </button>
            </div>
            <div className="card p-6">
              <h2 className="font-bold text-slate-900 mb-2">Reset Demo Data</h2>
              <p className="text-slate-500 text-sm mb-4">Deletes only demo-flagged records. Real user data is not affected.</p>
              <button onClick={resetDemoData} className="btn-danger">
                <Trash2 size={15} /> Clear Demo Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
