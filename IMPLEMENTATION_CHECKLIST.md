# Implementation Checklist - Portal Server Provisioning

Use this checklist to verify complete deployment of the provisioning system.

## Pre-Deployment Verification

### Code Files
- [ ] `lib/ssh-utils.ts` - SSH utilities library exists and is syntactically correct
- [ ] `pages/api/webhooks/do-callback.ts` - Webhook handler exists and is in correct location
- [ ] `pages/dashboard/index.tsx` - Dashboard page exists and is in correct location
- [ ] `scripts/do-provision.sh` - Provisioning script exists and is executable
- [ ] All files have consistent formatting and no syntax errors

### Dependencies
- [ ] Node.js 16+ installed on portal server: `node --version`
- [ ] npm/yarn installed: `npm --version`
- [ ] SSH client available: `ssh -V`
- [ ] curl installed: `curl --version`
- [ ] Database drivers installed (mysql2 or better-sqlite3)

## Database Setup

### Schema Preparation
- [ ] Database backup created before running migrations
- [ ] Migration file `migrations/007_add_auth_token_and_gateway.sql` reviewed
- [ ] Database user has ALTER TABLE and CREATE INDEX permissions
- [ ] Dry-run migration executed successfully (if possible)

### Schema Application
- [ ] Migration executed against production database
- [ ] All new columns exist: `auth_token`, `gateway_url`, `token_created_at`, `token_expires_at`, `is_provisioned`
- [ ] All indexes created successfully
- [ ] Unique constraint on `auth_token` exists
- [ ] `provisioning_logs` table exists with correct schema

### Data Verification
```bash
# Run these queries to verify schema
sqlite3 portal.db "PRAGMA table_info(servers);" | grep -E "auth_token|gateway_url|is_provisioned"
sqlite3 portal.db "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='servers';"
```
- [ ] Query results show all new columns and indexes
- [ ] No data loss in existing `servers` table
- [ ] Existing server records still intact

## SSH Configuration

### Key Setup
- [ ] SSH key pair generated: `ls ~/.ssh/portal_gateway*`
- [ ] Private key has correct permissions: `stat -c "%a" ~/.ssh/portal_gateway`
- [ ] Public key deployed to all gateway servers
- [ ] SSH access verified to each gateway: `ssh -i ~/.ssh/portal_gateway user@gateway "echo OK"`

### Gateway Servers
For each gateway server:
- [ ] SSH port is accessible (usually 22): `nc -zv gateway_host 22`
- [ ] SSH key is installed: `ssh user@gateway "grep -c portal_gateway ~/.ssh/authorized_keys"`
- [ ] User has sudo access if needed: `ssh user@gateway "sudo -v"`
- [ ] SSH login works without password: `ssh -i ~/.ssh/portal_gateway user@gateway "whoami"`

## Portal Application Deployment

### File Placement
- [ ] Copied to `lib/ssh-utils.ts`: `test -f lib/ssh-utils.ts && echo "OK"`
- [ ] Copied to `pages/api/webhooks/do-callback.ts`: `test -f pages/api/webhooks/do-callback.ts && echo "OK"`
- [ ] Copied to `pages/dashboard/index.tsx`: `test -f pages/dashboard/index.tsx && echo "OK"`
- [ ] File permissions correct (readable by application): `ls -la lib/ssh-utils.ts`

### Application Configuration
- [ ] Next.js build successful: `npm run build`
- [ ] No TypeScript compilation errors
- [ ] Environment variables configured (if needed)
- [ ] Database connection string configured in `.env`

### Application Server
- [ ] Application started: `npm start` or equivalent
- [ ] Application listening on expected port (e.g., 3000): `curl http://localhost:3000`
- [ ] API endpoint is accessible: `curl -X POST http://localhost:3000/api/webhooks/do-callback`

## Provisioning Script Setup

