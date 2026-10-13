import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  doc, getDoc, collection, query, where, getDocs,
  updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp
} from 'firebase/firestore';
import { MapPin, BookOpen, Package, Users, UserPlus, UserCheck, MessageCircle, Repeat2, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SkeletonCard, EmptyState } from '../components/UI';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';

const Profile = () => {
  const { uid } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProfile = currentUser?.uid === uid;

  const isFollowing = userData?.following?.includes(uid);
  const isConnected = userData?.connections?.includes(uid);
  const hasPendingRequest = profileUser?.connectionRequests?.includes(currentUser?.uid);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) { navigate('/marketplace'); return; }
        setProfileUser({ uid, ...userDoc.data() });

        const [skillsSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'skills'), where('userId', '==', uid))),
          getDocs(query(collection(db, 'products'), where('userId', '==', uid))),
        ]);
        setSkills(skillsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (uid) loadProfile();
  }, [uid]);

  const handleFollow = async () => {
    if (!currentUser || isOwnProfile || actionLoading) return;
    setActionLoading(true);
    try {
      const myRef = doc(db, 'users', currentUser.uid);
      const theirRef = doc(db, 'users', uid);
      if (isFollowing) {
        await updateDoc(myRef, { following: arrayRemove(uid) });
        await updateDoc(theirRef, { followers: arrayRemove(currentUser.uid) });
        toast.success('Unfollowed.');
      } else {
        await updateDoc(myRef, { following: arrayUnion(uid) });
        await updateDoc(theirRef, { followers: arrayUnion(currentUser.uid) });
        const myName = userData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
        await addDoc(collection(db, 'notifications'), {
          recipientId: uid,
          actorId: currentUser.uid,
          actorName: myName,
          type: 'follow',
          message: `${myName} started following you`,
          read: false,
          createdAt: serverTimestamp(),
        });
        toast.success('Following!');
      }
    } catch { toast.error('Action failed.'); }
    finally { setActionLoading(false); }
  };

  const handleConnect = async () => {
    if (!currentUser || isOwnProfile || actionLoading || isConnected) return;
    setActionLoading(true);
    try {
      if (hasPendingRequest) {
        // Accept (other's request is pending, they clicked on my profile)
        await updateDoc(doc(db, 'users', currentUser.uid), { connections: arrayUnion(uid) });
        await updateDoc(doc(db, 'users', uid), {
          connections: arrayUnion(currentUser.uid),
          connectionRequests: arrayRemove(currentUser.uid)
        });
        toast.success('Connection accepted!');
      } else {
        // Send request
        await updateDoc(doc(db, 'users', uid), {
          connectionRequests: arrayUnion(currentUser.uid)
        });
        const myName = userData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
        await addDoc(collection(db, 'notifications'), {
          recipientId: uid,
          actorId: currentUser.uid,
          actorName: myName,
          type: 'connection_request',
          message: `${myName} wants to connect with you`,
          read: false,
          createdAt: serverTimestamp(),
        });
        toast.success('Connection request sent!');
      }
    } catch { toast.error('Action failed.'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="h-40 skeleton rounded-2xl mb-4" />
        <SkeletonCard />
      </div>
    </div>
  );

  if (!profileUser) return null;

  const avatarColor = getAvatarColor(uid);

  return (
    <div className="pt-20 pb-12 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="card overflow-hidden mb-5">
          <div className="h-28 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className={`w-20 h-20 ${avatarColor} rounded-2xl border-4 border-white flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                {profileUser.avatar
                  ? <img src={profileUser.avatar} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                  : getInitials(profileUser.displayName)
                }
              </div>
              <div className="flex gap-2 mt-10">
                {isOwnProfile ? (
                  <Link to="/settings" className="btn-secondary text-sm">
                    <Edit3 size={15} /> Edit Profile
                  </Link>
                ) : (
                  <>
                    <button onClick={handleFollow} disabled={actionLoading} className="btn-secondary text-sm">
                      {isFollowing ? <><UserCheck size={15} /> Following</> : <><UserPlus size={15} /> Follow</>}
                    </button>
                    <button onClick={handleConnect} disabled={actionLoading || isConnected} className="btn-primary text-sm">
                      {isConnected ? <><UserCheck size={15} /> Connected</> :
                       hasPendingRequest ? 'Accept Request' :
                       <><Users size={15} /> Connect</>}
                    </button>
                    <Link to="/chat" className="btn-ghost text-sm">
                      <MessageCircle size={15} /> Message
                    </Link>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900">{profileUser.displayName}</h1>
            {profileUser.location && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin size={12} /> {profileUser.location}
              </p>
            )}
            {profileUser.bio && <p className="text-slate-600 text-sm mt-2 max-w-xl">{profileUser.bio}</p>}

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
              <span><strong>{profileUser.followers?.length || 0}</strong> followers</span>
              <span><strong>{profileUser.following?.length || 0}</strong> following</span>
              <span><strong>{profileUser.connections?.length || 0}</strong> connections</span>
              <span><strong>{skills.length}</strong> skills</span>
              <span><strong>{products.length}</strong> products</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {profileUser.experienceLevel && <span className="badge-slate">{profileUser.experienceLevel}</span>}
              {profileUser.availability && <span className="badge-slate">{profileUser.availability}</span>}
              {profileUser.preferredExchangeType && <span className="badge-green">{profileUser.preferredExchangeType}</span>}
              {(profileUser.languages || []).map(l => <span key={l} className="badge-slate">{l}</span>)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Skills section */}
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-600" /> Skills
            </h2>

            {(profileUser.skillsOffered?.length > 0) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Offers</p>
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.skillsOffered.map(s => <span key={s} className="badge-green">{s}</span>)}
                </div>
              </div>
            )}
            {(profileUser.skillsWanted?.length > 0) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Wants to Learn</p>
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.skillsWanted.map(s => <span key={s} className="badge-amber">{s}</span>)}
                </div>
              </div>
            )}

            {skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Listed Skills</p>
                <div className="space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-medium text-slate-900 text-sm">{skill.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-green text-xs">{skill.category}</span>
                        <span className="badge-slate text-xs">{skill.experienceLevel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!profileUser.skillsOffered?.length && !skills.length && (
              <p className="text-sm text-slate-400">No skills listed yet.</p>
            )}
          </div>

          {/* Products section */}
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Package size={18} className="text-blue-600" /> Products
            </h2>

            {(profileUser.productsOffered?.length > 0) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Can Offer</p>
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.productsOffered.map(p => <span key={p} className="badge-blue">{p}</span>)}
                </div>
              </div>
            )}
            {(profileUser.productsWanted?.length > 0) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Looking For</p>
                <div className="flex flex-wrap gap-1.5">
                  {profileUser.productsWanted.map(p => <span key={p} className="badge-amber">{p}</span>)}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Listed Products</p>
                <div className="space-y-2">
                  {products.map(product => (
                    <div key={product.id} className="p-3 bg-slate-50 rounded-xl">
                      <p className="font-medium text-slate-900 text-sm">{product.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge-blue text-xs">{product.category}</span>
                        <span className="badge-slate text-xs">{product.condition}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!profileUser.productsOffered?.length && !products.length && (
              <p className="text-sm text-slate-400">No products listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
