import { db } from './firebase';
import { getAdminIdToken } from './adminAuth';
import { GAS_SCRIPT_URL } from '../config';
import { postGasApi } from './gasApi';
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

export const SCRIPT_URL = GAS_SCRIPT_URL;

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

  return postGasApi(finalPayload);
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
    action: 'admin_resend_pdf',
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

export const fetchNotificationSettings = async () => {
  const result = await callGasApi({ action: 'get_notification_settings' });
  return normalizeNotificationSettingsForClient(result.data);
};

export const saveNotificationSettings = async (settings) => {
  const result = await callGasApi({ action: 'save_notification_settings', settings });
  return normalizeNotificationSettingsForClient(result.data);
};

export const sendTestNotification = async ({ recipientId, channel }) => {
  const result = await callGasApi({ action: 'test_notification', recipientId, channel });
  return result.data;
};

export const fetchNotificationLogs = async () => {
  const result = await callGasApi({ action: 'get_notification_logs', limit: 30 });
  return result.data || [];
};

const maskContactValue = (value = '') => {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return '';
  if (cleanValue.includes('@')) {
    const [name, domain] = cleanValue.split('@');
    return `${name.slice(0, 2)}***@${domain || ''}`;
  }
  if (cleanValue.length <= 8) return '***';
  return `${cleanValue.slice(0, 4)}***${cleanValue.slice(-4)}`;
};

const normalizeNotificationSettingsForClient = (settings = {}) => ({
  ...settings,
  recipients: (settings.recipients || []).map(recipient => {
    const rawEmail = String(recipient.email || '').trim();
    const rawLineUserId = String(recipient.lineUserId || '').trim();
    const rawTelegramChatId = String(recipient.telegramChatId || '').trim();
    const hasEmail = recipient.hasEmail === true || Boolean(rawEmail || recipient.emailMasked);
    const hasLineUserId = recipient.hasLineUserId === true || Boolean(rawLineUserId || recipient.lineUserIdMasked);
    const hasTelegramChatId = recipient.hasTelegramChatId === true || Boolean(rawTelegramChatId || recipient.telegramChatIdMasked);

    return {
      ...recipient,
      email: '',
      lineUserId: '',
      telegramChatId: '',
      hasEmail,
      hasLineUserId,
      hasTelegramChatId,
      emailMasked: recipient.emailMasked || maskContactValue(rawEmail),
      lineUserIdMasked: recipient.lineUserIdMasked || maskContactValue(rawLineUserId),
      telegramChatIdMasked: recipient.telegramChatIdMasked || maskContactValue(rawTelegramChatId),
      clearEmail: false,
      clearLineUserId: false,
      clearTelegramChatId: false
    };
  })
});
