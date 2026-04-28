# Dashboard Testing Guide

This guide covers manual and automated testing of the Laverdi Portal Dashboard UI and its integration with the droplet provisioning system.

## Table of Contents

1. [Setup](#setup)
2. [Manual Testing](#manual-testing)
3. [Automated Testing](#automated-testing)
4. [Test Scenarios](#test-scenarios)
5. [Troubleshooting](#troubleshooting)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for local testing)
- Stripe test account
- DigitalOcean account with API token

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dcvrkpgvxqdcboostkpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Agent API
NEXT_PUBLIC_AGENT_URL=http://localhost:5000
```

### Install Dependencies

```bash
cd command-center
npm install
```

### Start Development Server

```bash
npm run dev
# Portal runs at http://localhost:8000
```

## Manual Testing

### Test 1: Dashboard Loading States

**Objective:** Verify the dashboard displays correct loading states

**Steps:**

1. Navigate to `http://localhost:8000/dashboard/agent`
2. Observe the loading spinner appears
3. Wait for data to load
4. Verify no errors appear in console

**Expected Result:** Loading spinner displays, then dashboard loads

---

### Test 2: No Droplet Provisioned

**Objective:** Verify dashboard shows helpful message when no droplet exists

**Steps:**

1. Navigate to dashboard for user with no droplet
2. Observe the error message displayed

**Expected Result:** 
- Message says "No agent provisioned yet"
- Helpful text about upgrading plan appears
- No crashes or console errors

---

### Test 3: Provisioning Status Display

**Objective:** Verify dashboard shows correct provisioning status

**Setup:**
- Create a test user
- Complete Stripe payment (use test card: `4242 4242 4242 4242`)
- Droplet should be in "provisioning" state

**Steps:**

1. Navigate to dashboard
2. Observe status shows "⏳ Provisioning..."
3. Verify progress bar is visible
4. Read "2-3 minutes" message
5. Refresh page every 30 seconds
6. Wait for status change to "Ready"

**Expected Result:** 
- Status badge shows provisioning
- Progress bar animates
- Message explains typical wait time
- Status updates after droplet is ready

---

### Test 4: Ready Droplet Display

**Objective:** Verify dashboard shows complete droplet information

**Setup:**
- Have a ready droplet (after provisioning completes)

**Steps:**

1. Navigate to dashboard
2. Verify status shows "✅ Ready to use"
3. Verify public IP is displayed correctly
4. Verify droplet ID is shown
5. Verify tier is displayed (e.g., "Starter")
6. Verify pairing token is shown (masked with "..." at end)

**Expected Result:**
- All droplet details are visible
- IP follows IPv4 format (xxx.xxx.xxx.xxx)
- Pairing token is properly formatted
- No sensitive data is exposed

---

### Test 5: Copy IP to Clipboard

**Objective:** Verify IP copy functionality works

**Steps:**

1. From a ready droplet dashboard
2. Click "Copy IP" button
3. Verify alert/toast appears
4. Open another application and paste (e.g., Notepad)
5. Verify IP is pasted correctly

**Expected Result:** IP is copied to clipboard and can be pasted elsewhere

---

### Test 6: Copy Pairing Token

**Objective:** Verify pairing token copy functionality

**Steps:**

1. From a ready droplet dashboard
2. Click "Copy" button next to pairing token
3. Verify alert/toast appears
4. Open another application and paste
5. Verify full token is pasted

**Expected Result:** Full pairing token is copied and pasted correctly

---

### Test 7: Test Connection Button

**Objective:** Verify connection testing works

**Setup:**
- Have a ready droplet with public IP
- Agent should be running on droplet at `:5000`

**Steps:**

1. Click "🔗 Test Connection" button
2. Observe button shows "🔄 Testing..." state
3. Wait for result to appear
4. Verify message appears (success or failure)

**Expected Results (Success):**
- Message: "✅ Connected"
- Green background
- Version info displayed

**Expected Results (Failure):**
- Message: "❌ Connection Failed"
- Red background
- Error message explains issue

---

### Test 8: Open Agent Portal

**Objective:** Verify "Open Agent Portal" button works

**Steps:**

1. From ready droplet dashboard
2. Click "🌐 Open Agent Portal" button
3. Verify new window opens
4. Verify URL is `http://<droplet_ip>:3000`
5. Check that agent portal loads

**Expected Result:** New tab/window opens with agent portal

---

### Test 9: Refresh Status Button

**Objective:** Verify manual refresh works

**Steps:**

1. Click "🔄 Refresh Status" button
2. Observe button shows disabled state briefly
3. Verify data is re-fetched
4. Confirm timestamp updates

**Expected Result:** Data refreshes without page reload

---

### Test 10: Error State Display

**Objective:** Verify error states are handled gracefully

**Setup:**
- Have a droplet in error state (or simulate with test header)

**Steps:**

1. Navigate to dashboard for errored droplet
2. Observe error message is displayed
3. Verify "Retry" button is present
4. Click "Retry" button
5. Verify retry attempt is made

**Expected Result:**
- Error message is user-friendly
- Retry functionality works
- No crashes

---

### Test 11: Real-time Updates

**Objective:** Verify dashboard updates every 10 seconds

**Steps:**

1. Open dashboard in browser console
2. Leave open for 30 seconds
3. Monitor Network tab
4. Verify `/api/droplets/status` is called every ~10 seconds
5. Close tab and verify interval is cleaned up

**Expected Result:**
- API calls happen regularly
- Updates reflect server changes
- No memory leaks from interval

---

### Test 12: Responsive Design

**Objective:** Verify dashboard works on mobile/tablet

**Steps:**

1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Test with iPhone SE size (375px)
4. Test with iPad size (768px)
5. Verify all buttons and text are readable
6. Verify no horizontal scrolling
7. Verify layout stacks properly

**Expected Result:** Dashboard is fully responsive and readable

---

## Automated Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- dashboard.test.ts
npm test -- full-flow.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run in Watch Mode

```bash
npm test -- --watch
```

## Test Scenarios

### Scenario 1: New User Journey

**Flow:**
1. User signs up
2. User selects Starter plan
3. User completes Stripe payment
4. Droplet creation triggered
5. Dashboard shows provisioning
6. Wait for droplet to boot
7. Droplet calls callback
8. Dashboard updates to ready
9. User can connect to agent

**Test Command:**
```bash
npm test -- --testNamePattern="full-flow.*signup.*payment.*droplet.*dashboard"
```

---

### Scenario 2: Connection Failures

**Flow:**
1. Droplet provisioning fails
2. Dashboard shows error state
3. User clicks retry
4. System attempts retry
5. Handles repeated failures

**Test Command:**
```bash
npm test -- --testNamePattern="error.*handling"
```

---

### Scenario 3: Concurrent Updates

**Flow:**
1. Multiple users provision simultaneously
2. Dashboard handles rapid updates
3. No race conditions
4. No state conflicts

**Test Command:**
```bash
npm test -- --testNamePattern="concurrent"
```

---

## Troubleshooting

### Dashboard Shows "No Agent Provisioned"

**Cause:** User has no droplet in database

**Solutions:**
- Verify user exists in Supabase `auth.users`
- Check `user_droplets` table for matching user_id
- Check that provisioning was triggered
- Review backend logs for provisioning errors

### IP Shows as "Waiting for IP..."

**Cause:** Droplet callback hasn't been received yet

**Solutions:**
- Check droplet is actually running: `doctl compute droplet list`
- Verify user data script executed: `doctl compute droplet-action get <droplet_id> --output json`
- Check firewall allows callback: `curl -X POST https://portal/api/webhooks/do-callback`
- Review droplet logs: `doctl compute droplet-action logs <droplet_id>`

### Test Connection Shows "Connection Failed"

**Possible Causes:**
1. Agent isn't running on droplet
2. Port 5000 is blocked/firewalled
3. Public IP is wrong
4. Network latency/timeout

**Debug Steps:**
```bash
# SSH into droplet
ssh root@<public_ip>

# Check if container is running
docker ps

# Check logs
docker logs laverdi-agent

# Test health endpoint manually
curl http://localhost:5000/health

# Check firewall
ufw status
```

### Dashboard Crashes on Load

**Debug Steps:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify API endpoint returns valid JSON
5. Check TypeScript types match API response

### Tests Fail Locally

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Jest cache
npm test -- --clearCache

# Run single test to verify setup
npm test -- --testNamePattern="should return provisioning status"
```

### Slow Dashboard Load

**Optimization:**
- Check network latency (DevTools Network tab)
- Verify API response time (should be <100ms)
- Check for unnecessary re-renders
- Profile with React DevTools

## Performance Benchmarks

Expected load times:

- **Dashboard load:** < 2 seconds
- **Status refresh:** < 500ms
- **Connection test:** < 5 seconds
- **Button clicks:** instant feedback

Monitor with:
```bash
npm run build
npm start
# Use DevTools Performance tab
```

## CI/CD Integration

For GitHub Actions:

```yaml
- name: Run Dashboard Tests
  run: npm test -- dashboard

- name: Run E2E Tests
  run: npm test -- full-flow
```

## Questions?

Check the main README or review the checklist in `LAVERDI-E2E-AUTOMATION-CHECKLIST.md`
