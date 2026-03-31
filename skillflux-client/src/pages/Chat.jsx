import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { Send, ArrowLeft, Phone, MoreVertical, Paperclip, Smile, ShieldCheck, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
  const { requestId } = useParams();
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const scrollRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!requestId || !currentUser) return;

    const findChat = async () => {
      // Find chat associated with this requestId
      const q = query(collection(db, 'chats'), where('requestId', '==', requestId));
      const chatSnapshot = await getDocs(q);
      
      if (!chatSnapshot.empty) {
        const chatData = { id: chatSnapshot.docs[0].id, ...chatSnapshot.docs[0].data() };
        setChatInfo(chatData);

        // Get other user info
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) setOtherUser(userDoc.data());

        // Listen for messages
        const messagesQuery = query(
          collection(db, 'chats', chatSnapshot.docs[0].id, 'messages'),
          orderBy('timestamp', 'asc')
        );
        
        return onSnapshot(messagesQuery, (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    };

    const unsubscribePromise = findChat();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [requestId, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatInfo) return;

    const msg = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', chatInfo.id, 'messages'), {
        senderId: currentUser.uid,
        userName: userData.displayName,
        text: msg,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!chatInfo || !otherUser) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pt-16 h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl relative group overflow-hidden">
               {otherUser.displayName.charAt(0)}
               <div className="absolute inset-0 bg-green-400 group-hover:scale-x-100 scale-x-0 transition-transform origin-left opacity-30"></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{otherUser.displayName}</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end mr-4">
             <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-black">
                <ShieldCheck size={12} className="text-emerald-500" /> Secure Exchange
             </div>
             <p className="text-[10px] text-slate-600 font-medium">Agreement Pending</p>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><Phone size={20} /></button>
          <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="flex flex-col items-center justify-center py-10 opacity-50">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200">
              <ShieldCheck size={32} className="text-green-500" />
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Messages are end-to-end encrypted</p>
        </div>

        {messages.map((m, idx) => {
          const isMe = m.senderId === currentUser.uid;
          return (
            <motion.div
              layout
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={m.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] group`}>
                <div className={`p-4 rounded-2xl relative shadow-lg ${
                  isMe 
                  ? 'bg-green-600 text-white rounded-tr-none border border-green-500/50' 
                  : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-300/50 shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed break-words">{m.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-2 ${isMe ? 'text-primary-200' : 'text-slate-500'}`}>
                    <span className="text-[10px] font-bold">12:00 PM</span>
                    {isMe && <CheckCheck size={12} className="text-primary-300" />}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
             <button type="button" className="p-2 text-slate-500 hover:text-green-400 transition-colors"><Smile size={24} /></button>
             <button type="button" className="p-2 text-slate-500 hover:text-green-400 transition-colors rotate-45"><Paperclip size={24} /></button>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Suggest an exchange detail..."
              className="w-full bg-slate-100/80 border border-slate-300 rounded-2xl py-4 px-6 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all text-sm md:text-base font-medium"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            className="w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-500 transition-all shadow-lg shadow-green-500/20 active:rotate-12"
          >
            <Send size={24} />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
