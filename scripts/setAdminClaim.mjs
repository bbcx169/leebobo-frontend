import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

const [email, adminValue = 'true', roleValue = 'admin'] = process.argv.slice(2);

if (!email) {
  console.error('Usage: npm run admin:set-claim -- admin@example.com true owner');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'leebobo-frontend';
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential = serviceAccountPath
  ? cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8')))
  : applicationDefault();

initializeApp({
  credential,
  projectId
});

const user = await getAuth().getUserByEmail(email);
const existingClaims = user.customClaims || {};
const admin = String(adminValue).toLowerCase() !== 'false';
const role = admin ? normalizeRole(roleValue) : undefined;

const nextClaims = {
  ...existingClaims,
  admin
};

if (role) {
  nextClaims.role = role;
} else {
  delete nextClaims.role;
}

await getAuth().setCustomUserClaims(user.uid, nextClaims);

console.log(`Updated custom claims for ${email}: admin=${admin}${role ? ` role=${role}` : ''}`);
console.log('The user must sign out and sign in again to refresh the ID token.');

function normalizeRole(role) {
  const cleanRole = String(role || 'admin').trim().toLowerCase();
  if (cleanRole === 'owner') return 'owner';
  return 'admin';
}
