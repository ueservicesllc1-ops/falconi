// Falconi Parfums — Firebase & B2 Integration Engine
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDd4DbKNBmoi9mKGXZ3pRjohzc4DoNGcX8",
  authDomain: "falconi-97157.firebaseapp.com",
  projectId: "falconi-97157",
  storageBucket: "falconi-97157.firebasestorage.app",
  messagingSenderId: "699616494422",
  appId: "1:699616494422:web:4244696911512557d24cf7",
  measurementId: "G-54GC3MW7WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log("Analytics notice:", e.message);
}

// Proxy Server Config (Backblaze B2)
const B2_PROXY_URL = "/api/media";

// Helper: Upload file to Backblaze B2 via Proxy
export async function uploadMediaToB2(file, folder = "products") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${B2_PROXY_URL}/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Upload failed");
  }

  const data = await response.json();

  // Save metadata to Firestore 'media' collection
  await addDoc(collection(db, "media"), {
    key: data.key,
    url: data.url,
    originalName: file.name,
    size: data.size,
    mimetype: data.mimetype,
    folder: folder,
    createdAt: serverTimestamp()
  });

  return data;
}

// Helper: List files from B2 via Proxy
export async function listB2Media() {
  const response = await fetch(`${B2_PROXY_URL}/list`);
  if (!response.ok) throw new Error("Failed to fetch media list");
  return await response.json();
}

// Helper: Delete file from B2 via Proxy
export async function deleteB2Media(key) {
  const response = await fetch(`${B2_PROXY_URL}/file/${encodeURIComponent(key)}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Failed to delete media");
  return await response.json();
}

// Export Firebase Services & Auth Helpers
export {
  app,
  auth,
  db,
  analytics,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  B2_PROXY_URL
};
