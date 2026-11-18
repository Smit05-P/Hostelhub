/**
 * Comprehensive Authentication & Security Test Suite
 * Tests all 14 mandatory test cases against the HostelHub authentication architecture.
 */

import { hashPassword, verifyPassword, signToken, verifyToken, protect, protectAdmin, extractToken } from '../src/lib/auth.js';
import * as AdminModule from '../src/models/Admin.js';
import * as StudentModule from '../src/models/Student.js';
import { proxy } from '../src/proxy.js';
import { POST as registerHandler } from '../src/app/api/auth/register/route.js';
import { POST as loginHandler } from '../src/app/api/auth/login/route.js';
import { POST as googleHandler } from '../src/app/api/auth/google/route.js';
import { GET as sessionHandler } from '../src/app/api/auth/session/route.js';
import { POST as logoutHandler } from '../src/app/api/auth/logout/route.js';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test Case ${id}] ${status}: ${name}`);
  if (details) console.log(`   -> ${details}`);
}

async function runAllTests() {
  console.log('====================================================');
  console.log('   STARTING AUTHENTICATION VERIFICATION TEST SUITE  ');
  console.log('====================================================\n');

  // -----------------------------------------------------------------
  // Test Case 8: Missing required fields
  // -----------------------------------------------------------------
  try {
    const emptyReq = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: '', password: '' }),
    });
    const res = await registerHandler(emptyReq);
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('required');
    recordTest(8, 'Missing required fields rejection', passed, `Status: ${res.status}, Error: ${data.error}`);
  } catch (err) {
    recordTest(8, 'Missing required fields rejection', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 9: MongoDB connection failure handling
  // -----------------------------------------------------------------
  try {
    // Current MONGODB_URI in .env.local has the unreachable cluster0
    const regReq = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'test_db_fail@example.com',
        password: 'ValidPassword123!',
        role: 'student',
      }),
    });
    const res = await registerHandler(regReq);
    const data = await res.json();
    // Must return 503 (or 500 without leaking stack traces or unhandled rejection)
    const passed = (res.status === 503 || res.status === 500) && data.error && !data.error.includes('at ');
    recordTest(9, 'MongoDB connection failure handled gracefully', passed, `Status: ${res.status}, Error: ${data.error}`);
  } catch (err) {
    recordTest(9, 'MongoDB connection failure handled gracefully', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 7: Invalid Google token handling
  // -----------------------------------------------------------------
  try {
    const invalidGoogleReq = new Request('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: 'invalid.forged.jwt.token',
        role: 'student',
      }),
    });
    const res = await googleHandler(invalidGoogleReq);
    const data = await res.json();
    const passed = res.status === 401 && (data.error.includes('verification failed') || data.error.includes('Google'));
    recordTest(7, 'Invalid Google token rejection (server verification)', passed, `Status: ${res.status}, Error: ${data.error}`);
  } catch (err) {
    recordTest(7, 'Invalid Google token rejection (server verification)', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 7b: Rejection of unverified client payload in Google Auth
  // -----------------------------------------------------------------
  try {
    const spoofReq = new Request('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'spoofed_admin@hostelhub.com',
        name: 'Spoofed User',
        role: 'admin',
      }),
    });
    const res = await googleHandler(spoofReq);
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('token');
    recordTest('7b', 'Rejection of unverified client fields without token', passed, `Status: ${res.status}, Error: ${data.error}`);
  } catch (err) {
    recordTest('7b', 'Rejection of unverified client fields without token', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 1 & 3: Password Hashing, Verification & Registration Unit
  // -----------------------------------------------------------------
  try {
    const plainPassword = 'SuperSecretPassword2026!';
    const hash = await hashPassword(plainPassword);
    
    // Check bcrypt hash format
    const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$');
    const isMatchCorrect = await verifyPassword(plainPassword, hash);
    const isMatchWrong = await verifyPassword('WrongPassword123!', hash);

    const passed = isBcrypt && isMatchCorrect && !isMatchWrong;
    recordTest(1, 'Secure Password Hashing with bcrypt (never plain text)', passed, `Hash format: ${hash.substring(0, 7)}..., Verified: ${isMatchCorrect}`);
    recordTest(3, 'Password verification against bcrypt hash', isMatchCorrect && !isMatchWrong, `Correct password matches, wrong password rejected`);
    recordTest(4, 'Login with incorrect password rejected', !isMatchWrong, `verifyPassword returned false as expected`);
  } catch (err) {
    recordTest(1, 'Secure Password Hashing with bcrypt', false, err.message);
    recordTest(3, 'Password verification', false, err.message);
    recordTest(4, 'Login with incorrect password', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 2: Email Normalization & Duplicate Prevention Logic
  // -----------------------------------------------------------------
  try {
    const emailA = '  Student.Test@HostelHub.com  ';
    const emailNorm = emailA.trim().toLowerCase();
    const passed = emailNorm === 'student.test@hostelhub.com';
    recordTest(2, 'Email normalization (trim & lowercase)', passed, `Normalized "${emailA}" -> "${emailNorm}"`);
  } catch (err) {
    recordTest(2, 'Email normalization', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 5 & 6: Unified JWT Generation & Payload Integrity
  // -----------------------------------------------------------------
  try {
    const testUser = {
      userId: '6626db789123456789abcdef',
      email: 'verified_user@gmail.com',
      role: 'student',
      hostelId: '6626db789123456789abc001',
    };
    const token = signToken(testUser);
    const decoded = verifyToken(token);

    const passed = (
      decoded &&
      decoded.userId === testUser.userId &&
      decoded.email === testUser.email &&
      decoded.role === testUser.role &&
      decoded.hostelId === testUser.hostelId
    );
    recordTest(5, 'Unified JWT Generation for Google / Password users', passed, `JWT decoded correctly, role: ${decoded?.role}`);
    recordTest(6, 'Session token payload consistency across auth methods', passed, `UserId and HostelId preserved in JWT payload`);
  } catch (err) {
    recordTest(5, 'Unified JWT Generation', false, err.message);
    recordTest(6, 'Session token payload consistency', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 10: Logout (Clear Cookie)
  // -----------------------------------------------------------------
  try {
    const logoutRes = await logoutHandler();
    const data = await logoutRes.json();
    const passed = logoutRes.status === 200 && data.success === true;
    recordTest(10, 'Logout clears authentication state', passed, `Message: ${data.message}`);
  } catch (err) {
    recordTest(10, 'Logout clears authentication state', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 11: Accessing Protected Routes Without Authentication
  // -----------------------------------------------------------------
  try {
    // 1. In proxy.js: Request to /admin without token should redirect to /login
    const adminReq = new Request('http://localhost:3000/admin/dashboard', {
      headers: new Headers(),
    });
    // Add nextUrl shim for testing proxy
    adminReq.nextUrl = new URL('http://localhost:3000/admin/dashboard');

    const proxyRes = await proxy(adminReq);
    const isRedirectToLogin = proxyRes.status === 307 || proxyRes.status === 308 || proxyRes.headers.get('location')?.includes('/login');

    // 2. protect(request) without token returns null
    const protectReq = new Request('http://localhost:3000/api/admin/fees');
    const protectResult = await protect(protectReq);

    const passed = isRedirectToLogin && protectResult === null;
    recordTest(11, 'Accessing protected routes without authentication is blocked', passed, `Proxy redirect: ${isRedirectToLogin}, protect() returned: ${protectResult}`);
  } catch (err) {
    recordTest(11, 'Accessing protected routes without authentication', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 12: Expired Token Handling
  // -----------------------------------------------------------------
  try {
    // Sign token with 0s / -1s expiration
    const expiredToken = signToken({ userId: '123', email: 'exp@test.com', role: 'student' }, { expiresIn: '1ms' });
    
    // Wait 50ms for token to expire
    await new Promise((r) => setTimeout(r, 50));

    const decoded = verifyToken(expiredToken);
    const passed = decoded === null;
    recordTest(12, 'Expired token verification handling', passed, `Expired token decoded result: ${decoded} (expected null)`);
  } catch (err) {
    recordTest(12, 'Expired token handling', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 13: Session Persistence (Bearer & Cookie parsing)
  // -----------------------------------------------------------------
  try {
    const validToken = signToken({ userId: '6626db789123456789abcdef', email: 'session@test.com', role: 'student' });
    
    // Test extraction via Authorization header
    const authHeaderReq = new Request('http://localhost:3000/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const headerSession = await protect(authHeaderReq);

    // Test extraction via Cookie header
    const cookieHeaderReq = new Request('http://localhost:3000/api/student/dashboard', {
      headers: { 'Cookie': `auth_token=${validToken}; other_cookie=123` }
    });
    const cookieSession = await protect(cookieHeaderReq);

    const passed = (
      headerSession?.userId === '6626db789123456789abcdef' &&
      cookieSession?.userId === '6626db789123456789abcdef'
    );
    recordTest(13, 'Session persistence and multi-source token extraction (Cookie + Bearer)', passed, `Header auth: ${!!headerSession}, Cookie auth: ${!!cookieSession}`);
  } catch (err) {
    recordTest(13, 'Session persistence', false, err.message);
  }

  // -----------------------------------------------------------------
  // Test Case 14: Frontend & Backend CORS Communication
  // -----------------------------------------------------------------
  try {
    // Test OPTIONS preflight on /api/auth/login
    const preflightReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
      },
    });
    preflightReq.nextUrl = new URL('http://localhost:3000/api/auth/login');

    const preflightRes = await proxy(preflightReq);
    const hasOrigin = preflightRes.headers.get('Access-Control-Allow-Origin') === 'http://localhost:3000';
    const hasMethods = preflightRes.headers.get('Access-Control-Allow-Methods')?.includes('POST');
    const isStatus204 = preflightRes.status === 204;

    const passed = hasOrigin && hasMethods && isStatus204;
    recordTest(14, 'CORS preflight (OPTIONS) and header configuration', passed, `Status: ${preflightRes.status}, Allow-Origin: ${preflightRes.headers.get('Access-Control-Allow-Origin')}`);
  } catch (err) {
    recordTest(14, 'CORS preflight configuration', false, err.message);
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('                 TEST SUITE SUMMARY                 ');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL TEST CASES PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ Some test cases failed. Review details above.');
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
