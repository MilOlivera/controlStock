import { initializeApp } from "firebase/app";
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyC8tEzBYroFKd-hSbexEJMoZAp8CMzDP0I",
  authDomain: "control-stock-2d36c.firebaseapp.com",
  projectId: "control-stock-2d36c",
  storageBucket: "control-stock-2d36c.firebasestorage.app",
  messagingSenderId: "1049274353208",
  appId: "1:1049274353208:web:a5bf8fea7a2d4e613288cd",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}

