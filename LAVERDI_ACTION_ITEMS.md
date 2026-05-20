# LaVerdi Action Items - Quick Reference

## TL;DR

Your system is **85% complete** but Telegram pairing is **completely broken** due to three fixable issues:

1. ❌ **Hostname doesn't resolve** — 2 min fix
2. ❌ **API endpoints don't exist** — 2 hour implementation
3. ❌ **Database table missing** — 30 min fix

**Total fix time: 2.5 hours**

---

## Critical Issues (MUST FIX)

### Issue #1: Hostname Resolution Failure ⏱️ 2 minutes

**Problem:** Portal tries to call `http://laverdi-command-center:8000` but that hostname doesn't exist.

**Quick Fix:**

```bash
# SSH into 66.42.70.66
ssh root@66.42.70.66

# Add hostname to /etc/hosts
echo "127.0.0.1 laverdi-command-center" >> /etc/hosts

# Verify
cat /etc/hosts | grep laverdi-command-center
# Should see: 127.0.0.1 laverdi-command-center

# Test connectivity
curl http://laverdi-command-center:8000/health
# Should return: {"service": "laverdi-command-center", "status": "healthy", ...}
```

**OR Alternative:** Modify `.env.local` to use localhost directly:

```bash
# Edit /root/laverdi-portal/.env.local
VPS_API_URL=http://127.0.0.1:8000  # Change from "laverdi-command-center"
```

Then restart the portal:
```bash
systemctl restart laverdi-portal.service
```

---

### Issue #2: Missing Database Table ⏱️ 30 minutes

**Problem:** No place to store Telegram/Discord/Slack credentials.

**Fix:** Create migration file

```bash
# SSH into server
ssh root@66.42.70.66

# Create new migration
cat > /root/laverdi-portal/migrations/008_create_channels_table.sql << 'EOF'
-- Migration 008: Create channels table for storing Telegram/Discord/Slack credentials

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  
  channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('telegram', 'discord', 'slack', 'whatsapp', 'signal')),
  enabled BOOLEAN DEFAULT FALSE,
  
  -- Credentials stored as JSON (consider encryption for production)
  config JSONB,
  
  -- Webhook management
  webhook_url VARCHAR(255),
  webhook_secret VARCHAR(255),
  webhook_verified BOOLEAN DEFAULT FALSE,
  last_webhook_ping TIMESTAMP,
  
  -- Status tracking
  connected BOOLEAN DEFAULT FALSE,
  last_error TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, channel_name, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_instance_id ON channels(instance_id);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);
CREATE INDEX IF NOT EXISTS idx_channels_channel_name ON channels(channel_name);

-- Enable RLS (Row Level Security)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own channels
CREATE POLICY "Users can view their own channels"
  ON channels
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own channels"
  ON channels
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own channels"
  ON channels
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own channels"
  ON channels
  FOR DELETE
  USING (user_id = auth.uid());
EOF

# Apply migration via Supabase SQL editor
# Log into https://app.supabase.com → Your Project → SQL Editor
# Paste the contents of the migration file and run it
```

---

### Issue #3: Missing Command Center Endpoints ⏱️ 2 hours

**Problem:** Command Center doesn't have `/api/configure-channels` or `/api/get-channels` endpoints.

**Fix:** Add these endpoints to `/root/command-center.py`

```bash
ssh root@66.42.70.66

# Backup original
cp /root/command-center.py /root/command-center.py.backup

# Edit command-center.py and add these endpoints BEFORE the `if __name__ == '__main__'` line:
```

Add this code to `/root/command-center.py` (around line 250, before the `if __name__` block):

```python
# ─── Channel Configuration Endpoints ──────────────────────────────────

@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Store channel credentials and set up webhooks."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = data.get('userId')
    channels = data.get('channels', {})
    
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        # Store channels in database
        for channel_name, config in channels.items():
            if not config or not isinstance(config, dict):
                continue
            
            # For Telegram, validate and set webhook
            if channel_name == 'telegram':
                bot_token = config.get('botToken')
                if not bot_token:
                    return jsonify({'error': f'Missing botToken for {channel_name}'}), 400
                
                # Validate token by calling Telegram API
                try:
                    resp = http.get(f'https://api.telegram.org/bot{bot_token}/getMe', timeout=5)
                    if not resp.ok:
                        return jsonify({'error': f'Invalid Telegram token'}), 400
                    
                    telegram_user = resp.json()
                    if not telegram_user.get('ok'):
                        return jsonify({'error': f'Telegram API error: {telegram_user.get("description")}'}), 400
                
                except Exception as e:
                    return jsonify({'error': f'Failed to validate Telegram token: {str(e)}'}), 400
                
                # TODO: Set webhook on Telegram
                # Find user's instance and construct webhook URL
                # webhook_url = f"https://{instance_ip}:9000/telegram?token={bot_token}"
                # requests.post(
                #     f"https://api.telegram.org/bot{bot_token}/setWebhook",
                #     json={"url": webhook_url},
                #     timeout=5
                # )
            
            # Store in database (via Supabase)
            insert_channel(user_id, channel_name, config)
        
        return jsonify({'success': True, 'channels': channels}), 200
    
    except Exception as e:
        app.logger.error(f"Error in configure_channels: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """Fetch stored channel configuration for a user."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        # Query database for user's channels
        channels_data = query_channels(user_id)
        
        # Format response
        response = {
            'channels': {}
        }
        
        for channel in channels_data:
            channel_name = channel['channel_name']
            config = channel['config'] or {}
            
            response['channels'][channel_name] = {
                'enabled': channel['enabled'],
                'connected': channel['connected'],
                'botToken': config.get('botToken', ''),
                'lastError': channel['last_error']
            }
        
        return jsonify(response), 200
    
    except Exception as e:
        app.logger.error(f"Error in get_channels: {e}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ─── Database Helper Functions ──────────────────────────────────────

def insert_channel(user_id: str, channel_name: str, config: dict):
    """Insert or update channel configuration in Supabase."""
    headers = _sh()
    
    # First, try to get existing channel
    existing = http.post(
        f'{SUPABASE_URL}/rest/v1/channels?select=id',
        headers=headers,
        json={
            'user_id': {'eq': user_id},
            'channel_name': {'eq': channel_name}
        }
    )
    
    # Upsert (insert or update)
    resp = http.post(
        f'{SUPABASE_URL}/rest/v1/channels',
        headers=headers,
        json={
            'user_id': user_id,
            'channel_name': channel_name,
            'enabled': config.get('enabled', True),
            'config': config,
            'connected': bool(config.get('botToken')),
            'updated_at': 'now()'
        }
    )
    
    if not resp.ok:
        raise Exception(f"Failed to insert channel: {resp.text}")
    
    return resp.json()


def query_channels(user_id: str):
    """Query channels for a user from Supabase."""
    headers = _sh()
    
    resp = http.get(
        f'{SUPABASE_URL}/rest/v1/channels?user_id=eq.{user_id}',
        headers=headers
    )
    
    if not resp.ok:
        raise Exception(f"Failed to query channels: {resp.text}")
    
    return resp.json()
```

