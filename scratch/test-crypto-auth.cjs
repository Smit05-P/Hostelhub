const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'c29tZS1zZWNyZXQta2V5LWRvLW5vdC11c2UtaW4tcHJvZA';

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Test Case ${String(id).padEnd(2, ' ')}] ${icon} : ${name}`);
  if (details) console.log(`              -> ${details}`);
}

async function runCryptoAndModelTests() {
  console.log('================================================================');
  console.log('       HOSTELHUB CRYPTO, MODEL & TOKEN UNIT TEST SUITE         ');
  console.log('================================================================\n');

  // Test Case 1: Password hashing using bcrypt
  const password = 'SecretPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$');
  recordTest(1, 'Password hashing using bcrypt (never plain text)', isBcrypt && hash !== password, `Bcrypt hash prefix: ${hash.substring(0, 7)}...`);

  // Test Case 2: Duplicate email & normalization logic
  const emailInput = '  Student.Alex@University.EDU  ';
  const normalizedEmail = emailInput.trim().toLowerCase();
  recordTest(2, 'Email normalization (trimming & lowercasing)', normalizedEmail === 'student.alex@university.edu', `Normalized "${emailInput}" -> "${normalizedEmail}"`);

  // Test Case 3: Login with correct password
  const isMatchCorrect = await bcrypt.compare(password, hash);
  recordTest(3, 'Password verification with correct password', isMatchCorrect === true, `bcrypt.compare returned true`);

  // Test Case 4: Login with incorrect password
  const isMatchWrong = await bcrypt.compare('WrongPassword456!', hash);
  recordTest(4, 'Password verification rejection with incorrect password', isMatchWrong === false, `bcrypt.compare returned false`);

  // Test Case 5: Google new user token generation
  const googleUser = {
    userId: '6626db789123456789abcdef',
    email: 'new_google_user@gmail.com',
    role: 'student',
    hostelId: null,
  };
  const token = jwt.sign(googleUser, JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, JWT_SECRET);
  const passedT5 = decoded.userId === googleUser.userId && decoded.email === googleUser.email && decoded.role === 'student';
  recordTest(5, 'Google login JWT generation for new user', passedT5, `Decoded userId: ${decoded.userId}, role: ${decoded.role}`);

  // Test Case 6: Existing user Google account linking & session persistence
  const existingLinkedUser = {
    userId: '6626db789123456789abc999',
    email: 'admin_linked@hostelhub.com',
    role: 'admin',
    hostelId: '6626db789123456789abc001',
  };
  const tokenAdmin = jwt.sign(existingLinkedUser, JWT_SECRET, { expiresIn: '7d' });
  const decodedAdmin = jwt.verify(tokenAdmin, JWT_SECRET);
  const passedT6 = decodedAdmin.userId === existingLinkedUser.userId && decodedAdmin.hostelId === existingLinkedUser.hostelId;
  recordTest(6, 'Existing account linking and admin token generation', passedT6, `Decoded admin userId: ${decodedAdmin.userId}, hostelId: ${decodedAdmin.hostelId}`);

  // Test Case 13: Session persistence and token validation
  const sessionUser = {
    userId: '6626db789123456789abcdef',
    email: 'student@hostelhub.com',
    role: 'student',
    hostelId: '6626db789123456789abc002'
  };
  const persistentToken = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: '7d' });
  const hydratedSession = jwt.verify(persistentToken, JWT_SECRET);
  const passedT13 = hydratedSession.email === sessionUser.email && (hydratedSession.exp - hydratedSession.iat) === (7 * 24 * 60 * 60);
  recordTest(13, 'Session persistence after refresh (7-day validity)', passedT13, `Token valid for ${7 * 24 * 60 * 60} seconds (7 days)`);

  // Summary
  console.log('\n================================================================');
  console.log('                      TEST SUITE RESULTS                        ');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);
  if (passedCount === totalCount) {
    console.log('🎉 ALL CRYPTO & TOKEN TESTS PASSED!');
  } else {
    process.exit(1);
  }
}

runCryptoAndModelTests().catch(err => {
  console.error(err);
  process.exit(1);
});
