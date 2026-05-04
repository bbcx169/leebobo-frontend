import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 這裡的設定值，你要去 Firebase 控制台的「專案設定 > 一般」裡面複製
// 我們把它們對應到 Vite 的環境變數 (import.meta.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 初始化 Firebase 應用程式
const app = initializeApp(firebaseConfig);

// 初始化並導出 Firestore 資料庫實例，以後其他檔案要讀寫資料庫都從這裡 import
export const db = getFirestore(app);