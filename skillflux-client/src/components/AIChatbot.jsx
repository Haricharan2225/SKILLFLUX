import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_RESPONSES = {
  'how does exchange work': 'An exchange works in 4 steps:\n1. Browse skills/products on the Marketplace\n2. Click "Propose Exchange" on a listing\n3. The other person accepts or declines\n4. Once accepted, chat to finalize details and confirm completion.',
  'how does skillflux work': 'SkillFlux is a barter platform where you exchange skills and products — no money involved! List what you offer, discover what others have, and propose exchanges.',
  'how to add skill': 'Go to your Dashboard → click the "+" next to My Skills → fill in the title, description, category, and experience level → click "Add Skill".',
  'how to add product': 'Go to your Dashboard → click "+" next to My Products → fill in product details including what you want in return → click "List Product".',
  'how to chat': 'Chats open automatically when an exchange is accepted. Go to Exchanges → accept a proposal → click "Open Chat". Or go to the Messages tab.',
  'what exchanges': 'SkillFlux supports 4 exchange types:\n• Skill for Skill (e.g. React ↔ UI Design)\n• Skill for Product (e.g. Python tutoring ↔ Keyboard)\n• Product for Skill (e.g. Book ↔ Web dev help)\n• Product for Product (e.g. Headphones ↔ Drawing tablet)',
  'exchange types': 'There are 4 exchange types: Skill for Skill, Skill for Product, Product for Skill, and Product for Product.',
  'how to complete exchange': 'Both parties must confirm completion:\n1. When you\'re done, click "Confirm Completion" on the exchange\n2. The other person also confirms\n3. Once both confirm, the exchange is marked as Completed!',
  'is it free': 'Yes! SkillFlux is completely free. No subscriptions, no payment gateways, no hidden fees. It\'s a pure barter platform.',
  'how to find matches': 'Our smart matching algorithm automatically suggests the best matches based on your skills and what you\'re looking for. Set up your profile in Settings for better matches!',
  'profile setup': 'Go to Settings to update your profile: add skills you offer, skills you want to learn, products available, and your preferences. A complete profile gets better matches.',
  'admin': 'Admin features include platform statistics, user management, and demo data seeding. Access is restricted to authorized administrators.',
  'notifications': 'You\'ll get notifications for: exchange proposals, accepted exchanges, new messages, follows, and connection requests. Check the 🔔 bell icon in the navigation.',
  'marketplace': 'The Marketplace has 3 tabs: Skills (teaching/learning), Products (physical items), and Members (people to connect with). Use filters and search to find what you need.',
  'hello': 'Hello! I\'m the SkillFlux AI Assistant. I can help you with questions about exchanges, profiles, skills, products, and platform features. What would you like to know?',
  'hi': 'Hi there! 👋 I\'m here to help you get the most out of SkillFlux. What can I help you with?',
};

const getResponse = (input) => {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return "I'm not sure about that specific question. Try asking about:\n• How exchanges work\n• How to add skills or products\n• How to use the marketplace\n• Exchange types\n• How to chat\n• Profile setup";
};

const AIChatbot = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Hi! I\'m the SkillFlux Assistant 🤖\n\nI can help you with:\n• How exchanges work\n• Adding skills & products\n• Platform features\n• Getting better matches\n\nWhat would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return null;

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: input.trim() };
    const botMsg = { id: Date.now() + 1, from: 'bot', text: getResponse(input.trim()) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const QUICK = ['How does exchange work?', 'How to add a skill?', 'What exchange types exist?', 'Is it free?'];

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center"
        title="SkillFlux Assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col"
            style={{ maxHeight: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-emerald-600 rounded-t-2xl">
              <div className="flex items-center gap-2 text-white">
                <Bot size={20} />
                <div>
                  <p className="font-bold text-sm">SkillFlux Assistant</p>
                  <p className="text-emerald-200 text-xs">Always here to help</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ minHeight: '200px', maxHeight: '300px' }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'bot' && (
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <Bot size={14} className="text-emerald-600" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.from === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {QUICK.map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-100 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-200">
              <input
                type="text"
                className="form-input text-sm py-2 flex-1"
                placeholder="Ask me anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button type="submit" disabled={!input.trim()} className="btn-primary p-2 rounded-xl flex-shrink-0 disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
