import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * 這些資訊來自您的 Firebase 控制台專案設定。
 * 直接寫入字串可避免部署至 GitHub Pages 時產生的環境變數讀取失敗。
 */
const firebaseConfig = {
  apiKey: "AIzaSyCBD_M8WxA_a3Q47w9llaFgujPFI9C7zEI",
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