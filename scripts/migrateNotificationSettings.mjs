import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const projectId = process.env.FIREBASE_PROJECT_ID || 'leebobo-frontend';
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential = serviceAccountPath
  ? cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8')))
  : applicationDefault();

initializeApp({
  credential,
  projectId
});

const db = getFirestore();
const settingsRef = db.collection('settings').doc('notificationSettings');
const snapshot = await settingsRef.get();

if (!snapshot.exists) {
  console.log('settings/notificationSettings does not exist. Nothing to migrate.');
  process.exit(0);
}

const data = snapshot.data() || {};
const rules = data.rules || {};
const migratedRules = Object.fromEntries(Object.entries(rules).map(([eventKey, rule = {}]) => [
  eventKey,
  {
    enabled: rule.enabled !== false,
    recipientChannels: normalizeRecipientChannels(rule.recipientChannels || {})
  }
]));

await settingsRef.set({
  ...data,
  rules: migratedRules,
  updatedAt: new Date()
});

console.log('Migrated settings/notificationSettings to recipientChannels-only rules.');
console.log(`Updated ${Object.keys(migratedRules).length} notification rules.`);

function normalizeRecipientChannels(recipientChannels) {
  return Object.fromEntries(Object.entries(recipientChannels).map(([recipientId, channels = {}]) => [
    recipientId,
    {
      email: channels.email === true,
      line: channels.line === true,
      telegram: channels.telegram === true
    }
  ]));
}
