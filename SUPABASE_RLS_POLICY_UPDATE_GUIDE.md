# Supabase RLS Policy Update Guide

**Project:** dcvrkpgvxqdcboostkpz (Laverdi Portal)  
**Date:** 2026-04-17  
**Purpose:** Add explicit "TO authenticated" clauses for PKCE flow compatibility  
**Status:** Ready to execute  

---

## Overview

This guide provides step-by-step instructions to update Supabase RLS (Row Level Security) policies for the Laverdi Portal to include explicit "TO authenticated" clauses. This is critical for PKCE (Proof Key for Code Exchange) authentication flow compatibility.

### Tables to Update
- `users`
- `profiles`
- `api_keys`
- `subscriptions`
- `usage_logs`

### Current Issue
Policies likely use implicit authenticated access, which may not work correctly with PKCE flow. We need explicit "TO authenticated" clauses on every policy.

### Solution
All policies will be updated to:
- ✅ Include explicit "TO authenticated" clauses
- ✅ Allow users to access only their own rows (WHERE auth.uid() = user_id)
- ✅ Allow service role to bypass RLS (for admin operations)
- ✅ Explicitly deny public/anon access

---

## Prerequisites

1. **Supabase Account Access**
   - You need access to: https://app.supabase.com
   - Project: dcvrkpgvxqdcboostkpz

2. **Administrative Permissions**
   - Must be able to access the SQL Editor in Supabase
   - Should have admin or owner role on the project

3. **Browser**
   - Chrome, Firefox, Safari, or Edge
   - JavaScript enabled

---

## Step 1: Access Supabase Dashboard

1. Go to: https://app.supabase.com
2. Login with your Supabase account credentials
3. Select project: **dcvrkpgvxqdcboostkpz** (Laverdi Portal)
4. In the left sidebar, click **SQL Editor**

---

## Step 2: Create New SQL Query

1. In the SQL Editor, click **+ New Query** (top right)
2. A new query editor will open
3. Copy the SQL script below (or from `SUPABASE_RLS_POLICY_UPDATE.sql`)

---

## Step 3: Copy the SQL Script

**File:** `SUPABASE_RLS_POLICY_UPDATE.sql`

The complete SQL script is provided and includes:

### Part A: View Current Policies
First query to understand existing RLS setup
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS condition,
    with_check,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profiles', 'api_keys', 'subscriptions', 'usage_logs')
ORDER BY tablename, policyname;
```

### Part B: Create/Update Policies with "TO authenticated"

For each table, policies are created with explicit "TO authenticated" clauses:

**USERS TABLE**
```sql
CREATE POLICY "allow_read_own_user" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
```

**PROFILES TABLE**
```sql
CREATE POLICY "allow_read_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

**API_KEYS TABLE**
```sql
CREATE POLICY "allow_read_own_api_keys" ON api_keys
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

**SUBSCRIPTIONS TABLE**
```sql
CREATE POLICY "allow_read_own_subscriptions" ON subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

**USAGE_LOGS TABLE**
```sql
CREATE POLICY "allow_read_own_usage_logs" ON usage_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

### Part C: Deny Anonymous Access

Explicit deny policies for anon/public:
```sql
CREATE POLICY "deny_anon_users" ON users
    FOR ALL
    TO anon, public
    USING (false)
    WITH CHECK (false);
```

---

## Step 4: Execute the Script

1. **Copy the entire SQL script** from `SUPABASE_RLS_POLICY_UPDATE.sql`
2. **Paste** into the Supabase SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. **Wait for completion** (usually 5-30 seconds depending on policy count)

### Expected Output

Green checkmarks ✅ or success messages for each policy creation:
```
CREATE POLICY
CREATE POLICY
CREATE POLICY
...
```

If you see red X's ❌ or errors, check the error message (usually means policy already exists with that name).

---

## Step 5: Verify Policies Were Applied

After running the main script, run the verification query to confirm:

```sql
-- View all updated policies
SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS condition,
    with_check,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'profiles', 'api_keys', 'subscriptions', 'usage_logs')
ORDER BY tablename, policyname;
```

**Expected Result:**
- 5 tables listed (users, profiles, api_keys, subscriptions, usage_logs)
- Each table has 3-4 policies
- All policies show "authenticated" in the roles column
- All policies have proper conditions (e.g., `auth.uid() = id`)

### Expected Policy Count
- **users:** 4 policies (SELECT, INSERT, UPDATE, DELETE policies)
- **profiles:** 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **api_keys:** 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **subscriptions:** 3 policies (SELECT, INSERT, UPDATE)
- **usage_logs:** 1 policy (SELECT only)

**Total: 16 policies**

---

## Step 6: Test Access

### Test 1: Authenticated User Access

Create a new authenticated session in your app and run:
```sql
SELECT * FROM users WHERE auth.uid() = id;
```

**Expected:** Returns only the current user's row

### Test 2: API Keys Access

As authenticated user, run:
```sql
SELECT * FROM api_keys WHERE auth.uid() = user_id;
```

**Expected:** Returns only the user's API keys

### Test 3: Verify Row Filtering

Try to select all rows:
```sql
SELECT * FROM users;
```

**Expected:** Returns only the current user's row (RLS enforced)

### Test 4: Service Role Bypass

The service role (backend/admin) can access all rows by using the service role key. This is used for admin operations and webhooks.

---

## Step 7: PKCE Flow Verification

After policies are updated, verify PKCE flow works:

### In your application:

1. **Signup with PKCE:**
   ```
   POST /api/auth/signup
   {
     "email": "test@example.com",
     "password": "secure_password"
   }
   ```
   ✅ User should be created and authenticated

2. **Login with PKCE:**
   ```
   POST /api/auth/login
   {
     "email": "test@example.com",
     "password": "secure_password"
   }
   ```
   ✅ User should receive session token

3. **Access Protected Endpoint:**
   ```
   GET /api/user/profile
   Authorization: Bearer {token}
   ```
   ✅ User should see only their own profile

---

## Troubleshooting

### Issue 1: "Policy already exists" Error
**Cause:** Policy with that name already exists

**Solution:**
- This is OK! Policies were already created
- Check if they have "TO authenticated" clause
- If not, drop and recreate (uncomment DROP section in script)

### Issue 2: "Permission denied" Error
**Cause:** User doesn't have admin rights on the project

**Solution:**
- Contact project owner
- Ask to be added as admin
- Or have owner run the script

### Issue 3: "Table does not exist" Error
**Cause:** One of the tables doesn't exist in the database

**Solution:**
- Check if table was created in migrations
- Run migrations to create missing tables
- List existing tables:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```

