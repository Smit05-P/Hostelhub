/**
 * lib/verify-auth.js — Server-side auth verification for API routes
 * 
 * Verifies Firebase ID tokens sent as `Authorization: Bearer <idToken>`.
 * Returns the decoded token (uid, email, role via custom claims) or null.
 */

import { adminAuth } from "./admin-firebase";

/**
 * Extracts and verifies the Firebase ID token from the request.
 * @param {Request} request - The incoming Next.js API route request
 * @returns {Promise<import("firebase-admin/auth").DecodedIdToken | null>}
 */
export async function verifyRequest(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    
    // Firebase Admin verifyIdToken validates signature, expiry, and audience
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    // Token expired, malformed, or revoked
    if (process.env.NODE_ENV === "development") {
      console.warn("[verify-auth] Token verification failed:", error.code || error.message);
    }
    return null;
  }
}

/**
 * Convenience: verify + require admin role.
 * Returns decoded token if valid admin, null otherwise.
 */
export async function verifyAdmin(request) {
  const decoded = await verifyRequest(request);
  if (!decoded) return null;
  
  // Check custom claims (set via adminAuth.setCustomUserClaims)
  if (decoded.role === "admin") return decoded;
  
  // Fallback: check Firestore user doc if custom claims not yet set
  // This handles the migration period before all users have claims
  try {
    const { adminDb } = await import("./admin-firebase");
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (userDoc.exists && userDoc.data()?.role === "admin") {
      return { ...decoded, role: "admin" };
    }
  } catch {
    // Firestore lookup failed — deny
  }
  
  return null;
}

/**
 * Extract hostelId from request using multiple sources (header, query, body).
 * Prioritizes: x-hostel-id header → query param → cookie
 */
export function extractHostelId(request, searchParams = null) {
  return (
    request.headers.get("x-hostel-id") ||
    searchParams?.get("hostelId") ||
    null
  );
}
