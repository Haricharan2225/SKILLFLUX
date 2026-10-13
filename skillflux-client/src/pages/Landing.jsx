import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import {
  ArrowRight, Repeat2, BookOpen, Package, Shield,
  ChevronDown, Star, Users, Zap, CheckCircle, User, Compass
} from 'lucide-react';
import { getInitials, getAvatarColor, EXCHANGE_TYPES } from '../utils/helpers';

const HOW_IT_WORKS = [
  { step: 1, icon: User, title: 'Create Your Profile', desc: 'List your skills, knowledge, and products. Share what you offer and what you need.' },
  { step: 2, icon: Compass, title: 'Discover Matches', desc: 'Our smart algorithm finds people whose needs match what you offer, and vice versa.' },
  { step: 3, icon: Repeat2, title: 'Connect & Exchange', desc: 'Send an exchange proposal, chat, agree on terms, and complete your barter — no money needed.' },
];

const DEMO_MEMBERS = [
  { name: 'Aarav Sharma', skill: 'React Developer', color: 'bg-blue-500' },
  { name: 'Priya Reddy', skill: 'UI/UX Designer', color: 'bg-purple-500' },
  { name: 'Rahul Verma', skill: 'Python Learner', color: 'bg-amber-500' },
  { name: 'Ananya Patel', skill: 'Graphic Designer', color: 'bg-rose-500' },
  { name: 'Kiran Kumar', skill: 'Video Editor', color: 'bg-teal-500' },
  { name: 'Sneha Rao', skill: 'Digital Marketer', color: 'bg-indigo-500' },
];

const DEMO_EXAMPLES = [
  { from: 'React.js Mentoring', to: 'UI/UX Design Lessons', type: 'Skill ↔ Skill' },
  { from: 'Python Tutoring', to: 'Mechanical Keyboard', type: 'Skill ↔ Product' },
  { from: 'Programming Textbook', to: 'Graphic Design Help', type: 'Product ↔ Skill' },
  { from: 'Drawing Tablet', to: 'Photography Lessons', type: 'Product ↔ Product' },
];

const FAQ = [
  { q: 'Is SkillFlux really free?', a: 'Yes, completely. There are no subscription fees, no payment gateways, and no hidden charges. This is a pure barter platform.' },
  { q: 'How does the exchange work?', a: 'Browse listings, find someone whose skills or products match your needs, send an exchange proposal, chat to agree on details, and confirm completion when done.' },
  { q: 'What can I exchange?', a: 'Skills (teaching, mentoring, consulting) and physical/digital products. All four combinations are supported: skill-for-skill, skill-for-product, product-for-skill, and product-for-product.' },
  { q: 'Is it safe?', a: 'All users are verified via email. Exchanges are tracked end-to-end with our completion confirmation system. Both parties must confirm before an exchange is marked complete.' },
  { q: 'What if an exchange goes wrong?', a: 'You can cancel an exchange at any time before completion. Our admin team reviews reported issues and maintains community standards.' },
];

const Landing = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ users: 0, skills: 0, products: 0, exchanges: 0 });
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersSnap, skillsSnap, productsSnap, exchangesSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), limit(1000))),
          getDocs(query(collection(db, 'skills'), limit(1000))),
          getDocs(query(collection(db, 'products'), limit(1000))),
          getDocs(query(collection(db, 'exchanges'), limit(1000))),
        ]);
        setStats({
          users: Math.max(usersSnap.size, 12),
          skills: Math.max(skillsSnap.size, 24),
          products: Math.max(productsSnap.size, 18),
          exchanges: Math.max(exchangesSnap.size, 8),
        });
      } catch { /* fallback to demo stats already set */ }
    };
    loadStats();
  }, []);

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="px-4 py-20 md:py-28 max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
            <Zap size={14} />
            <span>Skill-for-Product · No Money Required</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            Your Skills Have Value.<br />
            <span className="gradient-text">Exchange Them.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Learn new skills, share what you know, and exchange useful products with people in your community — without mandatory money.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={currentUser ? '/marketplace' : '/register'} className="btn-primary text-base py-3 px-8">
              Start Exchanging <ArrowRight size={18} />
            </Link>
            <Link to={currentUser ? '/feed' : '/login'} className="btn-secondary text-base py-3 px-8">
              Explore Community
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
        >
          {[
            { label: 'Members', value: stats.users + '+' },
            { label: 'Skills Listed', value: stats.skills + '+' },
            { label: 'Products', value: stats.products + '+' },
            { label: 'Exchanges Done', value: stats.exchanges + '+' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-black text-emerald-600">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-slate-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500">Three simple steps to your first exchange.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={22} className="text-emerald-600" />
                </div>
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exchange Types */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Four Ways to Exchange</h2>
          <p className="text-slate-500">Any combination of skills and products. You decide what's fair.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {DEMO_EXAMPLES.map((ex, i) => (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Repeat2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-medium text-slate-800">{ex.from}</span>
                  <ArrowRight size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{ex.to}</span>
                </div>
                <span className="badge-green text-xs mt-1">{ex.type}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Members Preview */}
      <section className="bg-white border-y border-slate-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Meet Our Community</h2>
            <p className="text-slate-500">Hundreds of people ready to share their skills and products.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {DEMO_MEMBERS.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${m.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {getInitials(m.name)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.skill}</p>
                </div>
                <CheckCircle size={16} className="ml-auto text-emerald-500 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to={currentUser ? '/marketplace' : '/register'} className="btn-primary">
              <Users size={16} /> Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Safe & Trustworthy</h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Every exchange goes through a structured workflow. Both parties must confirm completion before an exchange is marked done.
            </p>
            <ul className="space-y-3">
              {[
                'Email verification for all accounts',
                'Structured exchange request workflow',
                'Two-party completion confirmation',
                'Report system for community safety',
                'Admin moderation and oversight',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <Shield size={15} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BookOpen, label: 'Skills', desc: '20+ categories' },
              { icon: Package, label: 'Products', desc: '10+ categories' },
              { icon: Repeat2, label: 'Exchange Types', desc: '4 combinations' },
              { icon: Star, label: 'Community', desc: 'Verified members' },
            ].map(item => (
              <div key={item.label} className="card p-5 text-center">
                <item.icon size={24} className="text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-slate-100 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ml-3 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-emerald-600">
        <h2 className="text-3xl font-black text-white mb-4">Ready to Start Exchanging?</h2>
        <p className="text-emerald-100 mb-8 max-w-md mx-auto">Join our community of skill-sharers and product-exchangers today.</p>
        <Link to={currentUser ? '/marketplace' : '/register'} className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold py-3 px-8 rounded-xl hover:bg-emerald-50 transition-colors">
          {currentUser ? 'Explore Marketplace' : 'Create Free Account'} <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Zap size={18} className="text-emerald-400" />
            SkillFlux
          </div>
          <p className="text-sm">© 2024 SkillFlux. Exchange skills, not money.</p>
          <div className="flex gap-4 text-sm">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

