# Student Dashboard Blank Screen - Debugging & Testing Guide

## Problem Summary
After login redirect to `/student/dashboard`, the page shows a blank/black screen with no loader visible.

## Root Causes Fixed
1. ✅ **ProtectedRoute returning null** - Now shows loader during redirect
2. ✅ **AuthContext loading state** - Added logging & error handling
3. ✅ **Session endpoint** - Added logging for hostelStatus tracking
4. ✅ **Dashboard hook** - Added retry logic & better error handling
5. ✅ **Login redirect race condition** - Added console logging to track flow

---

## Testing Steps

### Step 1: Open Browser DevTools
1. **F12** or **Cmd+Option+I** (Mac)
2. Navigate to **Console** tab

### Step 2: Clear Session & Login Fresh
1. Go to **Application** tab
2. Clear **Cookies** and **Local Storage**
3. Reload page
4. Login with test student account

### Step 3: Monitor Console Logs During Login

You should see these logs in order:

```
[LOGIN-REDIRECT] User already authenticated: { currentRole: "student", hostelStatus: "APPROVED" }
[LOGIN-REDIRECT] Redirecting to dashboard
[AUTH] Fetching session...
[AUTH] Session authenticated: { role: "student", hostelId: "...", hostelStatus: "APPROVED" }
[DASHBOARD-PAGE] State: { user: "...", hostelStatus: "APPROVED", isLoading: true, hasData: false, hasError: false, loading: true }
[DASHBOARD-HOOK] Fetching dashboard data for: ...
[DASHBOARD-HOOK] Data fetched successfully
[DASHBOARD-PAGE] State: { user: "...", hostelStatus: "APPROVED", isLoading: false, hasData: true, hasError: false, loading: false }
```

### Step 4: Check Network Tab
1. Open **Network** tab
2. Filter for: `session` and `dashboard`
3. Both should return **200 OK**

#### Expected Responses:

**GET /api/auth/session:**
```json
{
  "authenticated": true,
  "user": {
    "hostelStatus": "APPROVED",
    "hostelId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "role": "student"
  }
}
```

**GET /api/student/dashboard:**
```json
{
  "profile": { "name": "Student Name", ... },
  "room": { "roomNumber": "101", ... },
  "fees": [...],
  "complaints": [...]
}
```

---

## Troubleshooting Checklist

### ❌ Still Seeing Blank Screen?

1. **Check AuthContext loading state:**
   ```javascript
   // In Console
   console.log(window.sessionStorage.getItem('hostel-id'));
   // Should return a hostel ID, not null
   ```

2. **Check if session endpoint returns 401:**
   - Network tab → Session → Response
   - If `authenticated: false`, the session cookie wasn't set properly
   - **Fix:** Clear cookies and login again

3. **Check if hostelStatus is PENDING or NO_HOSTEL:**
   - Should be `APPROVED` for dashboard to show
   - **Fix:** Check if student's hostelStatus in MongoDB is set correctly

4. **Try hard refresh:**
   - **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
   - This clears browser cache

---

## MongoDB Query to Verify Student Status

```javascript
// In MongoDB Shell
db.students.findOne(
  { email: "student@example.com" },
  { hostelId: 1, hostelStatus: 1, status: 1 }
)

// Expected output:
// {
//   _id: ObjectId(...),
//   hostelId: ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
//   hostelStatus: "APPROVED",
//   status: "Active"
// }
```

If `hostelStatus` is not set, update it:
```javascript
db.students.updateOne(
  { email: "student@example.com" },
  { $set: { hostelStatus: "APPROVED" } }
)
```

---

## Key Console Logs to Watch

| Log | What It Means |
|-----|---------------|
| `[LOGIN] Login successful` | Login API succeeded ✅ |
| `[AUTH] Session authenticated` | Session loaded, auth confirmed ✅ |
| `[DASHBOARD-HOOK] Fetching dashboard data` | Data fetch started ✅ |
| `[DASHBOARD-HOOK] Data fetched successfully` | Data loaded, dashboard should render ✅ |
| **[SESSION] No session found** | ❌ Cookie not set, login didn't work |
| **[AUTH] Session validation failed** | ❌ Session endpoint errored |
| **[DASHBOARD-HOOK] Failed to fetch** | ❌ API returned error |

---

## If Issues Persist

### Collect This Information:
1. Copy entire **Console** output (Ctrl+A → Ctrl+C)
2. Check **Network** tab:
   - All API responses (session, dashboard)
   - Any 401/403 errors
3. Check **Application** tab:
   - Are cookies present?
   - SessionStorage values

### Debug Command
Add this to browser console to get full state dump:
```javascript
console.log({
  cookies: document.cookie,
  hostelId: sessionStorage.getItem('hostel-id'),
  url: window.location.href,
  timestamp: new Date().toISOString()
});
```

---

## Expected Flow (Correct Behavior)

```
1. User at /login
2. User enters credentials → POST /api/auth/login ✅
3. API sets auth_token cookie
4. Page calls refreshUser() → GET /api/auth/session ✅
5. AuthContext updates with user data + hostelStatus: "APPROVED"
6. useEffect detects changes → router.replace('/student/dashboard')
7. Redirected to /student/dashboard
8. ProtectedRoute checks auth → PASSES ✅
9. StudentLayout renders
10. Dashboard page loads → useStudentDashboard runs
11. useQuery checks: hostelStatus === "APPROVED" && studentId exists
12. Query enabled → Calls GET /api/student/dashboard ✅
13. Data returned → Component renders dashboard
14. ✅ Content visible!
```

If it breaks anywhere, the console logs will tell you where.

---

## Performance Notes

- **Session endpoint:** Should return in < 100ms
- **Dashboard API:** Should return in < 200ms
- **Total redirect to render:** < 1 second

If slower, check:
- Database connection
- Network latency
- Server load

