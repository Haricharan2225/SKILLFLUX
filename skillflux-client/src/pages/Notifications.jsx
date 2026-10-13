import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, writeBatch, getDocs
} from 'firebase/firestore';
import { Bell, Check, CheckCheck, Repeat2, UserPlus, MessageCircle, Star } from 'lucide-react';
import { EmptyState } from '../components/UI';
import { timeAgo } from '../utils/helpers';
import { toast } from 'react-hot-toast';

const NOTIF_ICONS = {
  exchange_request: Repeat2,
  exchange_accepted: CheckCheck,
  exchange_rejected: Check,
  follow: UserPlus,
  connection_request: UserPlus,
  new_message: MessageCircle,
  default: Bell,
};

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
    toast.success('All marked as read.');
  };

  const markRead = async (notifId) => {
    await import('firebase/firestore').then(({ updateDoc }) =>
      updateDoc(doc(db, 'notifications', notifId), { read: true })
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Stay up to date with your exchanges and connections.</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-sm text-emerald-600">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="card h-16 skeleton" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" description="You'll get notified about exchange proposals, messages, and connections here." />
        ) : (
          <div className="space-y-1">
            {notifications.map(notif => {
              const Icon = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markRead(notif.id)}
                  className={`card p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow ${!notif.read ? 'border-l-4 border-l-emerald-500' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!notif.read ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Icon size={18} className={!notif.read ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
