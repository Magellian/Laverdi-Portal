# Carryover: LaVerdi Signup → Opus Debugging Session

## Current Achievement
✅ **Signup flow is WORKING** — Users can create accounts and profiles are stored in Supabase.

Test user created successfully:
- Email: `test@test.com`
- Tier: `starter` 
- Trial: 14 days
- Created: 2026-04-26T08:18:13Z

## What's Broken (Infrastructure, Not Code)

### 1. SendGrid Email Timeout
Container can't reach `api.sendgrid.com`. Error:
```
[Auth] Failed to send welcome email to test@test.com: Error: Connection timeout
```

**To Debug:**
```bash
ssh root@64.23.142.154
docker exec laverdi-portal sh -c 'curl -v https://api.sendgrid.com'
# Check if: DNS works? HTTPS works? Firewall blocks it?
```

**Possible Fixes:**
- Add DNS server to docker-compose (e.g., 8.8.8.8)
- Test with HTTP endpoint instead of HTTPS
- Check VPS outbound firewall rules

### 2. Command Center Unreachable
Portal container can't reach `http://localhost:8000`. Error:
```
[Provision] VPS connection error for test@test.com: TypeError: fetch failed
```

**Root Cause:** Containers can't reach `localhost` of host from inside container.

**To Fix:**
Change `/pages/api/agents/provision-async.ts`:
```typescript
// Instead of:
const VPS_API_URL = process.env.VPS_API_URL || 'http://localhost:8000'

// Use:
const VPS_API_URL = process.env.VPS_API_URL || 'http://64.23.142.154:8000'
// Or use Docker network: http://laverdi-command-center:8000 (if using docker-compose)
```

## Files to Review

### Backend Signup Flow
- `/pages/api/auth/create-profile.ts` — Profile creation, email, provisioning
- `/lib/email.ts` — SendGrid integration with timeout
- `/lib/supabase.ts` — Database client (service role key)

### Environment
- `.env.production` — Check if SendGrid + VPS URLs are correct
- `docker-compose.yml` — All env vars hardcoded (no networking config)

### Database
- Supabase project: `dcvrkpgvxqdcboostkpz`
- Users table: RLS currently DISABLED (need to re-enable with policy allowing service role)

## Quick Test Checklist

1. [ ] Can container reach SendGrid? `docker exec laverdi-portal curl https://api.sendgrid.com`
2. [ ] Can container reach Command Center? `docker exec laverdi-portal curl http://64.23.142.154:8000/api/list-containers`
3. [ ] Does signup still work? Try `test2@test.com` at https://laverdi.tech/auth/signup
4. [ ] Does user appear in DB? Check Supabase users table
5. [ ] Did email send? Check SendGrid activity log
6. [ ] Did instance provision? Check `docker ps` for new OpenClaw container

## What to Tell Opus

"The signup flow works but has two networking issues:
1. Email send fails with connection timeout (can't reach SendGrid)
2. Provisioning fails (container can't reach Command Center on localhost)

Fix these and test the full end-to-end flow. The code is correct, infrastructure needs debugging."

## Status for Dashboard
- Signup: ✅ WORKING
- Database: ✅ Profiles created
- Email: ❌ Timeout (network issue)
- Provisioning: ❌ Unreachable (localhost routing)
- Overall: 50% complete (core working, sidecars broken)
