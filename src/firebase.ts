import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import appletConfig from '../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || ""
};

const firestoreDatabaseId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || "(default)";

// Initialize the Firebase core application
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
