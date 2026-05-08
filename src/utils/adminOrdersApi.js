import { db } from './firebase';
import { getAdminIdToken } from './adminAuth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  where
} from 'firebase/firestore';

export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMv1kSK35ZeMNLeH5Do7vHj8YzRkGhyovRT11LVcQSz8ZJZUwT7LZN10DeajhDh6Jgzw/exec';

export const getOrderSearchMode = (keyword) => {
  const rawKeyword = String(keyword || '').trim();
  if (!rawKeyword) return 'none';

  const digitsOnly = rawKeyword.replace(/\D/g, '');
  if (digitsOnly.length === 10 && digitsOnly.startsWith('09')) {
    return 'phone';
  }

  if (/^[a-zA-Z0-9]{4,20}$/.test(rawKeyword)) {
    return 'orderNumber';
  }

  return 'unsupported';
};

export const callGasApi = async (payload, options = {}) => {
  const finalPayload = { ...payload };

  if (options.requireAdmin !== false && !finalPayload.idToken) {
    finalPayload.idToken = await getAdminIdToken();
  }

  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(finalPayload)
  });

  const result = await response.json();
  if (result.status === 'error') {
    throw new Error(result.message || '處理失敗');
  }

  return result;
};

export const fetchAdminSettings = async () => {
  const result = await callGasApi({ action: 'get_settings' });
  return result.data;
};

export const fetchAdminOrdersPage = async ({ pageParam = null, pageSize = 50 }) => {
  const ordersRef = collection(db, 'orders');
  const pageQuery = pageParam
    ? query(ordersRef, orderBy('createdAt', 'desc'), startAfter(pageParam), firestoreLimit(pageSize))
    : query(ordersRef, orderBy('createdAt', 'desc'), firestoreLimit(pageSize));

  const snapshot = await getDocs(pageQuery);
  const orders = snapshot.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return {
    orders,
    nextCursor: snapshot.size === pageSize ? lastDoc : undefined
  };
};

export const searchAdminOrders = async (rawKeyword) => {
  const keyword = String(rawKeyword || '').trim();
  const searchMode = getOrderSearchMode(keyword);
  if (searchMode === 'none' || searchMode === 'unsupported') {
    return [];
  }

  const ordersRef = collection(db, 'orders');
  const searchQueries = [];

  if (searchMode === 'phone') {
    const digitsOnly = keyword.replace(/\D/g, '');
    searchQueries.push(query(ordersRef, where('ordererPhone', '==', digitsOnly), firestoreLimit(25)));
    searchQueries.push(query(ordersRef, where('recipientPhone', '==', digitsOnly), firestoreLimit(25)));
  } else {
    const normalizedOrderNumber = keyword.toUpperCase();
    searchQueries.push(query(ordersRef, where('orderNumber', '==', normalizedOrderNumber), firestoreLimit(10)));
    if (normalizedOrderNumber !== keyword) {
      searchQueries.push(query(ordersRef, where('orderNumber', '==', keyword), firestoreLimit(10)));
    }
  }

  const snapshots = await Promise.all(searchQueries.map(searchQuery => getDocs(searchQuery)));
  const resultMap = new Map();
  snapshots.forEach(snapshot => {
    snapshot.forEach(orderDoc => {
      resultMap.set(orderDoc.id, { id: orderDoc.id, ...orderDoc.data() });
    });
  });

  return Array.from(resultMap.values());
};

export const updateAdminOrder = async ({ order, eventDate, eventTime, specificDetails, notes }) => {
  const gasResult = await callGasApi({
    ...order,
    eventDate,
    eventTime,
    specificDetails,
    notes,
    action: 'update_pdf'
  });

  const newPdfUrl = gasResult.pdfDownloadUrl;
  await updateDoc(doc(db, 'orders', order.id), {
    eventDate,
    eventTime,
    specificDetails,
    notes,
    pdfDownloadUrl: newPdfUrl,
    isModified: true
  });

  return { pdfDownloadUrl: newPdfUrl };
};

export const resendAdminOrderPdf = async ({ order, email }) => {
  return callGasApi({
    action: 'resendPdf',
    orderNumber: order.orderNumber,
    pdfDownloadUrl: order.pdfDownloadUrl,
    email
  });
};

export const deleteAdminOrder = async ({ order }) => {
  const gasResult = await callGasApi({
    action: 'mark_order_deleted',
    firestoreDocumentId: order.id,
    orderNumber: order.orderNumber
  });

  await deleteDoc(doc(db, 'orders', order.id));
  return {
    orderNumber: order.orderNumber,
    sheetDeleted: gasResult.sheetDeleted !== false,
    rowNotFound: gasResult.rowNotFound === true,
    spreadsheetUrl: gasResult.spreadsheetUrl || ''
  };
};

export const saveAdminSettings = async (settings) => {
  return callGasApi({ action: 'save_settings', ...settings });
};
