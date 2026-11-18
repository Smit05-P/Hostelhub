import jwt from 'jsonwebtoken';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const TOKEN_NAME = 'auth_token';

/**
 * Safely retrieve the JWT secret from environment
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }
    return 'dev-jwt-secret-hostelhub-fallback-key-2026';
  }
  return secret;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a bcrypt hash
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('[Auth] Password comparison error:', error.message);
    return false;
  }
}

/**
 * Generate a JWT token for a user/admin
 */
export function signToken(payload, options = {}) {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || '7d';
  return jwt.sign(payload, secret, {
    expiresIn,
    algorithm: 'HS256',
  });
}

// Alias for compatibility
export const signSession = signToken;

/**
 * Verify a JWT token and return its payload
 */
export function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Verify a JWT token in Edge Runtime (Proxy/Middleware) using jose
 */
export async function verifyTokenEdge(token) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuthCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_NAME);
    cookieStore.set(TOKEN_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } catch (error) {
    console.warn('[Auth] clearAuthCookie error:', error.message);
  }
}

/**
 * Utility to extract token from request (Authorization header or Cookie)
 */
export function extractToken(request) {
  if (!request) return null;

  // 1. Authorization: Bearer <token>
  const authHeader = request.headers?.get?.('authorization') || request.headers?.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie header
  const cookieHeader = request.headers?.get?.('cookie') || request.headers?.cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

/**
 * Utility to protect API routes
 * Accepts request with Authorization Bearer header or Cookie
 */
export async function protect(request) {
  const token = extractToken(request);
  if (token) {
    const session = verifyToken(token);
    if (session) return session;
  }

  // Fallback: Next.js cookieStore
  const session = await getSession();
  if (!session) return null;
  return session;
}

/**
 * Utility to protect admin-only routes
 */
export async function protectAdmin(request) {
  const session = await protect(request);
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return null;
  }
  return session;
}