### Script Deployment
- [ ] Copied to `/usr/local/bin/do-provision.sh`: `test -f /usr/local/bin/do-provision.sh && echo "OK"`
- [ ] Made executable: `ls -la /usr/local/bin/do-provision.sh | grep -E "^-rwxr"`
- [ ] Bash shebang is correct: `head -1 /usr/local/bin/do-provision.sh`
- [ ] No Windows line endings (if on Windows/cross-platform): `file /usr/local/bin/do-provision.sh`

### Script Testing
- [ ] Script syntax validated: `bash -n /usr/local/bin/do-provision.sh`
- [ ] Script can be executed from any directory: `cd ~ && do-provision.sh 2>&1 | head -5`
- [ ] Help/usage information available: `do-provision.sh` (without arguments shows error message)

## Test Provisioning

### Preparation
- [ ] Test gateway server identified and accessible
- [ ] Auth token generated: `openssl rand -hex 32 | sed 's/^/sk_prod_/'`
- [ ] Test API endpoint URL confirmed
- [ ] Portal application is running and accessible

### Execution
- [ ] Run provisioning script:
  ```bash
  do-provision.sh test-gateway.local https://portal.local sk_prod_test_token_123
  ```
- [ ] Script completes without errors
- [ ] SSH commands succeed (verifying output)
- [ ] Configuration files created on gateway server:
  ```bash
  ssh user@test-gateway.local "test -f /etc/portal-gateway/gateway.env && echo 'OK'"
  ```

### Webhook Callback
- [ ] Callback sent successfully (check script output)
- [ ] API endpoint returns 200 OK response
- [ ] Error logs do not show webhook failures
- [ ] Database record created/updated:
  ```bash
  sqlite3 portal.db "SELECT host, is_provisioned FROM servers WHERE host='test-gateway.local';"
  ```

### Dashboard Verification
- [ ] Dashboard page loads: `curl http://localhost:3000/dashboard | grep -q "Portal Dashboard"`
- [ ] Test server appears in dashboard
- [ ] Status shows "Provisioned"
- [ ] Token is masked correctly
- [ ] Gateway URL is correct

### Log Verification
- [ ] Provisioning logs visible in database:
  ```bash
  sqlite3 portal.db "SELECT event_type, details FROM provisioning_logs WHERE server_id = (SELECT id FROM servers WHERE host='test-gateway.local');"
  ```
- [ ] Log entries show correct event types: `callback_received`, etc.

## Integration Testing

### Multi-Server Provisioning
For 2-3 test servers:
- [ ] Generate unique tokens for each: `for i in {1..3}; do openssl rand -hex 32 | sed 's/^/sk_prod_/'; done`
- [ ] Provision each server without errors
- [ ] All servers appear in dashboard
- [ ] All servers show "Provisioned" status
- [ ] Logs show entries for all servers

### Authorization Testing
- [ ] Webhook rejects request with missing Authorization header:
  ```bash
  curl -X POST http://localhost:3000/api/webhooks/do-callback \
    -H "Content-Type: application/json" \
    -d '{}' | grep -q "Unauthorized"
  ```
- [ ] Webhook rejects request with invalid token:
  ```bash
  curl -X POST http://localhost:3000/api/webhooks/do-callback \
    -H "Authorization: Bearer invalid_token" \
    -H "Content-Type: application/json" \
    -d '{}' | grep -q "Unauthorized"
  ```
- [ ] Webhook accepts request with valid token and correct payload

### Error Handling
- [ ] SSH connection failure handled gracefully: `do-provision.sh unreachable.host`
- [ ] Invalid parameters rejected: `do-provision.sh` (no arguments)
- [ ] Missing auth token on gateway handled: Verify error message

## Performance Verification

### Response Times
- [ ] Dashboard loads in < 2 seconds: `time curl http://localhost:3000/dashboard > /dev/null`
- [ ] Webhook processes request in < 1 second
- [ ] Provisioning script completes in < 2 minutes per server

### Database Performance
- [ ] Query to fetch all servers is fast: `time sqlite3 portal.db "SELECT * FROM servers;"`
- [ ] Indexes are being used properly: Check query plans if database supports EXPLAIN

