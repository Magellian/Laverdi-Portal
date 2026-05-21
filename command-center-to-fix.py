from supabase import create_client
#!/usr/bin/env python3
"""
LaVerdi Command Center v2.3 - Production Provisioning System
Provisions OpenClaw instances on Vultr, tracks metadata in Supabase.

Supabase `instances` table column mapping:
  container_id  → Vultr instance ID (REQUIRED NOT NULL)
  model_id      → Tier / plan name  (REQUIRED NOT NULL)
  port          → Gateway port 9000 (REQUIRED NOT NULL)
  ip_address    → Public IP
  status        → provisioning | ready | error | deleted
  endpoint      → Pairing token (connection token for OpenClaw app)
  api_key       → JSON metadata: {ssh_key_id, expires_at, user_id_str}
  user_id       → UUID FK to users table
"""

from flask import Flask, jsonify, request
import os
import json
import uuid
import secrets
import base64
import time
import requests as http
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

app = Flask(__name__)

# ─── Configuration ────────────────────────────────────────────────────────────
ADMIN_TOKEN   = os.environ.get('ADMIN_UPGRADE_TOKEN', 'laverdi-admin-api-2026')
VULTR_TOKEN   = os.environ.get('VULTR_API_TOKEN', 'UKMYJWEA5WDFFJVBHCHJGXDAFWR6CDB4Z23Q')
SUPABASE_URL  = os.environ.get('SUPABASE_URL', 'https://dcvrkpgvxqdcboostkpz.supabase.co')
SUPABASE_KEY  = os.environ.get('SUPABASE_SERVICE_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
    '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ'
    '.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY')

# NOTE: The Vultr API token has an IP whitelist restriction.
# If this server's IP is not whitelisted in the Vultr API key settings,
# provision-container calls will fail with 401 Unauthorized.
# Fix: Log into my.vultr.com → API → Edit key → remove IP restrictions
# OR set VULTR_API_TOKEN env var to a token without IP restrictions.
VULTR_BASE    = 'https://api.vultr.com/v2'
VULTR_REGION  = 'sea'          # Seattle
VULTR_OS_ID   = 1743           # Ubuntu 22.04 LTS x64
VULTR_PLAN    = 'vc2-1c-1gb'  # 1 vCPU, 1 GB RAM, $5/mo

GATEWAY_PORT  = 9000
TRIAL_DAYS    = 7

# ─── Auth ─────────────────────────────────────────────────────────────────────

def require_auth(req):
    auth = req.headers.get('Authorization', '')
    return auth.startswith('Bearer ') and auth[7:] == ADMIN_TOKEN

# ─── SSH helpers ──────────────────────────────────────────────────────────────

def generate_ssh_keypair():
    """Generate RSA 4096-bit SSH key pair. Returns (private_pem, public_openssh)."""
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
        backend=default_backend()
    )
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.OpenSSH,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    public_openssh = key.public_key().public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH
    ).decode('utf-8')
    return private_pem, public_openssh


# ─── Vultr API ────────────────────────────────────────────────────────────────

def _vh():
    return {'Authorization': f'Bearer {VULTR_TOKEN}', 'Content-Type': 'application/json'}


def upload_ssh_key(label: str, public_key: str) -> str:
    r = http.post(f'{VULTR_BASE}/ssh-keys', headers=_vh(),
                  json={'name': label, 'ssh_key': public_key})
    r.raise_for_status()
    return r.json()['ssh_key']['id']


def delete_ssh_key(key_id: str):
    try:
        http.delete(f'{VULTR_BASE}/ssh-keys/{key_id}', headers=_vh())
    except Exception:
        pass


def build_user_data(pairing_token: str, user_id: str) -> str:
    """Cloud-init bootstrap: installs Node.js + OpenClaw, configures gateway."""
    script = f"""#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

apt-get update -y && apt-get upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install OpenClaw
npm install -g openclaw

# Create service user
useradd -m -s /bin/bash laverdi 2>/dev/null || true
mkdir -p /home/laverdi/.openclaw

printf '{{"gateway":{{"bind":"0.0.0.0:{GATEWAY_PORT}","pairing":{{"enabled":true,"token":"{pairing_token}"}}}},"labels":{{"user_id":"{user_id}","provider":"laverdi"}}}}' > /home/laverdi/.openclaw/config.json

chown -R laverdi:laverdi /home/laverdi/.openclaw

cat > /etc/systemd/system/openclaw.service <<'SVC'
[Unit]
Description=OpenClaw Gateway (LaVerdi)
After=network.target

[Service]
Type=simple
User=laverdi
WorkingDirectory=/home/laverdi
ExecStart=/usr/bin/openclaw gateway start --foreground
Restart=on-failure
RestartSec=5
Environment=HOME=/home/laverdi

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw
ufw allow {GATEWAY_PORT}/tcp 2>/dev/null || true
echo "LaVerdi OpenClaw bootstrap done" >> /var/log/laverdi-bootstrap.log
"""
    # Vultr requires user_data to be base64-encoded
    return base64.b64encode(script.encode()).decode()


