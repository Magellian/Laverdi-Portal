# 🚀 OpenClaw Launch Checklist - Session 2 (Tonight)

## Phase 1: End-to-End Payment Test (15 min)
- [ ] **Test User Signup**
  - Email: `testuser@example.com` (or any test email)
  - Password: `Test12345!`
  - Go to: http://64.23.142.154/auth/signup
  - Verify: Account created, redirect to login

- [ ] **Stripe Payment**
  - Go to: http://64.23.142.154
  - Click "Get Started" → Choose "Starter" plan
  - Stripe test card: `4242 4242 4242 4242`
  - Exp: Any future date (e.g., 12/26)
  - CVC: Any 3 digits
  - Verify: "Payment Successful" page, redirect to login

- [ ] **Verify Webhook Fired**
  - Check Command Center logs: `docker logs laverdi-command-center | tail -50`
  - Look for: `[Provision]` messages
  - Should see: Container creation request received

- [ ] **Check Dashboard**
  - Log in with test email
  - Go to: /dashboard
  - Look for: "Agent Server Status" card
  - Should show: IP address (10.242.212.97) and port (8700+)

## Phase 2: Container Verification (10 min)
- [ ] **List Docker Containers**
  - SSH to VPS: `ssh root@64.23.142.154`
  - Run: `docker ps | grep openclaw`
  - Should see: Container running with dynamic port

- [ ] **Test Container Health**
  - Get IP and port from dashboard
  - Run: `curl http://{IP}:{PORT}/health`
  - Should return: `{"status":"ok"}` or similar

- [ ] **Check Instances Table**
  - Query: `curl 'https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?user_id=eq.{USER_ID}' ...`
  - Should show: droplet_id, status='ready', port number

## Phase 3: OpenClaw Launch (20 min)
- [ ] **Download OpenClaw Companion App**
  - macOS: https://github.com/openclaw/openclaw/releases
  - iOS/Android: Check app stores

- [ ] **Connect to Instance**
  - App → Settings/Pairing
  - Enter IP: (from dashboard)
  - Enter Port: (from dashboard)
  - Enter Pairing Token: (from database or email)
  - Should connect and show agent status

- [ ] **Test Agent Commands**
  - Send test message: "Hello agent"
  - Should see response from OpenClaw
  - Verify model inference works

- [ ] **Verify Full Cycle**
  - Payment → Webhook → Container provision → Dashboard display → Agent accessible
  - SUCCESS = All steps complete with live agent

## Phase 4: Production Readiness (10 min)
- [ ] **Test with Your Account**
  - Use: chrislaverdiere@gmail.com
  - Complete payment for real
  - Verify container appears instantly
  - Access agent from app

- [ ] **Backup Portal State**
  - Commit all changes to git
  - Document final IP/port/URLs
  - Save database state

- [ ] **Final Verification**
  - Portal: http://64.23.142.154 (LIVE)
  - Command Center: http://64.23.142.154:8000 (LIVE)
  - OpenClaw Agent: http://IP:PORT (LIVE)
  - Dashboard shows instance (LIVE)

## Troubleshooting Quick Links
| Issue | Fix |
|-------|-----|
| Payment doesn't trigger provision | Check webhook: `docker logs laverdi-portal \| grep webhook` |
| Container doesn't appear in dashboard | Check instances RLS policies |
| OpenClaw won't start | Check image: `docker images \| grep openclaw` |
| Can't connect to agent | Verify port: `docker ps` and firewall rules |
| Health check failing | SSH to VPS and test: `curl http://localhost:PORT/health` |

## Success Markers
✅ Payment goes through  
✅ Webhook fires (logs show [Provision])  
✅ Container starts (docker ps shows running)  
✅ Dashboard displays instance  
✅ Health check passes  
✅ Agent accessible from app  
✅ Commands execute end-to-end  

## Next Steps After Launch
1. Enable email notifications (DNS propagation)
2. Add user onboarding guides
3. Set up monitoring/logging
4. Configure backup strategies
5. Plan scaling for multiple users
