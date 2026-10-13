import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, addDoc,
  serverTimestamp, orderBy, getDocs, doc, getDoc,
  updateDoc, limit
} from 'firebase/firestore';
import { Send, ArrowLeft, MessageCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '../components/UI';
import { getInitials, getAvatarColor, timeAgo } from '../utils/helpers';

const Chat = () => {
  const { chatId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);
  const unsubMsgs = useRef(null);

  // Load conversations list
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  // When chatId param changes, load that chat
  useEffect(() => {
    if (chatId) {
      const loadChat = async () => {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = { id: chatDoc.id, ...chatDoc.data() };
          setActiveChat(chatData);
          const otherId = chatData.participants.find(id => id !== currentUser.uid);
          if (otherId) {
            const userDoc = await getDoc(doc(db, 'users', otherId));
            if (userDoc.exists()) setOtherUser(userDoc.data());
          }
        }
      };
      loadChat();
    }
  }, [chatId, currentUser]);

  const openConversation = useCallback(async (chat) => {
    setActiveChat(chat);
    navigate(`/chat/${chat.id}`, { replace: true });
    const otherId = chat.participants.find(id => id !== currentUser.uid);
    if (otherId) {
      const userDoc = await getDoc(doc(db, 'users', otherId));
      if (userDoc.exists()) setOtherUser(userDoc.data());
    }
  }, [currentUser, navigate]);

  // Listen for messages in active chat
  useEffect(() => {
    if (unsubMsgs.current) unsubMsgs.current();
    if (!activeChat) return;

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    unsubMsgs.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { if (unsubMsgs.current) unsubMsgs.current(); };
  }, [activeChat?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        senderId: currentUser.uid,
        senderName: userData.displayName,
        text,
        timestamp: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredConvos = conversations.filter(c => {
    const names = Object.values(c.participantNames || {}).join(' ').toLowerCase();
    return names.includes(search.toLowerCase());
  });

  return (
    <div className="pt-16 h-screen flex bg-slate-50">
      {/* Sidebar — conversation list */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="form-input pl-9 text-sm py-2"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 skeleton rounded w-32" />
                    <div className="h-2.5 skeleton rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No conversations yet.</p>
              <p className="text-xs text-slate-400 mt-1">Accept an exchange to start chatting.</p>
            </div>
          ) : (
            filteredConvos.map(conv => {
              const otherId = conv.participants.find(id => id !== currentUser.uid);
              const otherName = conv.participantNames?.[otherId] || 'User';
              const isActive = activeChat?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 ${isActive ? 'bg-emerald-50' : ''}`}
                >
                  <div className={`w-10 h-10 ${getAvatarColor(otherId)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {getInitials(otherName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{otherName}</p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  {conv.lastMessageAt && (
                    <p className="text-xs text-slate-400 flex-shrink-0">{timeAgo(conv.lastMessageAt)}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Select a conversation"
              description="Choose a conversation from the list or accept an exchange proposal to start chatting."
            />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
              <button onClick={() => { setActiveChat(null); navigate('/chat'); }}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
              <div className={`w-9 h-9 ${getAvatarColor(otherUser?.uid || '')} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {otherUser?.avatar
                  ? <img src={otherUser.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                  : getInitials(otherUser?.displayName)
                }
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{otherUser?.displayName || 'Loading...'}</p>
                {activeChat.exchangeId && (
                  <Link to="/exchanges" className="text-xs text-emerald-600 hover:underline">View exchange</Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {timeAgo(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="form-input flex-1"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}
                  className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