### Concurrent Requests
- [ ] Dashboard handles multiple simultaneous users (load test if possible)
- [ ] Webhook can handle concurrent callbacks (test with simultaneous provisioning)

## Security Verification

### Token Security
- [ ] Tokens follow required format: `sk_prod_<hex>`
- [ ] Tokens are unique per server: 
  ```bash
  sqlite3 portal.db "SELECT COUNT(*) FROM servers WHERE auth_token IS NOT NULL; SELECT COUNT(DISTINCT auth_token) FROM servers WHERE auth_token IS NOT NULL;" | sort -u | wc -l
  ```
- [ ] No tokens logged in debug output
- [ ] No tokens visible in environment: `ps aux | grep -v grep | grep portal | grep -c sk_prod`

### SSH Security
- [ ] Using ed25519 or RSA 4096+ key: `ssh-keygen -l -f ~/.ssh/portal_gateway`
- [ ] SSH key permissions are 600: `stat -c "%a" ~/.ssh/portal_gateway`
- [ ] StrictHostKeyChecking configured: `grep StrictHostKeyChecking do-provision.sh`
- [ ] SSH known_hosts updated properly

### Database Security
- [ ] Database file permissions restrict access: `stat -c "%a" portal.db`
- [ ] No unencrypted tokens in backups (if encrypted storage is required)
- [ ] SQL injection protection: Queries use prepared statements

### Network Security
- [ ] API endpoint uses HTTPS in production
- [ ] Only authorized networks can access provisioning endpoints
- [ ] Rate limiting configured on webhook endpoint (if needed)

## Monitoring & Logging

### Log Configuration
- [ ] Provisioning script logs to `/var/log/portal-gateway-provision.log`
- [ ] Application logs are captured and rotated
- [ ] Database logs are enabled (if applicable)

### Log Review
- [ ] Recent provisioning logs show expected activity
- [ ] No ERROR or WARNING entries for successful operations
- [ ] Failed operations logged with clear error messages

### Monitoring Setup (Optional)
- [ ] Dashboard provisioning count monitored
- [ ] Failed provisioning alerts configured
- [ ] Token expiration reminders set up (if using token expiration)

## Documentation & Handoff

### Documentation
- [ ] `PROVISIONING_SETUP.md` - Complete and accurate
- [ ] `TOKEN_EXTRACTION_FIX.md` - Explains all security measures
- [ ] `IMPLEMENTATION_CHECKLIST.md` - This file, filled out
- [ ] `SOLUTION_SUMMARY.md` - High-level overview present

### Runbooks
- [ ] Operational runbook for provisioning new servers
- [ ] Troubleshooting guide for common issues
- [ ] Emergency procedures documented

### Training
- [ ] Operations team trained on provisioning process
- [ ] Team can execute `do-provision.sh` independently
- [ ] Team understands dashboard monitoring
- [ ] Team knows how to troubleshoot common issues

## Production Readiness

### Final Checks
- [ ] All checklist items completed
- [ ] No open issues or TODOs in code
- [ ] Code review completed by peer
- [ ] Security audit completed (if required)
- [ ] Load testing completed (if applicable)

### Deployment Approval
- [ ] Product owner approves feature
- [ ] Security team approves implementation
- [ ] Operations team approves deployment
- [ ] Change management approval obtained

### Deployment Execution
- [ ] Change control window scheduled
- [ ] Rollback plan in place
- [ ] On-call engineer assigned
- [ ] Status page updated
- [ ] Stakeholders notified of deployment

### Post-Deployment
- [ ] Monitor error logs for issues
- [ ] Verify in production matches testing
- [ ] Collect feedback from operations team
- [ ] Document any deviations from plan
- [ ] Celebrate successful launch! 🎉

## Sign-Off

- **Implemented By:** ___________________ Date: ___________
- **Reviewed By:** ___________________ Date: ___________
- **Approved By:** ___________________ Date: ___________

## Notes

Use this space to document any deviations, notes, or issues discovered during implementation:

```
[Add notes here]
```
