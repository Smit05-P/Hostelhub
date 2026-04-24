import admin from "firebase-admin";

let _initialized = false;

function ensureInitialized() {
  if (_initialized || admin.apps.length) {
    _initialized = true;
    return;
  }

  // Guard: If we're in a build environment without credentials, skip init silently
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    _initialized = true;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

// Lazy getters — only called inside request handlers, never at build time
export const getAdminAuth = () => { ensureInitialized(); return admin.auth(); };
export const getAdminDb = () => { ensureInitialized(); return admin.firestore(); };
export const getAdminStorage = () => { ensureInitialized(); return admin.storage(); };

// Legacy named exports for backward compat — these are also lazy via Proxy
export const adminAuth = new Proxy({}, { get: (_, prop) => { ensureInitialized(); return admin.auth()[prop]; } });
export const adminDb = new Proxy({}, { get: (_, prop) => { ensureInitialized(); return admin.firestore()[prop]; } });
export const adminStorage = new Proxy({}, { get: (_, prop) => { ensureInitialized(); return admin.storage()[prop]; } });

