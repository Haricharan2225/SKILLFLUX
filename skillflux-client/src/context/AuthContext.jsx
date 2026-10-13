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
    const ref = doc(db, 'users', currentUser.uid);
    const safeUpdates = { ...updates, updatedAt: serverTimestamp() };
    // Prevent role escalation
    delete safeUpdates.role;
    delete safeUpdates.uid;
    await updateDoc(ref, safeUpdates);
    setUserData(prev => ({ ...prev, ...safeUpdates }));
  };

  const refreshUserData = async () => {
    if (!currentUser) return;
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) setUserData(userDoc.data());
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // Create profile if missing (edge case)
            const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
            const fallback = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              username: (user.displayName || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + user.uid.slice(0, 4),
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
            await setDoc(doc(db, 'users', user.uid), fallback);
            setUserData(fallback);
          }
        } catch (e) {
          console.error('Error loading user data:', e);
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
