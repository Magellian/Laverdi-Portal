# RLS Policy Update Checklist

**Project:** dcvrkpgvxqdcboostkpz  
**Date:** 2026-04-17  
**Task:** Add explicit "TO authenticated" clauses to all RLS policies  

---

## Quick Reference

### Files You Need
- ✅ `SUPABASE_RLS_POLICY_UPDATE.sql` — SQL script to execute
- ✅ `SUPABASE_RLS_POLICY_UPDATE_GUIDE.md` — Detailed instructions
- ✅ `RLS_POLICY_CHECKLIST.md` — This checklist

### 5-Minute Quick Start

```
1. Open: https://app.supabase.com/project/dcvrkpgvxqdcboostkpz/sql/new
2. Create new SQL query
3. Copy script from SUPABASE_RLS_POLICY_UPDATE.sql
4. Paste into editor
5. Click "Run"
6. Check for green ✅ (success)
7. Done!
```

---

## Pre-Execution Checklist

- [ ] Have Supabase account access
- [ ] Can access project dcvrkpgvxqdcboostkpz
- [ ] Have SQL Editor access
- [ ] Read SUPABASE_RLS_POLICY_UPDATE_GUIDE.md
- [ ] Backed up database (optional but recommended)
- [ ] Have test account credentials ready

---

## Execution Checklist

### 1. Access Supabase Dashboard
- [ ] Go to https://app.supabase.com
- [ ] Login
- [ ] Select project: dcvrkpgvxqdcboostkpz
- [ ] Click "SQL Editor" in left sidebar

### 2. Create New Query
- [ ] Click "+ New Query" button (top right)
- [ ] Blank SQL editor opens
- [ ] Cursor blinking in editor

### 3. Copy SQL Script
- [ ] Open file: `SUPABASE_RLS_POLICY_UPDATE.sql`
- [ ] Select ALL text (Ctrl+A)
- [ ] Copy (Ctrl+C)
- [ ] Paste into Supabase editor (Ctrl+V)

### 4. Review Script (Optional)
- [ ] Scan for table names: users, profiles, api_keys, subscriptions, usage_logs
- [ ] Verify "TO authenticated" appears in policies
- [ ] Check that anon access is denied
- [ ] Look for service role grants

### 5. Execute Script
- [ ] Click "Run" button (or Ctrl+Enter)
- [ ] Wait for completion (5-30 seconds)

### 6. Check Results
- [ ] Look for green ✅ or "CREATE POLICY" messages
- [ ] No red ❌ errors (or only "already exists" errors)
- [ ] Scroll through output to verify all tables processed

### 7. View Created Policies
- [ ] Run verification query (provided in script)
- [ ] Confirm all 16 policies appear
- [ ] Verify "authenticated" role in each policy
- [ ] Check conditions are correct (WHERE auth.uid() = ...)

---

## Policies Being Created

### By Table

#### users (4 policies)
- [ ] allow_read_own_user (SELECT)
- [ ] allow_insert_own_user (INSERT)
- [ ] allow_update_own_user (UPDATE)
- [ ] deny_delete_own_user (DELETE - denied)

#### profiles (4 policies)
- [ ] allow_read_own_profile (SELECT)
- [ ] allow_insert_own_profile (INSERT)
- [ ] allow_update_own_profile (UPDATE)
- [ ] allow_delete_own_profile (DELETE)

#### api_keys (4 policies)
- [ ] allow_read_own_api_keys (SELECT)
- [ ] allow_insert_own_api_keys (INSERT)
- [ ] allow_update_own_api_keys (UPDATE)
- [ ] allow_delete_own_api_keys (DELETE)

#### subscriptions (3 policies)
- [ ] allow_read_own_subscriptions (SELECT)
- [ ] allow_insert_own_subscriptions (INSERT)
- [ ] allow_update_own_subscriptions (UPDATE)

#### usage_logs (1 policy)
- [ ] allow_read_own_usage_logs (SELECT)

#### All tables (5 policies - deny anon)
- [ ] deny_anon_users
- [ ] deny_anon_profiles
- [ ] deny_anon_api_keys
- [ ] deny_anon_subscriptions
- [ ] deny_anon_usage_logs

**TOTAL: 21 policies**

---

## Post-Execution Verification

### Database Verification
- [ ] Run: `SELECT COUNT(*) FROM pg_policies WHERE schemaname='public'`
- [ ] Result should be ≥ 21 policies
- [ ] Each policy has "authenticated" role

### Table Verification
- [ ] Run: `SELECT * FROM pg_policies WHERE tablename='users'`
- [ ] Confirm 4+ policies for users table
- [ ] Repeat for each table (profiles, api_keys, subscriptions, usage_logs)

