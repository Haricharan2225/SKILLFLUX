import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, doc, updateDoc,
  serverTimestamp, orderBy, addDoc
} from 'firebase/firestore';
import { Repeat2, CheckCircle, XCircle, Clock, MessageCircle, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmptyState, SkeletonCard } from '../components/UI';
import { getStatusColor, timeAgo, isValidTransition, EXCHANGE_STATUS } from '../utils/helpers';

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];

const Exchanges = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [view, setView] = useState('received'); // received | sent

  useEffect(() => {
    const fetchExchanges = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(query(collection(db, 'exchanges'), where('senderId', '==', currentUser.uid), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'exchanges'), where('recipientId', '==', currentUser.uid), orderBy('createdAt', 'desc'))),
        ]);
        const all = [...sentSnap.docs, ...receivedSnap.docs].map(d => ({ id: d.id, ...d.data() }));
        const unique = Array.from(new Map(all.map(e => [e.id, e])).values());
        unique.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setExchanges(unique);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load exchanges.');
      } finally {
        setLoading(false);
      }
    };
    fetchExchanges();
  }, [currentUser]);

  const handleAction = async (exchangeId, newStatus) => {
    const ex = exchanges.find(e => e.id === exchangeId);
    if (!ex) return;
    if (!isValidTransition(ex.status, newStatus)) {
      toast.error(`Cannot change status from ${ex.status} to ${newStatus}.`);
      return;
    }

    try {
      const updates = { status: newStatus, updatedAt: serverTimestamp() };

      // Handle completion confirmations
      if (newStatus === EXCHANGE_STATUS.COMPLETED) {
        const isRecipient = ex.recipientId === currentUser.uid;
        if (isRecipient) updates.recipientConfirmed = true;
        else updates.senderConfirmed = true;

        // Only mark fully complete if both confirmed
        const bothConfirmed = (isRecipient && ex.senderConfirmed) || (!isRecipient && ex.recipientConfirmed);
        if (!bothConfirmed) {
          updates.status = EXCHANGE_STATUS.IN_PROGRESS; // stays in-progress until other confirms
          toast.success('You confirmed completion. Waiting for the other party.');
        } else {
          toast.success('Exchange marked as completed! 🎉');
        }
      }

      await updateDoc(doc(db, 'exchanges', exchangeId), updates);
      setExchanges(prev => prev.map(e => e.id === exchangeId ? { ...e, ...updates } : e));

      if (newStatus === EXCHANGE_STATUS.ACCEPTED) {
        // Create chat
        const chatSnap = await getDocs(query(collection(db, 'chats'), where('exchangeId', '==', exchangeId)));
        if (chatSnap.empty) {
          await addDoc(collection(db, 'chats'), {
            exchangeId,
            participants: [ex.senderId, ex.recipientId],
            participantNames: { [ex.senderId]: ex.senderName, [ex.recipientId]: ex.recipientName },
            lastMessage: 'Exchange accepted! Start chatting.',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
        // Notify sender
        await addDoc(collection(db, 'notifications'), {
          recipientId: ex.senderId,
          actorId: currentUser.uid,
          actorName: userData.displayName,
          type: 'exchange_accepted',
          message: `${userData.displayName} accepted your exchange proposal`,
          read: false,
          createdAt: serverTimestamp(),
        });
        toast.success('Exchange accepted!');
      } else if (newStatus === EXCHANGE_STATUS.REJECTED) {
        toast.success('Exchange declined.');
      } else if (newStatus === EXCHANGE_STATUS.CANCELLED) {
        toast.success('Exchange cancelled.');
      } else if (newStatus === EXCHANGE_STATUS.IN_PROGRESS) {
        toast.success('Exchange moved to In Progress!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Action failed.');
    }
  };

  const openChat = async (exchangeId) => {
    const chatSnap = await getDocs(query(collection(db, 'chats'), where('exchangeId', '==', exchangeId)));
    if (!chatSnap.empty) navigate(`/chat/${chatSnap.docs[0].id}`);
    else navigate('/chat');
  };

  const filtered = exchanges.filter(e => {
    const statusMatch = activeTab === 'All' || e.status === activeTab;
    const viewMatch = view === 'received'
      ? e.recipientId === currentUser?.uid
      : e.senderId === currentUser?.uid;
    return statusMatch && viewMatch;
  });

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Exchanges</h1>
          <p className="text-slate-500 text-sm mt-1">Track all your skill and product exchange requests.</p>
        </div>

        {/* Received / Sent toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white mb-4 w-fit">
          {['received', 'sent'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-5 py-2 text-sm font-medium capitalize transition-all ${
                view === v ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              {v}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap mb-6">
          {STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}>
              {tab}
              {tab !== 'All' && (
                <span className="ml-1 opacity-60">
                  ({exchanges.filter(e => e.status === tab && (view === 'received' ? e.recipientId === currentUser?.uid : e.senderId === currentUser?.uid)).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Repeat2}
            title="No exchanges found"
            description={view === 'received' ? "No one has sent you proposals yet. Share your skills on the marketplace!" : "You haven't proposed any exchanges yet."}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(ex => {
              const isSender = ex.senderId === currentUser?.uid;
              const isRecipient = ex.recipientId === currentUser?.uid;
              return (
                <div key={ex.id} className="card p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {isSender ? `→ ${ex.recipientName}` : `← ${ex.senderName}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{timeAgo(ex.createdAt)}</p>
                    </div>
                    <span className={getStatusColor(ex.status)}>{ex.status}</span>
                  </div>

                  {/* Exchange details */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-3 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{ex.offeredTitle || 'Offering'}</span>
                      <Repeat2 size={14} className="text-emerald-500 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{ex.requestedTitle || 'Requesting'}</span>
                    </div>
                    {ex.exchangeType && <span className="badge-green text-xs mt-1">{ex.exchangeType}</span>}
                  </div>

                  {ex.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{ex.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {ex.status === 'Pending' && isRecipient && (
                      <>
                        <button onClick={() => handleAction(ex.id, 'Accepted')}
                          className="btn-primary text-xs py-1.5 px-3">
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => handleAction(ex.id, 'Rejected')}
                          className="btn-secondary text-xs py-1.5 px-3">
                          <XCircle size={12} /> Decline
                        </button>
                      </>
                    )}
                    {ex.status === 'Pending' && isSender && (
                      <button onClick={() => handleAction(ex.id, 'Cancelled')}
                        className="btn-secondary text-xs py-1.5 px-3">
                        Cancel
                      </button>
                    )}
                    {ex.status === 'Accepted' && (
                      <>
                        <button onClick={() => openChat(ex.id)} className="btn-primary text-xs py-1.5 px-3">
                          <MessageCircle size={12} /> Open Chat
                        </button>
                        <button onClick={() => handleAction(ex.id, 'In Progress')} className="btn-secondary text-xs py-1.5 px-3">
                          <Clock size={12} /> Mark In Progress
                        </button>
                      </>
                    )}
                    {ex.status === 'In Progress' && (
                      <>
                        <button onClick={() => openChat(ex.id)} className="btn-ghost text-xs">
                          <MessageCircle size={12} /> Chat
                        </button>
                        <button onClick={() => handleAction(ex.id, 'Completed')} className="btn-primary text-xs py-1.5 px-3">
                          <CheckCircle size={12} /> Confirm Completion
                        </button>
                      </>
                    )}
                    {['Accepted', 'In Progress'].includes(ex.status) && (
                      <button onClick={() => handleAction(ex.id, 'Cancelled')}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                        Cancel exchange
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exchanges;
