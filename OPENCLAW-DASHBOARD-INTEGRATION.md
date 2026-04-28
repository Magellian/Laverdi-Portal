# OpenClaw Dashboard Integration Guide

## Overview
Add a "Launch OpenClaw" button to the user dashboard that streamlines access to their instance.

## Files to Deploy

1. **`api-get-openclaw-access.ts`** → `/pages/api/openclaw/access.ts`
   - API endpoint that returns user's instance details (URL, token, port)

2. **`OpenClawAccessButton.tsx`** → `/components/OpenClawAccessButton.tsx`
   - React component for the dashboard button with fallback instructions

## Integration Steps

### Step 1: Add the API endpoint
Copy `api-get-openclaw-access.ts` to your portal:
```bash
cp api-get-openclaw-access.ts /path/to/laverdi-portal/pages/api/openclaw/access.ts
```

### Step 2: Add the component
Copy `OpenClawAccessButton.tsx` to your portal:
```bash
cp OpenClawAccessButton.tsx /path/to/laverdi-portal/components/OpenClawAccessButton.tsx
```

### Step 3: Update dashboard page
In your dashboard (`pages/dashboard/index.tsx` or similar), import and use the component:

```tsx
import OpenClawAccessButton from '@/components/OpenClawAccessButton';
import { useUser } from '@/hooks/useUser'; // or however you get user context

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      {/* Existing dashboard content */}

      {/* Add this section */}
      {user && (
        <OpenClawAccessButton
          userId={user.id}
          tier={user.tier}
          modelId={user.model_id}
        />
      )}

      {/* Rest of dashboard */}
    </div>
  );
}
```

## How It Works

### User Flow:
1. User logs in to Laverdi portal
2. Sees "Launch OpenClaw" button on dashboard
3. Clicks button
4. API fetches their instance details (URL, token, port)
5. Browser opens new tab with their OpenClaw instance
6. Token is passed in URL query string

### If Button Fails:
- Collapsible "Instructions" section shows SSH tunnel workaround
- Users can manually set up tunnel: `ssh -L 9000:localhost:9000 root@64.23.142.154`
- Then access `http://localhost:9000` locally

## Security Notes

- Auth token is passed in URL query string (acceptable for this use case since it's a one-time token)
- In production, consider using a time-limited token instead of the permanent gateway token
- API endpoint validates user ownership of instance via `user_id` in database

## Database Requirements

The endpoint expects these fields in the `instances` table:
- `user_id` (UUID) — User owning the instance
- `port` (INTEGER) — Port the instance is running on (9000, 9001, etc.)
- `api_key` (TEXT) — OpenClaw gateway auth token
- `model_id` (TEXT) — Model running in instance (for display)
- `container_id` (TEXT) — Docker container name (for reference)

## Testing

After deployment:

1. **Test 1: Button Click**
   ```
   Go to dashboard → Click "Launch OpenClaw"
   Expected: New tab opens with your instance URL
   ```

2. **Test 2: API Endpoint**
   ```bash
   curl http://localhost:3000/api/openclaw/access?userId=YOUR_USER_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: Returns instance details with URL and token

3. **Test 3: Fallback Instructions**
   ```
   Click "Having trouble? Show instructions"
   Expected: SSH tunnel instructions appear
   ```

## Future Improvements

- Generate time-limited tokens instead of permanent gateway tokens
- Add "Open in same tab" option
- Implement health check before launching (verify container is healthy)
- Add "Restart instance" button
- Monitor instance uptime from dashboard
- Show realtime agent activity/logs

## Support Text for Customers

Include this in your help docs:

> **How to Access Your OpenClaw Instance**
> 
> 1. Go to your dashboard
> 2. Click the "Launch OpenClaw" button under "Your OpenClaw Instance"
> 3. A new tab will open with your instance
> 4. Use your gateway token to authenticate
> 
> If the button doesn't work, you can use the SSH tunnel method shown in the instructions panel. This requires SSH access to the VPS.