### Issue 4: RLS Not Enforcing
**Cause:** RLS might not be enabled on the table

**Solution:**
- Enable RLS explicitly:
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
  ```

---

## Policy Details

### users Table Policies

| Policy | Type | Access | Condition |
|--------|------|--------|-----------|
| allow_read_own_user | SELECT | authenticated | auth.uid() = id |
| allow_insert_own_user | INSERT | authenticated | auth.uid() = id |
| allow_update_own_user | UPDATE | authenticated | auth.uid() = id |
| deny_delete_own_user | DELETE | authenticated | false (denied) |
| deny_anon_users | ALL | anon, public | false (denied) |

### profiles Table Policies

| Policy | Type | Access | Condition |
|--------|------|--------|-----------|
| allow_read_own_profile | SELECT | authenticated | auth.uid() = user_id |
| allow_insert_own_profile | INSERT | authenticated | auth.uid() = user_id |
| allow_update_own_profile | UPDATE | authenticated | auth.uid() = user_id |
| allow_delete_own_profile | DELETE | authenticated | auth.uid() = user_id |
| deny_anon_profiles | ALL | anon, public | false (denied) |

### api_keys Table Policies

| Policy | Type | Access | Condition |
|--------|------|--------|-----------|
| allow_read_own_api_keys | SELECT | authenticated | auth.uid() = user_id |
| allow_insert_own_api_keys | INSERT | authenticated | auth.uid() = user_id |
| allow_update_own_api_keys | UPDATE | authenticated | auth.uid() = user_id |
| allow_delete_own_api_keys | DELETE | authenticated | auth.uid() = user_id |
| deny_anon_api_keys | ALL | anon, public | false (denied) |

### subscriptions Table Policies

| Policy | Type | Access | Condition |
|--------|------|--------|-----------|
| allow_read_own_subscriptions | SELECT | authenticated | auth.uid() = user_id |
| allow_insert_own_subscriptions | INSERT | authenticated | auth.uid() = user_id |
| allow_update_own_subscriptions | UPDATE | authenticated | auth.uid() = user_id |
| deny_anon_subscriptions | ALL | anon, public | false (denied) |

### usage_logs Table Policies

| Policy | Type | Access | Condition |
|--------|------|--------|-----------|
| allow_read_own_usage_logs | SELECT | authenticated | auth.uid() = user_id |
| deny_anon_usage_logs | ALL | anon, public | false (denied) |

---

## Rollback (If Needed)

If you need to revert these changes:

1. Go to Supabase SQL Editor
2. Drop the policies:
   ```sql
   DROP POLICY IF EXISTS "allow_read_own_user" ON users;
   DROP POLICY IF EXISTS "allow_insert_own_user" ON users;
   -- ... (drop all policies)
   ```
3. Recreate with old policy names (if backup available)
4. Or disable RLS and recreate as needed

---

## Success Criteria

✅ **All 16 policies created successfully**
✅ **Each policy has explicit "TO authenticated" clause**
✅ **Users can access only their own rows**
✅ **Service role can bypass RLS**
✅ **Anon/public access explicitly denied**
✅ **PKCE authentication flow works**
✅ **No errors in logs**

---

## Next Steps

1. **Notify Backend Team:** Let them know RLS policies are updated
2. **Test PKCE Flow:** Test signup/login in the app
3. **Monitor Logs:** Check for any access denied errors
4. **Performance Test:** Verify queries still perform well
5. **Documentation:** Update API docs with new access restrictions

---

## Contact

For questions or issues:
- Check Supabase documentation: https://supabase.com/docs/guides/auth/row-level-security
- Review error messages in SQL Editor
- Contact Supabase support if policies don't apply

---

## Files Included

1. **SUPABASE_RLS_POLICY_UPDATE.sql** - Complete SQL script
2. **SUPABASE_RLS_POLICY_UPDATE_GUIDE.md** - This guide
3. **update_rls_policies.py** - Python utility (for future automation)

---

**Last Updated:** 2026-04-17  
**Status:** Ready for execution  
**Complexity:** Medium (straightforward SQL execution)  
**Time Required:** 5-10 minutes  

