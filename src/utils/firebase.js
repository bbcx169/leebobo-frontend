import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  throw new Error("Missing VITE_FIREBASE_API_KEY. Set it in your local .env or deployment environment.");
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "leebobo-frontend.firebaseapp.com",
  projectId: "leebobo-frontend",
  storageBucket: "leebobo-frontend.firebasestorage.app",
  messagingSenderId: "667004373559",
  appId: "1:667004373559:web:6dd3cefe831bf56ca74db2"
};

// 初始化 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 初始化並導出 Firestore 資料庫實例
// 以後其他檔案（如 AdminDashboard）要讀寫資料庫都從這裡 import db
export const db = getFirestore(app);
export const auth = getAuth(app);