### RLS Status
- [ ] Verify RLS is enabled: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY`
- [ ] Check for each table:
  - [ ] users
  - [ ] profiles
  - [ ] api_keys
  - [ ] subscriptions
  - [ ] usage_logs

### Access Testing
- [ ] [ ] Test as authenticated user:
  ```sql
  SELECT * FROM users WHERE auth.uid() = id;
  -- Should return 1 row (own user)
  ```

- [ ] [ ] Test anon access:
  ```sql
  SELECT * FROM users;
  -- Should fail (access denied) or return empty
  ```

- [ ] [ ] Test service role:
  ```sql
  SET ROLE service_role;
  SELECT * FROM users;
  -- Should return all rows
  ```

---

## PKCE Flow Testing

After policies are applied, test PKCE flow:

### Backend Integration
- [ ] Test signup endpoint: `POST /api/auth/signup`
- [ ] Test login endpoint: `POST /api/auth/login`
- [ ] Test profile creation: `POST /api/user/profile`
- [ ] Test API key creation: `POST /api/user/api-keys`

### Frontend Testing
- [ ] Signup with new account
- [ ] Login with credentials
- [ ] Access dashboard
- [ ] View profile (should show only own data)
- [ ] Generate API key
- [ ] View usage logs

### Error Handling
- [ ] Attempt to view another user's data → Should fail
- [ ] Attempt anon access → Should fail
- [ ] Service role operations → Should succeed

---

## Troubleshooting Checklist

### If Policies Don't Apply

- [ ] Check for SQL errors in output
- [ ] Verify correct Supabase project selected
- [ ] Confirm admin/owner permissions on project
- [ ] Check if tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```

### If Errors Occur

- [ ] "Policy already exists" → OK, policies are already there
- [ ] "Permission denied" → Need admin role on project
- [ ] "Table does not exist" → Run migrations to create tables
- [ ] "Column does not exist" → Check table schema

### If PKCE Flow Fails

- [ ] Verify policies were actually created (run verification query)
- [ ] Check if RLS is enabled on table
- [ ] Verify auth.uid() is working in your app
- [ ] Check Supabase logs for RLS errors
- [ ] Test with explicit WHERE clause to confirm RLS works

---

## Rollback Plan (If Needed)

If something goes wrong:

1. [ ] Don't panic - data is safe
2. [ ] Run DROP queries to remove new policies:
   ```sql
   DROP POLICY IF EXISTS "allow_read_own_user" ON users;
   DROP POLICY IF EXISTS "allow_insert_own_user" ON users;
   -- ... (drop each policy)
   ```
3. [ ] Recreate old policies from backup (if available)
4. [ ] Contact Supabase support if needed
5. [ ] Document what went wrong for next time

---

## Expected Outcomes

### Success Scenario ✅
- All 21 policies created
- "TO authenticated" appears in each
- Users can access only their own rows
- Service role can access all rows
- Anon/public access denied
- PKCE flow works perfectly
- No errors in application logs

### Common Warning (Not an Error)
- "Policy already exists" message
- This is fine - means policy was already created
- Just verify it has "TO authenticated" clause

### Failure Scenario ❌
- SQL execution fails with permission error
- Policies don't appear in verification query
- PKCE flow still broken after update
- Users can see other users' data

**If failure occurs:**
1. Check error message in SQL editor
2. Review troubleshooting section
3. Contact database admin or Supabase support

---

## Documentation Files

| File | Purpose | Status |
|------|---------|--------|
| SUPABASE_RLS_POLICY_UPDATE.sql | SQL script to execute | ✅ Ready |
| SUPABASE_RLS_POLICY_UPDATE_GUIDE.md | Detailed step-by-step guide | ✅ Ready |
| RLS_POLICY_CHECKLIST.md | This checklist | ✅ Ready |
| update_rls_policies.py | Python utility (future automation) | ✅ Ready |

---

## Sign-Off

### Before Execution
- [ ] Read guide completely
- [ ] Understand what policies do
- [ ] Have backup plan
- [ ] Know how to reach support if needed

### After Execution
- [ ] All policies created
- [ ] Verification queries passed
- [ ] PKCE flow tested
- [ ] Documentation updated
- [ ] Team notified

### Ready to Execute?
- [ ] Yes, all items checked ✅
- [ ] No, need clarification (see guide)

---

**Date Prepared:** 2026-04-17  
**Estimated Time:** 5-10 minutes  
**Complexity:** Medium  
**Risk Level:** Low (read-only verification only, no data modified)  
**Impact:** High (fixes PKCE authentication)  

