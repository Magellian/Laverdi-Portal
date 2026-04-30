# Session Persistence Fix - Testing Guide

## Quick Start

```bash
cd C:\Users\chris\Desktop\workspace\src\laverdi-portal
npm run build
npm run dev
```

Then visit: `http://localhost:3000`

## Test Cases

### Test 1: Login Creates Session in localStorage ✅

**Steps:**
1. Open DevTools (F12)
2. Go to Console tab
3. Clear localStorage: `localStorage.clear()`
4. Go to Login page
5. Sign in with test credentials
6. Check Console for logs starting with `[Auth]`

**Expected Result:**
```
[Auth] Sign-in successful {
  email: "test@example.com",
  userId: "xxx",
  hasAccessToken: true,
  sessionUser: "test@example.com"
}
[Auth] Session in localStorage: YES
[Auth] Stored session user: test@example.com
```

**Verify localStorage:**
- Application > localStorage
- Should see entry: `sb-auth-session`
- Contains JSON with user data and token

---

### Test 2: Session Survives Page Reload ✅

**Steps:**
1. Stay logged in on dashboard
2. Press Ctrl+R (or Cmd+R on Mac)
3. Check Console logs
4. Verify user stays logged in

**Expected Result:**
```
[App] Found stored session in localStorage
[App] Current Supabase session: {
  exists: true,
  user: "test@example.com",
  hasToken: true
}
[Dashboard] Loading user data...
[Dashboard] getCurrentUser result: {
  exists: true,
  email: "test@example.com",
  id: "xxx"
}
```

**Verify:**
- User stays on dashboard
- No redirect to login
- User email displays in navbar

---

### Test 3: Logout Clears Session ✅

**Steps:**
1. While logged in, click "Sign Out" button
2. Check Console logs
3. Check localStorage

**Expected Result:**
```
[Supabase] Session cleared from localStorage
```

**Verify localStorage:**
- Application > localStorage
- `sb-auth-session` should be GONE
- Only `laverdi_seen_welcome` and `trial-banner-dismissed` remain

**Verify Navigation:**
- Should redirect to login page
- Clicking dashboard redirects back to login

---

### Test 4: Session Lost → Must Login Again ✅

**Steps:**
1. Login successfully
2. Open DevTools
3. In Console, run: `localStorage.removeItem('sb-auth-session')`
4. Reload page
5. Check what happens

**Expected Result:**
- Page tries to load dashboard
- Gets user but localStorage is missing
- Actually should redirect to login since Supabase session is still valid

**Verify:**
- App handles missing localStorage gracefully
- No console errors
- Session can be restored by server-side session check

---

### Test 5: Environment Variables Check ✅

**Steps:**
1. Open DevTools Console
2. Check logs from app initialization

**Expected Result:**
```
[App] Supabase initialized on app load {
  url: "configured",
  key: "configured"
}
```

**If you see:**
```
url: "MISSING"
key: "MISSING"
```

**Then:**
- Check `.env.local` exists
- Run `npm run build` again
- Restart dev server with `npm run dev`

---

### Test 6: Multiple Tabs/Windows ✅

**Steps:**
1. Login in Tab 1
2. Open Tab 2 to same app
3. Refresh Tab 2

**Expected Result:**
- Both tabs show logged-in state
- Session is shared across tabs (via localStorage + Supabase auth)
- Logout in Tab 1 affects Tab 2 on refresh

---

### Test 7: Different Users ✅

**Steps:**
1. Login as User A
2. Note the user email in navbar
3. Logout
4. Login as User B
5. Verify correct user is shown

**Expected Result:**
- localStorage updates with User B session
- Dashboard shows User B's data
- API Key is User B's API Key
- Subscription is User B's subscription

---

### Test 8: Long Session Survival ✅

**Steps:**
1. Login successfully
2. Leave browser open for 10+ minutes
3. Try to access dashboard or API
4. Reload page after 1 hour

**Expected Result:**
- Short term: Works fine
- After 1 hour: Supabase refresh token refreshes access token
- Still logged in after reload

**Note:** Access tokens expire in ~1 hour, refresh tokens are long-lived. Supabase handles this automatically.

---

### Test 9: Browser Privacy Mode ✅

**Steps:**
1. Open incognito/private window
2. Visit `http://localhost:3000`
3. Login
4. Reload page
5. Check if session persists