def create_instance(user_id: str, tier: str, ssh_key_id: str, pairing_token: str) -> dict:
    label = f'laverdi-{user_id}'
    payload = {
        'region':    VULTR_REGION,
        'plan':      VULTR_PLAN,
        'os_id':     VULTR_OS_ID,
        'label':     label,
        'hostname':  label,
        'sshkey_id': [ssh_key_id],
        'user_data': build_user_data(pairing_token, user_id),
        'backups':   'disabled',
        'ddos_protection': False,
        'activation_email': False,
        'tags':      ['laverdi', tier]
    }
    r = http.post(f'{VULTR_BASE}/instances', headers=_vh(), json=payload)
    r.raise_for_status()
    return r.json()['instance']


def get_instance(instance_id: str) -> dict:
    r = http.get(f'{VULTR_BASE}/instances/{instance_id}', headers=_vh())
    r.raise_for_status()
    return r.json()['instance']


def destroy_instance(instance_id: str):
    r = http.delete(f'{VULTR_BASE}/instances/{instance_id}', headers=_vh())
    if r.status_code not in (200, 204):
        raise Exception(f'Vultr delete: {r.status_code} {r.text}')


# ─── Supabase helpers ─────────────────────────────────────────────────────────
# Column mapping:
#   container_id → Vultr instance ID
#   model_id     → tier
#   port         → gateway port
#   ip_address   → public IP
#   status       → provisioning|ready|error|deleted
#   endpoint     → pairing_token
#   api_key      → JSON: {ssh_key_id, expires_at, user_id_str}
# ─────────────────────────────────────────────────────────────────────────────

def _sh():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }


def _to_db(user_uuid: str, container_id: str, tier: str, port: int,
           ip: str | None, pairing_token: str, ssh_key_id: str,
           expires_at: str) -> dict:
    """Map provisioning fields to Supabase instances columns."""
    meta = json.dumps({'ssh_key_id': ssh_key_id, 'expires_at': expires_at})
    return {
        'user_id':      user_uuid,
        'container_id': container_id,
        'model_id':     tier,
        'port':         port,
        'ip_address':   ip,
        'status':       'provisioning',
        'endpoint':     pairing_token,
        'api_key':      meta,
    }


def _from_db(row: dict) -> dict:
    """Parse Supabase row back into a friendly dict."""
    meta = {}
    if row.get('api_key'):
        try:
            meta = json.loads(row['api_key'])
        except Exception:
            pass
    return {
        'id':            row.get('id'),
        'user_id':       row.get('user_id'),
        'instance_id':   row.get('container_id'),
        'tier':          row.get('model_id'),
        'port':          row.get('port'),
        'ip_address':    row.get('ip_address'),
        'status':        row.get('status', 'provisioning'),
        'pairing_token': row.get('endpoint'),
        'ssh_key_id':    meta.get('ssh_key_id'),
        'expires_at':    meta.get('expires_at'),
        'created_at':    row.get('created_at'),
        'updated_at':    row.get('updated_at'),
    }


def supa_insert(user_uuid: str, container_id: str, tier: str, port: int,
                ip: str | None, pairing_token: str, ssh_key_id: str,
                expires_at: str) -> dict:
    record = _to_db(user_uuid, container_id, tier, port, ip,
                    pairing_token, ssh_key_id, expires_at)
    r = http.post(f'{SUPABASE_URL}/rest/v1/instances', headers=_sh(), json=record)
    r.raise_for_status()
    rows = r.json()
    return _from_db(rows[0]) if rows else record


def supa_update(container_id: str, updates: dict):
    """Update a row by container_id."""
    payload = {**updates, 'updated_at': datetime.utcnow().isoformat()}
    r = http.patch(
        f'{SUPABASE_URL}/rest/v1/instances?container_id=eq.{container_id}',
        headers=_sh(),
        json=payload
    )
    r.raise_for_status()


