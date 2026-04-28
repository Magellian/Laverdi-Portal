# Dashboard Development Quick Reference

## File Locations

```
Dashboard Component:
  → pages/dashboard/agent.tsx

API Endpoint:
  → pages/api/droplets/status.ts

Types:
  → lib/types.ts

Testing Utilities:
  → lib/test-utils.ts

Tests:
  → __tests__/integration/dashboard.test.ts (integration)
  → __tests__/e2e/full-flow.test.ts (end-to-end)

Documentation:
  → FRONTEND-IMPLEMENTATION.md (architecture)
  → DASHBOARD-TESTING-GUIDE.md (manual testing)
  → QUICK-REFERENCE.md (this file)
```

## Development Commands

```bash
# Start development server (port 8000)
npm run dev

# Run all tests
npm test

# Run specific test file
npm test -- dashboard.test.ts
npm test -- full-flow.test.ts

# Run tests with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Component States

### Dashboard States

```
1. LOADING
   └─ Shows spinner
   └─ useEffect fetching data

2. NO_DROPLET
   └─ Shows "No agent provisioned" message
   └─ Button to upgrade plan

3. PROVISIONING
   └─ Shows droplet_id
   └─ Progress bar animated
   └─ "Waiting for IP..." message
   └─ Auto-refresh every 10s

4. READY
   └─ Shows public_ip (with copy button)
   └─ Shows pairing_token (with copy button)
   └─ Shows tier (starter/pro/etc)
   └─ "Test Connection" button enabled
   └─ "Open Agent Portal" button enabled
   └─ "Refresh Status" button enabled

5. ERROR
   └─ Shows "Provisioning Error" message
   └─ Retry button enabled
```

## API Response Examples

### Provisioning
```json
{
  "droplet": {
    "id": "1",
    "droplet_id": 456789,
    "public_ip": null,
    "status": "provisioning",
    "pairing_token": null,
    "tier": "starter",
    "created_at": "2026-04-19T22:40:00Z"
  }
}
```

### Ready
```json
{
  "droplet": {
    "id": "1",
    "droplet_id": 123456,
    "public_ip": "192.0.2.42",
    "status": "ready",
    "pairing_token": "pair_abcd1234...",
    "tier": "starter",
    "created_at": "2026-04-19T22:40:00Z"
  }
}
```

### No Droplet
```json
{
  "error": "No agent provisioned yet. Upgrade your plan to get started."
}
```

## Component Props

Dashboard component takes no props - uses hooks for:
- State management (useState)
- Data fetching (useEffect)
- User context (future: from Supabase)

```tsx
export default function AgentDashboard() {
  // All data from /api/droplets/status
  // Auto-refresh every 10 seconds
  // Cleanup interval on unmount
}
```

## Key Functions

### Load Droplet Status
```tsx
const loadDropletStatus = async () => {
  const response = await axios.get('/api/droplets/status');
  setDroplet(response.data.droplet);
}
```

### Test Connection
```tsx
const testConnection = async () => {
  const response = await axios.get(
    `http://${droplet.public_ip}:5000/health`
  );
  setConnectionStatus(response.data);
}
```

### Open Agent Portal
```tsx
const openAgent = () => {
  window.open(
    `http://${droplet.public_ip}:3000`,
    '_blank'
  );
}
```

## Environment Variables

No special env vars needed for dashboard (mock data by default).

For production, update `pages/api/droplets/status.ts` to use real data:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
```

## Testing Mock Data

Test with different user IDs in header:

```bash
# Provisioning state
curl -H "x-user-id: provisioning-user" \
     http://localhost:8000/api/droplets/status

# Ready state
curl -H "x-user-id: ready-user" \
     http://localhost:8000/api/droplets/status

# Error state
curl -H "x-user-id: error-user" \
     http://localhost:8000/api/droplets/status

# No droplet
curl -H "x-user-id: new-user" \
     http://localhost:8000/api/droplets/status
```

## Common Tasks

### Add New Status State
1. Add to `Droplet` type in `lib/types.ts`
2. Add case to status display in `agent.tsx`
3. Update tests in `dashboard.test.ts`

### Change Auto-Refresh Interval
```tsx
// In agent.tsx useEffect:
const interval = setInterval(loadDropletStatus, 10000); // Change this
```

### Update Error Messages
```tsx
// In agent.tsx:
setError(err.response?.data?.error || 'Your message here');
```

### Change IP Format
```tsx
// In agent.tsx:
{droplet?.public_ip ? (
  <span>{droplet.public_ip}</span>
) : (
  <span className="text-slate-500">Your message</span>
)}
```

## Debugging Tips

### Check State in Browser Console
```javascript
// In DevTools:
// State is logged in useEffect callbacks
console.log('droplet:', droplet);
console.log('loading:', loading);
console.log('connectionStatus:', connectionStatus);
```

### Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Watch for `/api/droplets/status` calls
4. Every 10 seconds = normal refresh

### Component Not Rendering
1. Check Console for errors
2. Verify `[droplet]` in JSX
3. Check state is being set
4. Verify CSS classes apply

### Test Failures
```bash
# Run single test
npm test -- --testNamePattern="should return ready"

# See full error
npm test -- --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest
```

## Performance Notes

- Dashboard load: ~200ms (mock API)
- Status refresh: ~100ms
- Connection test: ~1-5 seconds (depends on network)
- Auto-refresh: 10 second interval (minimal overhead)

## Security Notes

- No auth tokens in localStorage
- No API keys exposed
- IP shown only to owner (backend responsibility)
- Pairing token masked in UI
- All data from `x-user-id` header (backend should validate)

## Integration Checklist

Before going live:

- [ ] Replace mock API with real Supabase queries
- [ ] Implement proper JWT authentication
- [ ] Add HTTPS support
- [ ] Test with real droplets
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Run full E2E test suite
- [ ] Verify mobile responsiveness
- [ ] Test error scenarios
- [ ] Set up monitoring/alerts

## Useful Links

- React Documentation: https://react.dev
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com
- Axios: https://axios-http.com

## Getting Help

1. Check `FRONTEND-IMPLEMENTATION.md` for architecture
2. Check `DASHBOARD-TESTING-GUIDE.md` for testing
3. Look at test files for usage examples
4. Review comments in `agent.tsx`
5. Check TypeScript types in `lib/types.ts`

---

**Last Updated:** 2026-04-19
**Version:** 1.0.0
