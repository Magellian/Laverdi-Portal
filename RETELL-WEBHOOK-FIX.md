# Fife RV Retell Webhook Setup - Current Issue & Solution

## Problem
- OpenClaw gateway runs on 45.76.242.66:18789 but only listens on localhost (127.0.0.1)
- Retell webhook test times out when trying to reach the external IP
- Port 80/8000 connectivity also timing out (may be firewall-related)

## Solution: Use ngrok Tunnel

### Step 1: Install ngrok on the Vultr server

```bash
ssh -i ~/.ssh/fife-rv-key root@45.76.242.66

# Download ngrok
curl -L https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip -o ngrok.zip
unzip ngrok.zip
mv ngrok /usr/local/bin/
chmod +x /usr/local/bin/ngrok
```

### Step 2: Sign up for ngrok at https://ngrok.com

- Create a free account
- Get your authtoken from https://dashboard.ngrok.com/auth
- Run on the server: `ngrok config add-authtoken YOUR_TOKEN_HERE`

### Step 3: Start ngrok tunnel

On the Vultr server:
```bash
nohup ngrok http 127.0.0.1:18789 > /tmp/ngrok.log 2>&1 &
```

This will output a public URL like: `https://abc123.ngrok.io` or `http://abc123.ngrok.io`

### Step 4: Update Retell Webhook URL

In Retell dashboard:
- Go to Webhooks
- **Change endpoint to:** `https://YOUR_NGROK_URL/webhook/retell`
- Run the test again

### Step 5: Save the ngrok URL

Once you have a stable tunnel, update:
```bash
credentials/RETELL.md
# Add: **Webhook URL:** https://YOUR_NGROK_URL/webhook/retell
```

---

## Alternative: Use Local Testing with Retell

If ngrok doesn't work easily, Retell also allows:
1. Test the agent directly via Retell's dashboard
2. Make test calls without webhook fully set up yet
3. Get the test phone number working first
4. Fix the webhook later

---

## Status
- [ ] ngrok installed on server
- [ ] ngrok tunnel created
- [ ] Retell webhook URL updated
- [ ] Webhook test passes in Retell