def supa_get_by_container(container_id: str) -> dict | None:
    r = http.get(
        f'{SUPABASE_URL}/rest/v1/instances?container_id=eq.{container_id}&limit=1',
        headers=_sh()
    )
    r.raise_for_status()
    rows = r.json()
    return _from_db(rows[0]) if rows else None


def supa_get_by_user(user_uuid: str) -> dict | None:
    """Find the most recent non-deleted instance for a user."""
    r = http.get(
        f'{SUPABASE_URL}/rest/v1/instances'
        f'?user_id=eq.{user_uuid}'
        f'&status=neq.deleted'
        f'&order=created_at.desc&limit=1',
        headers=_sh()
    )
    r.raise_for_status()
    rows = r.json()
    return _from_db(rows[0]) if rows else None


def supa_list_active() -> list:
    r = http.get(
        f'{SUPABASE_URL}/rest/v1/instances?status=neq.deleted&order=created_at.desc',
        headers=_sh()
    )
    r.raise_for_status()
    return [_from_db(row) for row in r.json()]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':    'healthy',
        'service':   'laverdi-command-center',
        'version':   '2.3.0',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200


@app.route('/api/provision-container', methods=['POST'])
def provision_container():
    """
    Provision a new OpenClaw instance on Vultr for a LaVerdi user.

    Request (JSON):
        user_id  – user UUID from Supabase auth (must exist in users table)
        tier     – "starter" | "pro" | "enterprise" (default: "starter")

    Response:
        {success, instance_id, ip, port, pairing_token, status}
    """
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get('user_id', '').strip()
    tier    = data.get('tier', 'starter').strip()

    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400

    # Validate user_id is a UUID (required by FK constraint)
    try:
        user_uuid = str(uuid.UUID(user_id))
    except ValueError:
        return jsonify({'error': 'user_id must be a valid UUID'}), 400

    # Check for existing active instance
    try:
        existing = supa_get_by_user(user_uuid)
    except Exception as e:
        return jsonify({'error': f'DB lookup failed: {str(e)}'}), 500

    if existing:
        return jsonify({
            'error':       'Instance already exists for this user',
            'instance_id': existing['instance_id'],
            'status':      existing['status'],
            'ip':          existing['ip_address'],
            'port':        existing['port']
        }), 409

    pairing_token = secrets.token_urlsafe(32)
    expires_at    = (datetime.utcnow() + timedelta(days=TRIAL_DAYS)).isoformat()

    try:
        # 1. Generate SSH key pair
        private_pem, public_openssh = generate_ssh_keypair()

        # 2. Upload public key to Vultr
        ssh_label    = f'laverdi-{user_uuid[:8]}'
        ssh_key_id   = upload_ssh_key(ssh_label, public_openssh)

        # 3. Create Vultr instance
        instance    = create_instance(user_uuid, tier, ssh_key_id, pairing_token)
        instance_id = instance['id']
        main_ip     = instance.get('main_ip') or None
        if main_ip == '0.0.0.0':
            main_ip = None

        # 4. Store in Supabase
        record = supa_insert(
            user_uuid=user_uuid,
            container_id=instance_id,
            tier=tier,
            port=GATEWAY_PORT,
            ip=main_ip,
            pairing_token=pairing_token,
            ssh_key_id=ssh_key_id,
            expires_at=expires_at
        )

        return jsonify({
            'success':       True,
            'instance_id':   instance_id,
            'ip':            main_ip or 'pending',
            'port':          GATEWAY_PORT,
            'pairing_token': pairing_token,
            'status':        'provisioning',
            'expires_at':    expires_at,
            'message':       'Instance provisioning. Poll /api/container-status/<id> for updates.'
        }), 201

    except Exception as e:
        return jsonify({'error': f'Provisioning failed: {str(e)}'}), 500


