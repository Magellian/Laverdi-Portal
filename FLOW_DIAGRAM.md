# Session Persistence Flow Diagram

## Login Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────────┐
│ USER CLICKS LOGIN                                               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   signIn(email, password)     │ (lib/auth.ts)
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  createBrowserClient()        │ (lib/supabase.ts)
        │  ├─ @supabase/ssr             │
        │  └─ onAuthStateChange         │ ◄── KEY FIX
        │     listener attached         │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │  supabase.auth.signInWithPassword()   │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌─────────────────────────────────────────┐
        │  SUPABASE VALIDATES CREDENTIALS        │
        │  ├─ Check email/password correct       │
        │  └─ Generate access + refresh tokens   │
        └───────────────┬─────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
  ┌────────────────┐           ┌──────────────────┐
  │ HTTP-ONLY      │           │ Trigger:         │
  │ COOKIE         │           │ onAuthStateChange│
  │ (Server only)  │           │ with session     │
  └────────────────┘           └────────┬─────────┘
                                       │
                                       ▼
                               ┌──────────────────────────┐
                               │ localStorage.setItem()   │
                               │ 'sb-auth-session'        │
                               │ = { user, token, ... }   │ ◄── FIX HERE
                               └──────────────────────────┘
                                       │
                                       ▼
                               ┌──────────────────────┐
                               │ Return to dashboard  │
                               │ (redirect /dashboard)│
                               └────────────────────┘
```

## Dashboard Page Load (Fixed)

```
┌─────────────────────────────────────────────────┐
│ USER GOES TO /DASHBOARD                         │
└──────────────────┬────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ _app.tsx useEffect   │ ◄── FIX
        │ Runs on app load     │
        └──────────┬───────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
  ┌─────────────────┐  ┌──────────────────┐
  │ Check env vars  │  │ Check localStorage
  │ CONFIGURED?     │  │ for sb-auth-session
  └────────────────┘  └──────┬───────────┘
                             │
                             ▼
                      ┌──────────────────┐
                      │ Session found?   │
                      │ YES ◄────────────┤─── KEY FIX
                      └────────┬─────────┘
                               │
                               ▼
        ┌──────────────────────────────────┐
        │ pages/dashboard/index.tsx        │
        │ useEffect → loadUserData()       │
        └──────────────┬───────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │ getCurrentUser()                 │ (lib/auth.ts)
        │ createBrowserClient()            │ ◄── Returns user
        │ supabase.auth.getUser()          │
        └──────────────┬───────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ┌─────────────┐          ┌────────────────┐
    │ User found  │          │ User not found │
    │ Load profile│          │ Redirect login │
    │ Load usage  │          └────────────────┘
    │ Show data   │
    └─────────────┘
         │
         ▼
    ┌──────────────────┐
    │ Dashboard ready  │
    │ User logged in   │
    └──────────────────┘
```

## Page Reload (Fixed)

```
┌─────────────────────────────────────────────┐
│ USER RELOADS PAGE (Ctrl+R)                  │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Browser loads app      │
         │ _app.tsx runs useEffect│ ◄── FIX
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │ createBrowserClient()      │
         │ Sets up listeners again    │
         └────────────┬───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────────────┐    ┌────────────────────┐
    │ Check localStorage│   │ Check Supabase     │
    │ sb-auth-session?│   │ for valid session   │
    └────────┬────────┘    └────────┬───────────┘
             │                      │
             ▼ YES                  ▼ YES
         ┌────────────────┐    ┌──────────────┐
         │ Session restored│◄───Session valid │ ◄── Both checks!
         │ User stays in   │    │ Both agree   │
         │ dashboard       │    │ on user      │
         └────────────────┘    └──────────────┘
             │
             └────────────────────┐
                                  ▼
                      ┌──────────────────────┐
                      │ User can interact    │
                      │ with dashboard       │
                      │ No new login needed  │
                      └──────────────────────┘
```

## Logout Flow (Fixed)

```
┌─────────────────────────────────────┐
│ USER CLICKS "SIGN OUT"              │
└────────────────┬────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │ signOut()            │ (lib/auth.ts)
      └─────────┬────────────┘
                │
                ▼
      ┌──────────────────────────┐
      │ supabase.auth.signOut()  │
      └─────────┬────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
   ┌────────────┐    ┌──────────────────┐
   │ Clear HTTP │    │ Trigger:         │
   │ only cookie│    │ onAuthStateChange│
   │ (server)   │    │ with session=null│ ◄── FIX
   └────────────┘    └────────┬─────────┘
                              │
                              ▼
                      ┌──────────────────────┐
                      │ localStorage.remove  │
                      │ Item('sb-auth-session
')                      │ ◄── FIX: CLEARS HERE
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ Both cleared:        │
                      │ ✓ Cookie removed     │
                      │ ✓ localStorage cleared
│
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ router.push('/')     │
                      │ Redirect to home     │
                      └──────────────────────┘
```

## Architecture: Before vs After

### BEFORE (Broken)
```
Login Page                Dashboard Page
    │                          │
    └─► signIn()               │
         │                     │
         ▼                     │
    Supabase ◄─────────────────┤─── getUser() ❌ NO SESSION
         │                     │
         ├─► HTTP Cookie ✓     │
         │                     │
         └─► localStorage ✗    │
              (NOT SET)        │
                               │
                               └─► REDIRECT LOGIN ❌
```

### AFTER (Fixed)
```
Login Page                Dashboard Page
    │                          │
    └─► signIn()               │
         │                     │
         ▼                     │
    Supabase ◄─────────────────┤─── getUser() ✓ SESSION FOUND
         │                     │
         ├─► HTTP Cookie ✓     │
         │                     │
         └─► localStorage ✓    │
              (SET HERE) ◄────────── CHECK FIRST
                               │
                               └─► LOAD DASHBOARD ✓
```

## Key Components

### 1. createBrowserClient() - lib/supabase.ts
```
Sets up listener:
onAuthStateChange → save/clear localStorage
```

### 2. signIn() - lib/auth.ts
```
Calls createBrowserClient()
→ Listener fires
→ localStorage updated
→ Return to dashboard
```

### 3. _app.tsx
```
App loads → Check localStorage
→ Verify with Supabase
→ Initialize client
```

### 4. Dashboard
```
Load → getCurrentUser()
→ User found from session
→ Display dashboard
```

## Data Flow: Session from Login to Dashboard

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  SUPABASE RETURNS:                                   │
│  {                                                   │
│    user: { id, email, ... },                        │
│    session: {                                        │
│      access_token: "xxx",                           │
│      refresh_token: "yyy",                          │
│      user: { ... }                                   │
│    }                                                 │
│  }                                                   │
│                                                      │
└──────────────┬───────────────────────────────────────┘
               │
               ├─► HTTP-Only Cookie (Secure)
               │    └─► Server-side validation only
               │
               └─► onAuthStateChange listener fires
                    │
                    └─► localStorage.setItem('sb-auth-session', JSON.stringify(session))
                         │
                         └─► Page reload can restore session
                              └─► Dashboard loads user data
                                   └─► User sees dashboard ✓
```

## Summary

**The Fix:** Set up an `onAuthStateChange` listener that persists the session to localStorage whenever the auth state changes.

**Result:** 
- Session survives page reloads
- User stays logged in after redirect
- Logout properly clears session
- Multiple tabs stay in sync
- All data is available immediately on page load

**Security:**
- Primary storage still secure (HTTP-only cookies)
- localStorage is secondary for client-side checks
- Server validates all requests
- No sensitive data exposed unnecessarily
