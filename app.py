#!/usr/bin/env python3
"""
Laverdi Command Center
Provisions and manages OpenClaw containers for paid users
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import docker
import uuid
import os
import json
import time
import threading
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Docker client
try:
    client = docker.from_env()
    logger.info("✓ Docker client connected")
except Exception as e:
    logger.error(f"✗ Failed to connect to Docker: {e}")
    client = None

# Configuration
DOCKER_NETWORK = os.getenv('DOCKER_NETWORK', 'laverdi-network')
OPENCLAW_IMAGE = os.getenv('OPENCLAW_IMAGE', 'laverdi-openclaw:latest')
BASE_PORT = int(os.getenv('BASE_PORT', 9000))
VPS_ADMIN_TOKEN = os.getenv('VPS_ADMIN_TOKEN', '')
DO_API_KEY = os.getenv('DO_API_KEY', '')
DO_INFERENCE_KEY = os.getenv('DO_INFERENCE_KEY', 'sk-do-REDACTED_DO_INFERENCE_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
PUBLIC_IP = os.getenv('PUBLIC_IP', '64.23.253.97')
USER_DATA_DIR = os.getenv('USER_DATA_DIR', '/var/lib/laverdi/users')

if not VPS_ADMIN_TOKEN:
    logger.warning('⚠️ VPS_ADMIN_TOKEN not set! Provisioning will be disabled.')
    VPS_ADMIN_TOKEN = 'DISABLED'

if not ANTHROPIC_API_KEY:
    logger.warning('⚠️ ANTHROPIC_API_KEY not set! Anthropic models will not work.')

# Track allocated ports to avoid conflicts
allocated_ports = set()

# ============================================================================
# TIER-BASED MODEL CONFIGURATION
# ============================================================================

DO_INFERENCE_URL = "https://inference.do-ai.run/v1"

TIER_CONFIG = {
    "free": {
        "primary": "anthropic/claude-haiku-4-5-20251001",
        "fallbacks": ["do-inference/llama3.3-70b-instruct"],
        "allowed": [
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 50000,
        "cap_model": "do-inference/llama3.3-70b-instruct",
        "description": "Haiku 4.5 (50K/day) → Llama 3.3 fallback"
    },
    "trial": {
        "primary": "anthropic/claude-haiku-4-5-20251001",
        "fallbacks": ["do-inference/llama3.3-70b-instruct"],
        "allowed": [
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 50000,
        "cap_model": "do-inference/llama3.3-70b-instruct",
        "description": "Haiku 4.5 (50K/day) → Llama 3.3 fallback"
    },
    "starter": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": [
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 500000,
        "cap_model": "anthropic/claude-haiku-4-5-20251001",
        "description": "Sonnet 4.6 (500K/day) → Haiku → Llama 3.3"
    },
    "professional": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-opus-4-6",
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 2000000,
        "cap_model": "anthropic/claude-sonnet-4-6",
        "description": "Opus 4.6 (2M/day) → Sonnet → Haiku → Llama 3.3"
    },
    "pro": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-opus-4-6",
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4-5-20251001",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 2000000,
        "cap_model": "anthropic/claude-sonnet-4-6",
        "description": "Opus 4.6 (2M/day) → Sonnet → Haiku → Llama 3.3"
    }
}


def build_openclaw_config(gateway_token, port, tier="free"):
    """Build the full openclaw.json config for a container based on user tier"""
    tc = TIER_CONFIG.get(tier, TIER_CONFIG["free"])

    models_allowlist = {}
    for m in tc["allowed"]:
        short = m.split("/")[-1]
        models_allowlist[m] = {"alias": short}

    config = {
        "gateway": {
            "auth": {
                "mode": "token",
                "token": gateway_token
            },
            "controlUi": {
                "allowedOrigins": [
                    f"http://{PUBLIC_IP}:{port}",
                    "https://laverdi.tech",
                    "http://localhost:18789",
                    "http://127.0.0.1:18789"
                ],
                "dangerouslyDisableDeviceAuth": True
            },
            "bind": "lan",
            "trustedProxies": ["172.16.0.0/12", "10.0.0.0/8", "127.0.0.1"]
        },
        "agents": {
            "defaults": {
                "model": {
                    "primary": tc["primary"],
                    "fallbacks": tc["fallbacks"]
                },
                "models": models_allowlist
            }
        },
        "models": {
            "mode": "replace",
            "providers": {
                "do-inference": {
                    "baseUrl": DO_INFERENCE_URL,
                    "apiKey": DO_INFERENCE_KEY,
                    "api": "openai-completions",
                    "models": [
                        {
                            "id": "llama3.3-70b-instruct",
                            "name": "Llama 3.3 70B",
                            "reasoning": False,
                            "input": ["text"],
                            "contextWindow": 131072,
                            "maxTokens": 8192
                        }
                    ]
                }
            }
        },
        "env": {
            "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY
        },
        "plugins": {
            "entries": {
                "anthropic": {
                    "enabled": True
                },
                "bonjour": {
                    "enabled": False
                },
                "phone-control": {
                    "enabled": False
                },
                "acpx": {
                    "enabled": False
                },
                "bluebubbles": {
                    "enabled": False
                }
            }
        },
        "meta": {
            "lastTouchedVersion": "2026.4.24",
            "lastTouchedAt": datetime.utcnow().isoformat() + "Z"
        }
    }

    logger.info(f"Built config for tier '{tier}': primary={tc['primary']} fallbacks={tc['fallbacks']} cap={tc['token_cap']}")
    return config


def authenticate_request(token=None):
    """Verify admin token from Authorization header"""
    if not token:
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token or token != VPS_ADMIN_TOKEN:
        return False
    return True


def get_next_available_port():
    """Find next available port for OpenClaw instance"""
    used = set()
    try:
        for c in client.containers.list(all=True):
            ps = c.attrs.get('NetworkSettings', {}).get('Ports', {}) or {}
            for pb in ps.values():
                if pb:
                    for b in pb:
                        used.add(int(b['HostPort']))
    except Exception:
        pass
    used.update(allocated_ports)
    port = BASE_PORT
    while port in used or port < 9000:
        port += 1
    allocated_ports.add(port)
    return port


def ensure_network_exists():
    try:
        client.networks.get(DOCKER_NETWORK)
    except docker.errors.NotFound:
        logger.info(f"Creating network '{DOCKER_NETWORK}'...")
        client.networks.create(DOCKER_NETWORK, driver='bridge')
        logger.info(f"✓ Network '{DOCKER_NETWORK}' created")


def ensure_image_exists():
    try:
        client.images.get(OPENCLAW_IMAGE)
        return True
    except docker.errors.ImageNotFound:
        logger.warning(f"⚠ Image '{OPENCLAW_IMAGE}' not found.")
        return False


def prepare_user_data_dir(user_id, gateway_token, port, tier):
    """
    Pre-create user data directory with openclaw.json config on HOST.
    This directory gets volume-mounted into the container so the gateway
    starts with the right config from the very first boot — no restart needed.
    """
    user_dir = os.path.join(USER_DATA_DIR, user_id)
    config_dir = os.path.join(user_dir, '.openclaw')
    workspace_dir = os.path.join(user_dir, 'workspace')
    
    os.makedirs(config_dir, exist_ok=True)
    os.makedirs(workspace_dir, exist_ok=True)
    
    config = build_openclaw_config(gateway_token, port, tier)
    config_path = os.path.join(config_dir, 'openclaw.json')
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Also write backup copies so gateway doesn't overwrite on first boot
    for backup_name in ['openclaw.json.last-good', 'openclaw.json.bak']:
        with open(os.path.join(config_dir, backup_name), 'w') as f:
            json.dump(config, f, indent=2)
    
    # Pre-populate workspace with welcome files to prevent BOOTSTRAP.md prompt
    agents_md = os.path.join(workspace_dir, 'AGENTS.md')
    if not os.path.exists(agents_md):
        with open(agents_md, 'w') as wf:
            wf.write("""# Your AI Assistant