@app.route('/api/container-status/<instance_id>', methods=['GET'])
def container_status(instance_id: str):
    """
    Get current status of an OpenClaw instance.
    Syncs live data from Vultr to Supabase.
    """
    is_admin = require_auth(request)

    db = supa_get_by_container(instance_id)
    if not db:
        return jsonify({'error': 'Instance not found'}), 404

    if db['status'] == 'deleted':
        return jsonify({'instance_id': instance_id, 'status': 'deleted'}), 200

    # Try to get live status from Vultr; fall back to DB if Vultr API is unreachable
    vultr_available = True
    v_status = v_power = None
    main_ip = db['ip_address'] or ''

    try:
        v = get_instance(instance_id)
        v_status = v.get('status', 'unknown')
        v_power  = v.get('power_status', 'unknown')
        ip       = v.get('main_ip', '') or ''
        if ip and ip != '0.0.0.0':
            main_ip = ip

        if v_status == 'active' and v_power == 'running':
            our_status = 'ready'
        elif v_status in ('pending', 'resizing', 'reinstalling'):
            our_status = 'provisioning'
        else:
            our_status = v_status

        supa_update(instance_id, {
            'status':     our_status,
            'ip_address': main_ip or None,
        })

    except http.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 404:
            supa_update(instance_id, {'status': 'deleted'})
            return jsonify({'instance_id': instance_id, 'status': 'deleted'}), 200
        # IP restriction or other Vultr API error — use DB data
        vultr_available = False
        our_status = db['status']
    except Exception:
        vultr_available = False
        our_status = db['status']

    resp = {
        'instance_id':    instance_id,
        'status':         our_status,
        'ip':             main_ip or 'pending',
        'port':           db['port'],
        'user_id':        db['user_id'],
        'tier':           db['tier'],
        'created_at':     db['created_at'],
        'expires_at':     db['expires_at'],
        'vultr_live_data': vultr_available,
    }
    if is_admin:
        resp['pairing_token'] = db['pairing_token']
        if v_status:
            resp['vultr_status'] = v_status
            resp['power_status'] = v_power

    return jsonify(resp), 200


@app.route('/api/container/<instance_id>', methods=['DELETE'])
def delete_container(instance_id: str):
    """Destroy a Vultr instance and mark it deleted in Supabase."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401

    db = supa_get_by_container(instance_id)
    if not db:
        return jsonify({'error': 'Instance not found'}), 404

    if db['status'] == 'deleted':
        return jsonify({'success': True, 'message': 'Already deleted'}), 200

    try:
        destroy_instance(instance_id)
    except http.exceptions.HTTPError as e:
        code = e.response.status_code if e.response is not None else 0
        if code == 401:
            return jsonify({'error': 'Vultr API token IP restriction: cannot destroy from this server. '
                                     'Remove the IP restriction in Vultr API settings.'}), 503
        if code != 404:
            return jsonify({'error': str(e)}), 500
    except Exception as e:
        if '404' not in str(e):
            return jsonify({'error': str(e)}), 500

    if db.get('ssh_key_id'):
        delete_ssh_key(db['ssh_key_id'])

    supa_update(instance_id, {'status': 'deleted'})

    return jsonify({
        'success':     True,
        'instance_id': instance_id,
        'message':     'Instance destroyed'
    }), 200


@app.route('/api/list-containers', methods=['GET'])
def list_containers():
    """List all active instances (admin only)."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        rows = supa_list_active()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    safe = [{
        'instance_id': r['instance_id'],
        'user_id':     r['user_id'],
        'tier':        r['tier'],
        'ip_address':  r['ip_address'],
        'port':        r['port'],
        'status':      r['status'],
        'created_at':  r['created_at'],
        'expires_at':  r['expires_at'],
    } for r in rows]

    return jsonify({'total': len(safe), 'instances': safe}), 200


# ─── Legacy compat ────────────────────────────────────────────────────────────