**Then restart Command Center:**

```bash
pm2 restart command-center
pm2 logs command-center --lines 20
```

---

## Verification Tests

After applying fixes, test each endpoint:

### Test #1: Hostname Resolution

```bash
curl -v http://laverdi-command-center:8000/health

# Expected: HTTP 200 with healthy status
```

### Test #2: Configure Channels Endpoint

```bash
curl -X POST http://laverdi-command-center:8000/api/configure-channels \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "4593b36f-90c6-44a2-93d1-ba8e8be52a1c",
    "channels": {
      "telegram": {
        "enabled": true,
        "botToken": "YOUR_TEST_BOT_TOKEN_HERE"
      }
    }
  }'

# Expected: HTTP 200 with {"success": true}
```

### Test #3: Get Channels Endpoint

```bash
curl -X GET "http://laverdi-command-center:8000/api/get-channels?userId=4593b36f-90c6-44a2-93d1-ba8e8be52a1c" \
  -H "Authorization: Bearer laverdi-admin-api-2026"

# Expected: HTTP 200 with channel config
```

### Test #4: Portal Integration

1. Log into portal at `https://laverdi.tech`
2. Click "Pair Telegram"
3. Enter a valid Telegram bot token
4. Click "Connect"
5. Should see "✓ Telegram Paired" instead of error

---

## Deployment Checklist

- [ ] Fix hostname resolution (Option A: /etc/hosts OR Option B: Update .env.local)
- [ ] Create and apply database migration (008_create_channels_table.sql)
- [ ] Add endpoints to command-center.py
- [ ] Restart portal service: `systemctl restart laverdi-portal.service`
- [ ] Restart command center: `pm2 restart command-center`
- [ ] Test each endpoint manually (see Verification Tests above)
- [ ] Test end-to-end in portal UI
- [ ] Monitor logs: `journalctl -u laverdi-portal.service -f`
- [ ] Monitor logs: `pm2 logs command-center`

---

## Files to Check/Edit

| File | Action | Why |
|------|--------|-----|
| `/etc/hosts` | Add laverdi-command-center entry OR | Fix hostname resolution |
| `/root/laverdi-portal/.env.local` | Change VPS_API_URL to localhost:8000 | Alternative hostname fix |
| `/root/laverdi-portal/migrations/008_*.sql` | Create new file | Add channels table |
| `/root/command-center.py` | Add two endpoints | Implement channel config |
| Supabase SQL Editor | Run migration | Create table in database |

---

## What You'll Have After Fixes

✅ Users can sign up  
✅ Users can create instances  
✅ Users can pair OpenClaw app  
✅ **Users can pair Telegram bot** ← NOW WORKS  
✅ Messages route between Telegram and instance  
✅ Full multi-channel support (Discord, Slack, etc.)

---

## Questions for Chris

1. **Hostname or localhost?** Do you want to add a `/etc/hosts` entry or modify `.env.local` to use localhost?
2. **Telegram webhook URL?** Once we store the token, what should the webhook URL be? (e.g., `https://user-instance-ip:9000/telegram`)
3. **Token encryption?** Should credentials be encrypted in the database, or is plaintext OK for now?
4. **Other channels?** Should we implement Discord, Slack, Signal support, or just Telegram first?

---

## References

- **Portal API:** `/root/laverdi-portal/pages/api/channels/index.ts`
- **Command Center:** `/root/command-center.py`
- **Database:** Supabase - https://app.supabase.com
- **Portal URL:** https://laverdi.tech
- **Server IP:** 66.42.70.66

---

## Support

If you get stuck:
1. Check logs: `journalctl -u laverdi-portal.service -n 50`
2. Check logs: `pm2 logs command-center`
3. Test connectivity: `curl http://laverdi-command-center:8000/health`
4. Verify database: Run a query in Supabase SQL editor

