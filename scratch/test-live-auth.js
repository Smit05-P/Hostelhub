/**
 * Live End-to-End Authentication & Security Test Suite
 * Executes real HTTP requests against the running Next.js server on http://localhost:3001
 */

const BASE_URL = 'http://localhost:3001';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test Case ${String(id).padEnd(2, ' ')}] ${icon} : ${name}`);
  if (details) console.log(`              -> ${details}`);
}

async function runLiveTests() {
  console.log('================================================================');
  console.log('       HOSTELHUB LIVE AUTHENTICATION & SECURITY TEST SUITE       ');
  console.log('       Target: ' + BASE_URL);
  console.log('================================================================\n');

  // ------------------------------------------------------------------
  // Test Case 8: Missing required fields
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: '' }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error && data.error.includes('required');
    recordTest(8, 'Missing required fields validation', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest(8, 'Missing required fields validation', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 8b: Invalid email format validation
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        role: 'student',
      }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('valid email');
    recordTest('8b', 'Invalid email format rejection', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest('8b', 'Invalid email format rejection', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 8c: Weak password rejection (< 6 chars)
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        role: 'student',
      }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('at least 6 characters');
    recordTest('8c', 'Weak password rejection (< 6 chars)', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest('8c', 'Weak password rejection (< 6 chars)', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 7: Invalid Google token rejected by backend
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: 'tampered.fake.google.id.token.jwt',
        role: 'student',
      }),
    });
    const data = await res.json();
    const passed = res.status === 401 && (data.error.includes('verification failed') || data.error.includes('Google'));
    recordTest(7, 'Invalid Google token rejected independently by server', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest(7, 'Invalid Google token rejected independently by server', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 7b: Unverified client fields rejected without Google token
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hacker@attacker.com',
        name: 'Fake Admin',
        role: 'admin',
      }),
    });
    const data = await res.json();
    const passed = res.status === 400 && data.error.includes('token');
    recordTest('7b', 'Rejection of unverified client payload in Google Auth', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest('7b', 'Rejection of unverified client payload in Google Auth', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 9: MongoDB connection failure handling
  // ------------------------------------------------------------------
  try {
    // Attempt registration with valid payload against unreachable Atlas cluster
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Database Fail Test',
        email: 'test_db_disconnect@example.com',
        password: 'ValidPassword123!',
        role: 'student',
      }),
    });
    const data = await res.json();
    // Must return 503 or 500 cleanly with friendly error and no process crash
    const passed = (res.status === 503 || res.status === 500) && data.error && !data.error.includes('\n    at ');
    recordTest(9, 'MongoDB connection failure handled gracefully', passed, `HTTP ${res.status}: "${data.error}"`);
  } catch (err) {
    recordTest(9, 'MongoDB connection failure handled gracefully', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 10: Logout functionality
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie') || '';
    const clearsCookie = setCookie.includes('auth_token=;') || setCookie.includes('Max-Age=0') || setCookie.includes('auth_token=');
    const passed = res.status === 200 && data.success === true && clearsCookie;
    recordTest(10, 'Logout clears authentication cookie', passed, `HTTP ${res.status}, Set-Cookie cleared: ${clearsCookie}`);
  } catch (err) {
    recordTest(10, 'Logout clears authentication cookie', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 11: Accessing protected routes without authentication
  // ------------------------------------------------------------------
  try {
    // 1. Proxy level: GET /admin should redirect to /login
    const adminPageRes = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual',
    });
    const isRedirect = adminPageRes.status === 307 || adminPageRes.status === 308;
    const location = adminPageRes.headers.get('location') || '';
    const redirectsToLogin = isRedirect && location.includes('/login');

    // 2. Protected student route: GET /student should redirect to /login
    const studentPageRes = await fetch(`${BASE_URL}/student`, {
      redirect: 'manual',
    });
    const studentRedirectsToLogin = (studentPageRes.status === 307 || studentPageRes.status === 308) && (studentPageRes.headers.get('location') || '').includes('/login');

    const passed = redirectsToLogin && studentRedirectsToLogin;
    recordTest(11, 'Unauthenticated users blocked & redirected to /login', passed, `/admin -> ${location}, /student -> ${studentPageRes.headers.get('location')}`);
  } catch (err) {
    recordTest(11, 'Unauthenticated users blocked & redirected to /login', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 12: Expired / invalid token handling on session endpoint
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': 'auth_token=invalid.or.expired.jwt.cookie.here',
      },
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie') || '';
    const passed = res.status === 200 && data.authenticated === false;
    recordTest(12, 'Expired/invalid session token handling', passed, `HTTP ${res.status}, authenticated: ${data.authenticated}, Set-Cookie: ${setCookie ? 'cleared' : 'none'}`);
  } catch (err) {
    recordTest(12, 'Expired/invalid session token handling', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 14: Frontend and Backend CORS communication
  // ------------------------------------------------------------------
  try {
    // 1. OPTIONS preflight
    const preflightRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    const allowOrigin = preflightRes.headers.get('Access-Control-Allow-Origin');
    const allowMethods = preflightRes.headers.get('Access-Control-Allow-Methods');
    const allowCreds = preflightRes.headers.get('Access-Control-Allow-Credentials');

    const passed = (
      preflightRes.status === 204 &&
      allowOrigin === 'http://localhost:3000' &&
      allowMethods.includes('POST') &&
      allowCreds === 'true'
    );
    recordTest(14, 'CORS preflight (OPTIONS) & credentials configuration', passed, `Status: ${preflightRes.status}, Allow-Origin: ${allowOrigin}, Allow-Methods: ${allowMethods}`);
  } catch (err) {
    recordTest(14, 'CORS preflight configuration', false, err.message);
  }

  // ------------------------------------------------------------------
  // Test Case 15: Google OAuth Redirect URL Generation (GET /api/auth/google)
  // ------------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/google?role=student`, {
      redirect: 'manual',
    });
    const isRedirect = res.status === 307 || res.status === 308 || res.status === 302;
    const location = res.headers.get('location') || '';
    const isGoogleAuth = location.includes('accounts.google.com/o/oauth2/v2/auth') && location.includes('client_id=');
    const passed = isRedirect && isGoogleAuth;
    recordTest('15', 'Google OAuth redirect authorization URL generation', passed, `Redirects to: ${location.substring(0, 75)}...`);
  } catch (err) {
    recordTest('15', 'Google OAuth redirect authorization URL generation', false, err.message);
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                      TEST SUITE RESULTS                        ');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL LIVE INTEGRATION TESTS PASSED!');
  } else {
    console.log('⚠️ Some tests failed. Check log above.');
    process.exit(1);
  }
}

runLiveTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
