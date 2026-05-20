# Admin Panel Audit & Rebuild

## Current Issues
1. ❌ **Delete button not working** — needs investigation
2. ❌ **No user ID visible** — users can only see email
3. ❌ **No instance IP visible** — can't see server details at a glance
4. ❌ **No way to see who's online** — critical for server management
5. ❌ **Missing bulk actions** — need to manage multiple instances

## Scope: Full Professional Rebuild

### Part 1: Database Schema Review
- Verify `users` table has all needed fields
- Check `instances` table has all needed fields
- Ensure proper foreign keys and indexing

### Part 2: API Layer
- `/api/admin/users` — List all users with instances (NO DELETE YET)
- `/api/admin/users/:id` — Get single user + instances
- `/api/admin/users/:id/delete` — DELETE user + cascade delete instances
- `/api/admin/instances` — List instances with user info
- `/api/admin/instances/:id/delete` — DELETE instance from Vultr + DB
- Proper error handling, logging, confirmations

### Part 3: Frontend UI
- **Users Table:**
  - User ID (clickable to copy)
  - Email
  - Status (provisioning/ready/failed)
  - Instance Count
  - Instance IPs (comma-separated)
  - Created Date
  - Actions (View, Edit, Delete with confirmation)

- **Instances Table:**
  - Instance ID (short + full on hover)
  - User Email
  - IP Address
  - Status
  - Created Date
  - Last Activity (if tracked)
  - Actions (SSH, Terminate, Logs)

- **Dashboard:**
  - Total users
  - Total active instances
  - Recent signups
  - Failed provisions
  - Quick stats

### Part 4: UX/Security
- Confirmation dialogs with explicit typing (type "DELETE <email>" to confirm)
- Toast notifications for actions
- Audit logging of who deleted what when
- Rate limiting on delete endpoints
- Proper auth checks on all endpoints

### Part 5: Edge Cases
- User with no instance
- Instance with orphaned user (user deleted but instance remains)
- In-progress provisions (don't allow delete)
- Failed provisions cleanup
- Vultr API failures during deletion

## Implementation Plan

**Step 1:** Check current admin code structure
**Step 2:** Design API endpoints properly
**Step 3:** Build backend with error handling
**Step 4:** Build frontend with proper state management
**Step 5:** Add audit logging
**Step 6:** Test delete flow end-to-end

Let's go.
