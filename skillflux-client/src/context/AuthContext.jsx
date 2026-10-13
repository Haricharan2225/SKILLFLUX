import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = 'haripatel2225@gmail.com';

  const signup = async (email, password, name) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });

    const role = email === ADMIN_EMAIL ? 'admin' : 'user';
    const initialUserData = {
      uid: user.uid,
      email,
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, '_') + '_' + user.uid.slice(0, 4),
      role,
      bio: '',
      location: '',
      avatar: '',
      coverImage: '',
      skillsOffered: [],
      skillsWanted: [],
      productsOffered: [],
      productsWanted: [],
      languages: [],
      experienceLevel: 'Beginner',
      preferredExchangeType: 'Any',
      availability: 'Flexible',
      isOnline: true,
      portfolioLinks: [],
      followers: [],
      following: [],
      connections: [],
      onboardingComplete: false,
      isDemo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), initialUserData);
    setUserData(initialUserData);
    return user;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserData = async (updates) => {
    if (!currentUser) return;
    const safeUpdates = { ...updates };
    // Prevent role escalation
    delete safeUpdates.role;
    delete safeUpdates.uid;

    // 1. Optimistically update state & local storage immediately
    setUserData(prev => {
      const merged = { ...(prev || {}), ...safeUpdates };
      try {
        localStorage.setItem(`skillflux_profile_${currentUser.uid}`, JSON.stringify(merged));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      return merged;
    });

    // 2. Sync to Firestore in the background
    try {
      const ref = doc(db, 'users', currentUser.uid);
      await setDoc(ref, { ...safeUpdates, updatedAt: serverTimestamp() }, { merge: true });
    } catch (cloudErr) {
      console.info('Firestore profile sync notice (saved locally):', cloudErr.code || cloudErr.message);
    }
  };

  const refreshUserData = async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) setUserData(userDoc.data());
    } catch (err) {
      console.info('Notice refreshing user data:', err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Retrieve any local cached profile
        let cached = null;
        try {
          const raw = localStorage.getItem(`skillflux_profile_${user.uid}`);
          if (raw) cached = JSON.parse(raw);
        } catch (_) {}

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const resolved = {
              ...data,
              displayName: data.displayName || user.displayName || user.email?.split('@')[0] || 'User',
              skillsOffered: data.skillsOffered || cached?.skillsOffered || [],
              skillsWanted: data.skillsWanted || cached?.skillsWanted || [],
              productsOffered: data.productsOffered || cached?.productsOffered || [],
              productsWanted: data.productsWanted || cached?.productsWanted || [],
            };
            setUserData(resolved);
            try {
              localStorage.setItem(`skillflux_profile_${user.uid}`, JSON.stringify(resolved));
            } catch (_) {}
          } else {
            // Create profile if missing
            const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
            const fallback = cached || {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              username: (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + user.uid.slice(0, 4),
              role,
              bio: '',
              location: '',
              avatar: '',
              skillsOffered: [],
              skillsWanted: [],
              productsOffered: [],
              productsWanted: [],
              followers: [],
              following: [],
              connections: [],
              onboardingComplete: false,
              isDemo: false,
              createdAt: serverTimestamp()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), fallback, { merge: true });
            } catch (_) {}
            setUserData(fallback);
          }
        } catch (e) {
          console.warn('Notice loading user data from cloud (using local cache):', e.message);
          const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
          setUserData(cached || {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role,
            bio: '',
            location: '',
            avatar: '',
            skillsOffered: [],
            skillsWanted: [],
            productsOffered: [],
            productsWanted: [],
            followers: [],
            following: [],
            connections: [],
            onboardingComplete: true
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserData,
    refreshUserData,
    isAdmin: userData?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
