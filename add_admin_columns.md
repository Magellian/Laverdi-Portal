# Admin Panel Enhancement: Add User ID + Instance IP

## Goal
Display `user_id` and `instance ip_address` in the admin user list for quick reference and management.

## Changes Needed

### 1. Admin Users Table Component
**File:** `/root/laverdi-portal/pages/admin/users.tsx` (or similar)

Add columns to the user table:
```typescript
// In the table headers:
<th>Email</th>
<th>User ID</th>          // NEW
<th>Status</th>
<th>Instance IP</th>      // NEW
<th>Created</th>
<th>Actions</th>

// In the table body (map over users):
<td>{user.email}</td>
<td><code>{user.id}</code></td>              // NEW - use monospace font
<td>{user.status}</td>
<td>{user.instance?.ip_address || '-'}</td> // NEW - join with instances table
<td>{formatDate(user.created_at)}</td>
<td>
  <button onClick={() => editUser(user.id)}>Edit</button>
  <button onClick={() => deleteUser(user.id)}>Delete</button>
</td>
```

### 2. API Endpoint Enhancement
**File:** `/root/laverdi-portal/pages/api/admin/users.ts`

Make sure the query joins `instances` table:
```typescript
const { data, error } = await supabase
  .from('users')
  .select(`
    id,
    email,
    status,
    created_at,
    instances(id, ip_address, status)
  `)
  .order('created_at', { ascending: false });
```

### 3. UI Polish
- Use monospace font for user IDs (easier to copy/paste)
- Show "—" or "No instance" if no IP assigned yet
- Add copy-to-clipboard button for user ID

## Benefits
✅ Find Robin's user ID immediately from admin panel
✅ See instance IP without SSHing to portal
✅ Faster account management and debugging
✅ Can wipe accounts cleanly with correct IDs

## Quick Implementation
Would you like me to:
1. **Code it up** — Create the updated admin component
2. **Deploy it** — SSH to portal and update the files
3. **Verify** — Test that user IDs and IPs show correctly

Which approach? Or should I do all three?
