import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config — safe for client-side use (public keys)
const firebaseConfig = {
  apiKey: "AIzaSyADmo4N4CF6XuS-L-zaEJyrlZ2p0h_KnBg",
  authDomain: "skillflux-d2c81.firebaseapp.com",
  projectId: "skillflux-d2c81",
  storageBucket: "skillflux-d2c81.firebasestorage.app",
  messagingSenderId: "377665553103",
  appId: "1:377665553103:web:c105c8c9e987503321adba",
  measurementId: "G-9D6SVF39VK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
