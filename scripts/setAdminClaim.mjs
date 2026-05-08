import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

const [email, adminValue = 'true'] = process.argv.slice(2);

if (!email) {
  console.error('Usage: npm run admin:set-claim -- admin@example.com true');
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

await getAuth().setCustomUserClaims(user.uid, {
  ...existingClaims,
  admin
});

console.log(`Updated custom claims for ${email}: admin=${admin}`);
console.log('The user must sign out and sign in again to refresh the ID token.');
