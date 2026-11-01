// OwnFit – shared Firebase setup for login, account and admin pages
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  sendEmailVerification, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs,
  serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const OWNER_EMAIL = 'douhaib01@gmail.com';
export const BACKEND = 'https://script.google.com/macros/s/AKfycby2CpAIINv7aZd5Cc-ybKLzv4Z1xzPfcyNkCdMBuYwiuhHhL-iEji66Bx1LpRkc-anhgg/exec';
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_YXX0QjRIKNAize6-5PPredhPGxyvnr25WZ7dGVUKTE/edit';

const app = initializeApp({
  apiKey: 'AIzaSyBPu2_PTeWKDNcch-AQ7tfI4_z1nbhdwUs',
  authDomain: 'ownfit-baea8.firebaseapp.com',
  projectId: 'ownfit-baea8',
  storageBucket: 'ownfit-baea8.firebasestorage.app',
  messagingSenderId: '641625731251',
  appId: '1:641625731251:web:2b45fe542763f6f053c0c6'
});
export const auth = getAuth(app);
export const db = getFirestore(app);
export {
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail,
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, serverTimestamp, writeBatch
};

export const $ = (id) => document.getElementById(id);
export function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function isOwner(user) { return !!user && user.email === OWNER_EMAIL && user.emailVerified; }

// Loads (or on first login creates) the user's profile. Returns { profile, isNew }.
export async function ensureProfile(user, extra = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    try { await updateDoc(ref, { lastLogin: serverTimestamp() }); } catch (e) { /* blocked users can still be read */ }
    return { profile: { id: user.uid, ...snap.data() }, isNew: false };
  }
  const profile = {
    email: user.email || '',
    name: (extra.name || user.displayName || '').trim().slice(0, 80),
    phone: (extra.phone || '').trim().slice(0, 30),
    role: 'client', status: 'active',
    provider: (user.providerData[0] && user.providerData[0].providerId) || 'password',
    createdAt: serverTimestamp(), lastLogin: serverTimestamp()
  };
  await setDoc(ref, profile);
  return { profile: { id: user.uid, ...profile }, isNew: true };
}

export function roleOf(user, profile) {
  if (isOwner(user)) return 'admin';
  if (!profile || profile.status !== 'active') return 'blocked';
  return profile.role || 'client';
}

// Calls the Apps Script backend with the user's sign-in token.
export async function backend(action, data = {}) {
  const idToken = await auth.currentUser.getIdToken();
  const body = new URLSearchParams({ action, idToken, ...data });
  const res = await fetch(BACKEND, { method: 'POST', body });
  return res.json();
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return esc(iso);
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Current local date-time in the same format as <input type="datetime-local"> (YYYY-MM-DDTHH:MM)
export function localNow() {
  const d = new Date(), z = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes());
}

export function remaining(pkg, sessions) {
  const done = sessions.filter((s) => s.packageId === pkg.id && s.status === 'done').length;
  return { done, left: Math.max(0, (pkg.total || 0) - done) };
}

export function friendlyError(e) {
  const c = (e && e.code) || '';
  const map = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with this email. Create one below.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/weak-password': 'Use a password with at least 8 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'permission-denied': 'You don’t have access to this.'
  };
  return map[c] || (e && e.message) || 'Something went wrong. Please try again.';
}
