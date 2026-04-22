/**
 * lib/admin-firebase.js — Firebase Admin SDK (SERVER-ONLY)
 * 
 * Used exclusively in API routes and server actions.
 * NEVER import this file from client components or hooks.
 * 
 * The Admin SDK bypasses Firestore Security Rules and uses
 * service-account credentials for full privilege access.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // If service account env vars are present, use cert-based init
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    console.log("✅ Firebase Admin: Using Service Account credentials.");
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Diagnostic logging
  console.error("❌ Firebase Admin: Missing credentials!");
  console.log("- Project ID:", projectId ? "Present" : "MISSING");
  console.log("- Client Email:", clientEmail ? "Present" : "MISSING");
  console.log("- Private Key:", privateKey ? "Present" : "MISSING");

  // Fallback: Application Default Credentials (works on GCP, Firebase Hosting, local emulator)
  // In development without service account, init with just projectId
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ Firebase Admin initialized without Service Account. Session management may fail locally.");
  }
  return initializeApp({ projectId });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
