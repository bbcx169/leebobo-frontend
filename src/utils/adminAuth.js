import {
  GoogleAuthProvider,
  getIdToken,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import { auth } from './firebase';

export const onAdminAuthStateChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getAdminClaims = async (user, forceRefresh = false) => {
  if (!user) return {};
  const tokenResult = await getIdTokenResult(user, forceRefresh);
  return tokenResult.claims || {};
};

export const isAdminUser = async (user, forceRefresh = false) => {
  const claims = await getAdminClaims(user, forceRefresh);
  return claims.admin === true;
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInAdminWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider);
  const hasAdminClaim = await isAdminUser(credential.user, true);

  if (!hasAdminClaim) {
    await signOut(auth);
    throw new Error('此 Firebase 帳號尚未設定 admin 權限。');
  }

  return credential.user;
};

export const signOutAdmin = async () => {
  await signOut(auth);
};

export const getAdminIdToken = async () => {
  if (!auth.currentUser) {
    throw new Error('管理員尚未登入 Firebase Auth。');
  }

  return getIdToken(auth.currentUser);
};