**Expected Result:**
- Session works in private mode
- localStorage available (not disabled by default)
- If localStorage disabled: App should still work with cookies

---

### Test 10: Console Logs Verification ✅

**Steps:**
1. Open DevTools > Console
2. Login
3. Go to Dashboard
4. Reload page
5. Logout

**Expected Logs:**

**On App Load:**
```
[App] Supabase initialized on app load {
  url: "configured",
  key: "configured"
}
```

**After Login:**
```
[Auth] Sign-in successful {...}
[Auth] Session in localStorage: YES
[Supabase] Session persisted to localStorage {...}
```

**On Dashboard:**
```
[Dashboard] Loading user data...
[Dashboard] getCurrentUser result {...}
```

**On Reload:**
```
[App] Found stored session in localStorage
[App] Current Supabase session {...}
```

**On Logout:**
```
[Supabase] Session cleared from localStorage
```

---

## Debugging Checklist

If session is NOT persisting:

### Check 1: Environment Variables
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Should output actual URLs/keys, not blank.

### Check 2: Build Status
```bash
npm run build
```

Should complete without errors. If errors about undefined env vars, the build was run before .env.local existed.

### Check 3: Browser Console
Watch for error messages:
- `[Supabase] Failed to persist session`
- `[Auth] Sign-in failed`
- `SUPABASE_URL is undefined`

### Check 4: localStorage Availability
In Console:
```javascript
console.log('localStorage available:', !!localStorage)
localStorage.setItem('test', 'value')
console.log('localStorage works:', localStorage.getItem('test'))
```

### Check 5: Network Tab
During login:
1. Look for API calls to `supabase.co`
2. Check response status (should be 2xx)
3. Look for auth token in response
4. Check for Set-Cookie headers

### Check 6: Browser Extensions
Some privacy extensions block localStorage:
- Try incognito mode
- Disable extensions temporarily
- Try different browser

### Check 7: Mixed Content Issues
If on HTTPS but Supabase is HTTP (unlikely):
- Check browser console for mixed content warnings
- Usually shows as blocked API calls

---

## Common Issues

### Issue: "SUPABASE_URL is undefined"
**Solution:**
- Verify `.env.local` exists in project root
- Run `npm run build` again
- Restart `npm run dev`

### Issue: localStorage shows empty after login
**Solution:**
- Check browser console for `[Supabase]` errors
- Try in incognito mode (rules out extensions)
- Check if localStorage is disabled in browser
- Verify `npm run build` was run after .env.local created

### Issue: User redirects to login after page reload
**Solution:**
- Check if `sb-auth-session` in localStorage
- If missing, build/env var issue (see above)
- If present, Supabase session might be expired
- Try logging in again
- Check if refresh token is valid

### Issue: Logout doesn't clear session
**Solution:**
- Check browser console for `[Supabase] Session cleared` log
- Manually run in Console: `localStorage.removeItem('sb-auth-session')`
- Hard refresh page (Ctrl+Shift+R)
- Check if Supabase session cleared (check cookies)

### Issue: "Session persisted to localStorage" doesn't appear
**Solution:**
- Check if `createBrowserClient()` is being called
- Look for other console errors before this message
- Check if `onAuthStateChange` listener is set up
- Try signing up instead of signing in
- Check Supabase project is running

---

## Performance Notes

The session persistence adds minimal overhead:
- ~1KB extra to localStorage
- Single listener setup (not re-run per component)
- Listener only fires on auth state change (not on every render)

No performance impact on page loads or navigation.

---

## Security Notes

This implementation maintains security:
- Primary session storage is HTTP-only cookies (secure)
- localStorage is secondary for client-side checks
- localStorage can be cleared by browser at any time
- Server validates all requests with cookie-based session
- PKCE flow prevents token theft
- No sensitive data exposed in localStorage beyond what Supabase SDK stores

---

## Success Criteria

✅ All of the following should be true:

1. User can login without errors
2. Console shows `[Auth] Sign-in successful` log
3. localStorage has `sb-auth-session` after login
4. Reload page → user stays logged in
5. Console shows session restored logs
6. Dashboard loads with correct user data
7. Logout clears localStorage
8. Another login works with different user
9. No console errors (except any app-specific ones)
10. API calls work with authenticated user

---

## Next: Production Deployment

Once all tests pass:

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to hosting (Vercel, Railway, etc.)
```

The fix is production-ready and maintains backward compatibility.
