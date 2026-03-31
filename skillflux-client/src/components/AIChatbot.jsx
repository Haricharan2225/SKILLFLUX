import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, MessageCircle, Sparkles } from 'lucide-react';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your SkillFlux Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');

  const faq = {
    'how': 'To exchange, find a skill or product you like in the Marketplace and click "Request Exchange". If they accept, you can chat to finalize!',
    'money': 'SkillFlux is a cashless platform. We believe in the value of human talent and tangible items.',
    'skill': 'You can add skills like Coding, Design, Marketing, or even niche things like "Gardening tips"!',
    'match': 'Our AI matching algorithm looks for keywords in your skills vs others product requirements. High scores indicate a great potential swap!',
    'admin': 'Admin logs in with haripatel2225@gmail.com. They monitor the platform health and listings.',
    'security': 'All chats are encrypted, and we monitor exchanges for community safety.',
    'hello': 'Hi there! Ready to swap some skills?',
    'help': 'I can tell you about how to trade, what to list, or how the AI matching works. What is on your mind?'
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      let response = "That's a great question! I'm specialized in SkillFlux basics. Try asking about 'how it works', 'matching', or 'money'.";
      
      for (const key in faq) {
        if (userMsg.includes(key)) {
          response = faq[key];
          break;
        }
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 z-50 hover:scale-110 active:scale-95 transition-transform"
      >
        <Bot size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden glass"
          >
            {/* Header */}
            <div className="p-4 bg-green-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-bold">SkillFlux AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-green-500 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                    ? 'bg-slate-100 text-white rounded-tr-none' 
                    : 'bg-green-600/10 border border-green-500/20 text-slate-900 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white/50">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-green-500"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-green-400 hover:text-primary-300">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
