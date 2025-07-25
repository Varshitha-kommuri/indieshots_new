import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT env variable is not set");
}

const decodedServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
);

initializeApp({
  credential: cert(decodedServiceAccount),
  storageBucket: `${decodedServiceAccount.project_id}.appspot.com`,
});

console.log('✅ Firebase Admin Initialized');

export const auth = getAuth();
export const db = getFirestore();
export const bucket = getStorage().bucket();
