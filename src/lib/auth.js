import jwt from 'jsonwebtoken';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'auth_token';

/**
 * Hash a password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user/admin
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Alias for compatibility
export const signSession = signToken;

/**
 * Verify a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify a JWT token in Edge Runtime (Middleware)
 */
export async function verifyTokenEdge(token) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Set auth cookie in the response
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Get the current session from cookies
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

/**
 * Utility to protect API routes
 */
export async function protect(request) {
  // Try reading token from the incoming request's Cookie header first
  // (needed for client-initiated fetch calls where cookies are sent as headers)
  if (request) {
    const cookieHeader = request.headers?.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) {
      const session = verifyToken(decodeURIComponent(match[1]));
      if (session) return session;
    }
  }

  // Fallback: Next.js server-side cookie store (SSR / Server Components)
  const session = await getSession();
  if (!session) return null;
  return session;
}

/**
 * Utility to protect admin-only routes
 */
export async function protectAdmin(request) {
  // Try reading token from the incoming request's Cookie header first
  if (request) {
    const cookieHeader = request.headers?.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) {
      const session = verifyToken(decodeURIComponent(match[1]));
      if (session && (session.role === 'admin' || session.role === 'super_admin')) return session;
    }
  }

  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return null;
  }
  return session;
}
