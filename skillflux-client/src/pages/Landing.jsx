import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Repeat } from 'lucide-react';

const Landing = () => {
  return (
    <div className="pt-24 pb-12 overflow-hidden selection:bg-green-500/30 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-green-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Hero Section */}
        <div className="text-center relative z-10 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 border border-slate-200 rounded-full text-slate-600 text-sm mb-8"
          >
            <Sparkles size={14} className="text-green-400" />
            <span>AI-Powered Skill-for-Product Exchange</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8"
          >
            Exchange your <br />
            <span className="gradient-text">Skills for Products</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            SkillFlux is the world's first AI-driven marketplace where talent meets demand. 
            No money involved — just pure value exchange. Share what you know, get what you need.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary py-4 px-10 text-lg glow-effect group w-full sm:w-auto">
              Start Swapping Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/marketplace" className="btn-secondary py-4 px-10 text-lg border border-slate-300/50 w-full sm:w-auto">
              Browse Marketplace
            </Link>
          </motion.div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 relative z-10">
          {[
            {
              icon: <img src="/logo.png" alt="AI Matching" className="w-10 h-10 object-contain" />,
              title: "AI Matching",
              description: "Our proprietary algorithm connects your skills with the perfect product requirements automatically."
            },
            {
              icon: <Repeat className="text-emerald-400" size={32} />,
              title: "Zero Friction",
              description: "No complex payment gateways. Just send a request, chat, and finalize your skill-for-product trade."
            },
            {
              icon: <ShieldCheck className="text-emerald-400" size={32} />,
              title: "Secure & Verified",
              description: "Every exchange is monitored and every user is verified to ensure a safe peer-to-peer ecosystem."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * idx }}
              className="glass-card p-10 group"
            >
              <div className="w-16 h-16 bg-slate-100/80 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