@app.route('/api/upgrade-tier', methods=['POST'])
def upgrade_tier():
    """Stub: called by portal webhook on upgrade. Real upgrade TBD."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json(force=True, silent=True) or {}
    return jsonify({'success': True, 'message': f'Tier upgrade noted for {data.get("userId")}'}), 200


# ─── Main ─────────────────────────────────────────────────────────────────────


# Channel Management Endpoints
@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Configure a communication channel (Telegram, Discord, Slack, Signal)"""
    try:
        data = request.json or {}
        user_id = data.get('userId') or data.get('user_id')
        channels = data.get('channels', {})
        
        if not user_id:
            return {'error': 'Missing userId'}, 400
        if not channels:
            return {'error': 'No channels provided'}, 400
        
        results = {}
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        for channel_name, config in channels.items():
            if not config:
                continue
            
            # ─── TELEGRAM ─────────────────────────────────────────────────────
            if channel_name == 'telegram':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                if ':' not in bot_token:
                    results[channel_name] = {'success': False, 'error': 'Invalid token format'}
                    continue
                
                try:
                    resp = http.get(f'https://api.telegram.org/bot{bot_token}/getMe', timeout=5)
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Telegram error {resp.status_code}'}
                        continue
                    
                    bot_data = resp.json()
                    if not bot_data.get('ok'):
                        results[channel_name] = {'success': False, 'error': bot_data.get('description', 'Invalid token')}
                        continue
                    
                    bot_info = bot_data.get('result', {})
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'telegram',
                        'token': bot_token
                    }, on_conflict='user_id,platform').execute()
                    results[channel_name] = {'success': True, 'botUsername': bot_info.get('username')}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Telegram API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── DISCORD ──────────────────────────────────────────────────────
            elif channel_name == 'discord':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                try:
                    resp = http.get(
                        'https://discord.com/api/v10/users/@me',
                        headers={'Authorization': f'Bot {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        if resp.status_code == 401:
                            results[channel_name] = {'success': False, 'error': 'Invalid Discord bot token'}
                        else:
                            results[channel_name] = {'success': False, 'error': f'Discord error {resp.status_code}'}
                        continue
                    
                    bot_user = resp.json()
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'discord',
                        'token': bot_token
                    }, on_conflict='user_id,platform').execute()
                    results[channel_name] = {'success': True, 'botUsername': bot_user.get('username')}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Discord API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SLACK ────────────────────────────────────────────────────────
            elif channel_name == 'slack':
                bot_token = config.get('botToken', '').strip()
                app_token = config.get('appToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                if not app_token:
                    results[channel_name] = {'success': False, 'error': 'Missing appToken'}
                    continue
                if not bot_token.startswith('xoxb-'):
                    results[channel_name] = {'success': False, 'error': 'Invalid bot token format (must start with xoxb-)'}
                    continue
                if not app_token.startswith('xapp-'):
                    results[channel_name] = {'success': False, 'error': 'Invalid app token format (must start with xapp-)'}
                    continue
                
                try:
                    resp = http.get(
                        'https://slack.com/api/auth.test',
                        headers={'Authorization': f'Bearer {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Slack API error {resp.status_code}'}
                        continue
                    auth_data = resp.json()
                    if not auth_data.get('ok'):
                        results[channel_name] = {'success': False, 'error': auth_data.get('error', 'Invalid token')}
                        continue
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'slack',
                        'token': bot_token
                    }, on_conflict='user_id,platform').execute()
                    results[channel_name] = {'success': True, 'team': auth_data.get('team'), 'bot': auth_data.get('user')}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Slack API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SIGNAL ───────────────────────────────────────────────────────
            elif channel_name == 'signal':
                phone_number = config.get('phoneNumber', '').strip()
                if not phone_number:
                    results[channel_name] = {'success': False, 'error': 'Missing phoneNumber'}
                    continue
                if not phone_number.startswith('+'):
                    phone_number = '+' + phone_number
                if not phone_number[1:].isdigit() or len(phone_number) < 10:
                    results[channel_name] = {'success': False, 'error': 'Invalid phone number format (use E.164: +1234567890)'}
                    continue
                
                try:
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'signal',
                        'token': phone_number
                    }, on_conflict='user_id,platform').execute()
                    results[channel_name] = {
                        'success': True,
                        'message': 'Signal configuration saved. Awaiting registration link.',
                        'phoneNumber': phone_number
                    }
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── UNKNOWN CHANNEL ──────────────────────────────────────────────
            else:
                results[channel_name] = {'success': False, 'error': f'Unknown channel type: {channel_name}'}
        
        return {'success': True, 'channels': results}, 200
    
    except Exception as e:
        return {'error': f'Configure channels error: {str(e)}'}, 500

    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'Missing user_id'}, 400
        
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        result = supabase.table('channels').select('*').eq('user_id', user_id).execute()
        return {'channels': result.data}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/delete-channel', methods=['POST'])
def delete_channel():
    """Delete a channel configuration"""
    try:
        data = request.json
        user_id = data.get('user_id')
        platform = data.get('platform')
        
        if not all([user_id, platform]):
            return {'error': 'Missing required fields'}, 400
        
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        supabase.table('channels').delete().eq('user_id', user_id).eq('platform', platform).execute()
        return {'success': True}, 200
    except Exception as e:
        return {'error': str(e)}, 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f'LaVerdi Command Center v2.1 starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