Welcome! I'm your personal AI assistant, powered by LaVerdi.

## Getting Started
- Just type a message to start chatting
- I can help with writing, research, coding, scheduling, and more
- Use /help to see available commands
- Use /model to check your current AI model
- Use /status to see session info

## Your Workspace
Files created during our conversations are saved here on your private server.

## Need Help?
Visit https://laverdi.tech/dashboard for account management.
""")

    soul_md = os.path.join(workspace_dir, 'SOUL.md')
    if not os.path.exists(soul_md):
        with open(soul_md, 'w') as wf:
            wf.write("""# Assistant Personality

Be helpful, direct, and concise. Skip filler phrases like "Great question!"
Just help. Have opinions when asked. Be resourceful before asking for clarification.
""")

    identity_md = os.path.join(workspace_dir, 'IDENTITY.md')
    if not os.path.exists(identity_md):
        with open(identity_md, 'w') as wf:
            wf.write("""# Identity

- **Name:** Assistant
- **Vibe:** Helpful and direct
- **Emoji:** 🦞
""")

    logger.info(f"✓ Prepared user data at {user_dir} with config for tier '{tier}'")
    return user_dir


def notify_portal_async(user_id, port, callback_url):
    """Notify portal when instance is ready (async)"""
    def _notify():
        # Wait for gateway to be responsive
        for i in range(20):
            time.sleep(3)
            try:
                import urllib.request
                resp = urllib.request.urlopen(f'http://127.0.0.1:{port}', timeout=3)
                if resp.status == 200:
                    logger.info(f"✓ Gateway responding on port {port}")
                    break
            except Exception:
                pass
        
        if callback_url and user_id:
            try:
                import urllib.request
                data = json.dumps({"userId": user_id, "status": "ready"}).encode()
                req = urllib.request.Request(
                    callback_url,
                    data=data,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                urllib.request.urlopen(req, timeout=10)
                logger.info(f"✓ Notified portal: instance ready for {user_id}")
            except Exception as e:
                logger.error(f"Failed to notify portal: {e}")
    
    thread = threading.Thread(target=_notify, daemon=True)
    thread.start()


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    docker_status = "ok" if client else "error"
    return jsonify({"status": "ok", "docker": docker_status})


# ============================================================================
# TIER INFO
# ============================================================================

@app.route('/api/tiers', methods=['GET'])
def get_tiers():
    result = {}
    for tier_name, tc in TIER_CONFIG.items():
        if tier_name in ("pro",):
            continue
        result[tier_name] = {
            "primary": tc["primary"],
            "fallbacks": tc["fallbacks"],
            "allowed_models": tc["allowed"],
            "token_cap_daily": tc["token_cap"],
            "cap_model": tc["cap_model"],
            "description": tc["description"],
        }
    return jsonify(result), 200


# ============================================================================
# PROVISIONING ENDPOINTS
# ============================================================================

@app.route('/api/provision-container', methods=['POST'])
def provision_container():
    if not authenticate_request():
        logger.warning("Unauthorized provision request")
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json(force=True)
        user_id = data.get('userId')
        tier = data.get('tier', 'free')
        container_name = data.get('containerName') or f"openclaw-{user_id[:8]}-{int(datetime.now().timestamp())}"
        pairing_token = data.get('pairingToken', uuid.uuid4().hex)

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        tc = TIER_CONFIG.get(tier, TIER_CONFIG["free"])
        logger.info(f"Provisioning: user={user_id} tier={tier} → {tc['description']}")

        ensure_network_exists()
        if not ensure_image_exists():
            return jsonify({
                "error": "OpenClaw image not found. Build it first.",
                "image": OPENCLAW_IMAGE
            }), 500

        port = get_next_available_port()
        file_port = port + 1
        gateway_token = uuid.uuid4().hex + uuid.uuid4().hex

        # Pre-create user data directory with config on HOST filesystem
        user_dir = prepare_user_data_dir(user_id, gateway_token, port, tier)

        env_vars = {
            'USER_ID': user_id,
            'PAIRING_TOKEN': pairing_token,
            'ANTHROPIC_API_KEY': ANTHROPIC_API_KEY,
        }

        logger.info(f"Creating container '{container_name}' on port {port} with volume mount {user_dir}...")

        # Volume mount: host user_dir/.openclaw → container /root/.openclaw/.openclaw
        # Volume mount: host user_dir/workspace → container /root/.openclaw/workspace
        container = client.containers.run(
            OPENCLAW_IMAGE,
            name=container_name,
            ports={'18789/tcp': port, '18790/tcp': file_port},
            network=DOCKER_NETWORK,
            environment=env_vars,
            detach=True,
            restart_policy={'Name': 'unless-stopped'},
            dns=['8.8.8.8', '1.1.1.1'],
            volumes={
                os.path.join(user_dir, '.openclaw'): {
                    'bind': '/root/.openclaw/.openclaw',
                    'mode': 'rw'
                },
                os.path.join(user_dir, 'workspace'): {
                    'bind': '/root/.openclaw/workspace',
                    'mode': 'rw'
                }
            },
            labels={
                'laverdi.user_id': user_id,
                'laverdi.tier': tier,
                'laverdi.model': tc['primary'],
                'laverdi.token_cap': str(tc['token_cap']),
                'laverdi.created_at': datetime.now().isoformat(),
                'laverdi.gateway_port': str(port),
            }
        )

        logger.info(f"✓ Container created: {container.id[:12]} (config pre-mounted, no restart needed)")

        # Start async portal notification (just waits for gateway to be ready)
        callback_url = data.get('callbackUrl') or f'http://127.0.0.1:3000/api/webhooks/instance-ready'
        notify_portal_async(user_id, port, callback_url)

        return jsonify({
            "status": "provisioning",
            "userId": user_id,
            "tier": tier,
            "model": tc['primary'],
            "tokenCap": tc['token_cap'],
            "allowedModels": tc['allowed'],
            "fallbacks": tc['fallbacks'],
            "containerId": container.id[:12],
            "containerName": container_name,
            "port": port,
            "ipAddress": PUBLIC_IP,
            "pairingToken": pairing_token,
            "gatewayToken": gateway_token,
            "accessUrl": f"https://laverdi.tech/agent/{port}/chat?session=main",
            "filePort": file_port,
        }), 201

    except docker.errors.APIError as e:
        logger.error(f"Docker API error: {e}")
        return jsonify({"error": f"Docker error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Error provisioning container: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# TIER UPGRADE ENDPOINT
# ============================================================================

@app.route('/api/upgrade-tier', methods=['POST'])
def upgrade_tier():
    """Update model config for an existing container when user upgrades tier"""
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json(force=True)
        user_id = data.get('userId')
        new_tier = data.get('tier')

        if not user_id or not new_tier:
            return jsonify({"error": "Missing userId or tier"}), 400

        if new_tier not in TIER_CONFIG:
            return jsonify({"error": f"Invalid tier: {new_tier}"}), 400

        containers = client.containers.list(
            filters={'label': f'laverdi.user_id={user_id}'}
        )

        if not containers:
            return jsonify({"error": "No container found for user"}), 404

        container = containers[0]
        port_bindings = container.attrs.get('NetworkSettings', {}).get('Ports', {})
        port = None
        for pb in port_bindings.get('18789/tcp', []):
            port = int(pb['HostPort'])
            break

        if not port:
            return jsonify({"error": "Could not determine container port"}), 500

        # Read current gateway token from host filesystem
        config_path = os.path.join(USER_DATA_DIR, user_id, '.openclaw', 'openclaw.json')
        if os.path.exists(config_path):
            with open(config_path) as f:
                current_config = json.load(f)
            gateway_token = current_config.get('gateway', {}).get('auth', {}).get('token', '')
        else:
            # Fallback: read from container
            exit_code, output = container.exec_run(
                'cat /root/.openclaw/.openclaw/openclaw.json'
            )
            current_config = json.loads(output.decode())
            gateway_token = current_config.get('gateway', {}).get('auth', {}).get('token', '')

        # Write new config to host (volume-mounted, so container sees it immediately)
        new_config = build_openclaw_config(gateway_token, port, new_tier)
        with open(config_path, 'w') as f:
            json.dump(new_config, f, indent=2)

        # Restart container to pick up new config
        container.restart(timeout=10)

        tc = TIER_CONFIG[new_tier]
        logger.info(f"✓ Upgraded {user_id} to '{new_tier}': {tc['description']}")

        return jsonify({
            "status": "upgraded",
            "userId": user_id,
            "tier": new_tier,
            "model": tc['primary'],
            "tokenCap": tc['token_cap'],
            "allowedModels": tc['allowed'],
            "fallbacks": tc['fallbacks'],
            "containerName": container.name,
        }), 200

    except Exception as e:
        logger.error(f"Error upgrading tier: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================================
# CONTAINER MANAGEMENT
# ============================================================================

@app.route('/api/delete-container', methods=['POST'])
def delete_container():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json(force=True)
        user_id = data.get('userId')

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        logger.info(f"Deleting container for user: {user_id}")

        containers = client.containers.list(
            all=True,
            filters={'label': f'laverdi.user_id={user_id}'}
        )

        if not containers:
            return jsonify({"status": "not_found"}), 404

        deleted = []
        for container in containers:
            try:
                container.stop(timeout=10)
                container.remove()
                deleted.append(container.id[:12])
                logger.info(f"✓ Deleted {container.id[:12]}")
            except Exception as e:
                logger.error(f"Error deleting {container.id[:12]}: {e}")

        # Note: user data in USER_DATA_DIR is preserved for potential re-provision
        return jsonify({
            "status": "deleted",
            "userId": user_id,
            "deletedContainers": deleted
        }), 200

    except Exception as e:
        logger.error(f"Error deleting container: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Update channel config (Telegram, WhatsApp, Signal, Discord, etc.) for a user's container"""
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json(force=True)
        user_id = data.get('userId')
        channels = data.get('channels', {})  # dict of channel configs

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        if not channels:
            return jsonify({"error": "Missing channels config"}), 400

        config_path = os.path.join(USER_DATA_DIR, user_id, '.openclaw', 'openclaw.json')
        if not os.path.exists(config_path):
            return jsonify({"error": "No config found for user"}), 404

        with open(config_path) as f:
            c = json.load(f)

        # Merge channel configs
        c.setdefault('channels', {})
        for channel_name, channel_config in channels.items():
            if channel_config is None:
                # Remove channel
                c['channels'].pop(channel_name, None)
                logger.info(f"Removed channel '{channel_name}' for user {user_id}")
            else:
                c['channels'][channel_name] = channel_config
                logger.info(f"Configured channel '{channel_name}' for user {user_id}")

        with open(config_path, 'w') as f:
            json.dump(c, f, indent=2)

        # Restart container to pick up changes
        containers = client.containers.list(filters={'label': f'laverdi.user_id={user_id}'})
        restarted = False
        if containers:
            containers[0].restart(timeout=10)
            restarted = True
            logger.info(f"✓ Restarted container for {user_id} after channel config update")

        return jsonify({
            "status": "updated",
            "userId": user_id,
            "channels": list(channels.keys()),
            "restarted": restarted
        }), 200

    except Exception as e:
        logger.error(f"Error configuring channels: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """Get current channel config for a user (tokens redacted)"""
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    config_path = os.path.join(USER_DATA_DIR, user_id, '.openclaw', 'openclaw.json')
    if not os.path.exists(config_path):
        return jsonify({"channels": {}}), 200

    with open(config_path) as f:
        c = json.load(f)

    channels = c.get('channels', {})

    # Redact sensitive tokens but show which channels are configured
    result = {}
    for ch_name, ch_config in channels.items():
        result[ch_name] = {
            "enabled": ch_config.get('enabled', True),
            "configured": True,
            # Show last 4 chars of token for confirmation
            "tokenHint": (ch_config.get('botToken') or ch_config.get('token') or '')[-4:] or None
        }

    return jsonify({"channels": result}), 200


@app.route('/api/container-status/<container_id>', methods=['GET'])
def container_status(container_id):
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        container = client.containers.get(container_id)
        return jsonify({
            "id": container.id[:12],
            "name": container.name,
            "status": container.status,
            "state": container.attrs.get('State', {}),
            "ports": container.ports,
        }), 200
    except docker.errors.NotFound:
        return jsonify({"error": "Container not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/list-containers', methods=['GET'])
def list_containers():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        containers = client.containers.list(filters={'label': 'laverdi.user_id'})
        result = []
        for container in containers:
            labels = container.labels or {}
            result.append({
                "id": container.id[:12],
                "name": container.name,
                "userId": labels.get('laverdi.user_id'),
                "tier": labels.get('laverdi.tier', 'unknown'),
                "model": labels.get('laverdi.model', 'unknown'),
                "tokenCap": labels.get('laverdi.token_cap', 'unknown'),
                "status": container.status,
                "ports": container.ports,
            })
        return jsonify({"containers": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def stats():
    if not authenticate_request():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        containers = client.containers.list(filters={'label': 'laverdi.user_id'})
        running = len([c for c in containers if c.status == 'running'])
        total = len(containers)
        return jsonify({
            "total_containers": total,
            "running": running,
            "stopped": total - running,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("LAVERDI COMMAND CENTER v2")
    logger.info(f"Image: {OPENCLAW_IMAGE} | Ports: {BASE_PORT}+ | IP: {PUBLIC_IP}")
    logger.info(f"User data: {USER_DATA_DIR}")
    logger.info(f"Anthropic key: {'✓ set' if ANTHROPIC_API_KEY else '✗ MISSING'}")
    logger.info(f"DO Inference key: {'✓ set' if DO_INFERENCE_KEY else '✗ MISSING'}")
    logger.info("─" * 60)
    for tier_name, tc in TIER_CONFIG.items():
        if tier_name == "pro":
            continue
        logger.info(f"  {tier_name:14s} → {tc['description']}")
    logger.info("=" * 60)

    # Ensure user data directory exists
    os.makedirs(USER_DATA_DIR, exist_ok=True)

    if client:
        try:
            ensure_network_exists()
        except Exception as e:
            logger.warning(f"Failed to ensure network: {e}")

    app.run(host='0.0.0.0', port=8000, debug=False)
