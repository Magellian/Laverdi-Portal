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
PUBLIC_IP = os.getenv('PUBLIC_IP', '64.23.142.154')

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

# DO Inference endpoint (OpenAI-compatible) — for fallback models
DO_INFERENCE_URL = "https://inference.do-ai.run/v1"

# Tier definitions:
#   primary   = default model for the tier
#   fallbacks = ordered fallback chain (used at token cap or API failure)
#   allowed   = models the user can manually /model switch to
#   token_cap = daily token limit (input + output combined)
#   cap_model = model to drop to when cap is hit (before going to DO fallback)

TIER_CONFIG = {
    "free": {
        "primary": "anthropic/claude-haiku-4.5",
        "fallbacks": ["do-inference/llama3.3-70b-instruct"],
        "allowed": [
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 50000,       # 50K tokens/day
        "cap_model": "do-inference/llama3.3-70b-instruct",
        "description": "Haiku 4.5 (50K/day) → Llama 3.3 fallback"
    },
    "trial": {
        "primary": "anthropic/claude-haiku-4.5",
        "fallbacks": ["do-inference/llama3.3-70b-instruct"],
        "allowed": [
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 50000,       # 50K tokens/day
        "cap_model": "do-inference/llama3.3-70b-instruct",
        "description": "Haiku 4.5 (50K/day) → Llama 3.3 fallback"
    },
    "starter": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": [
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 500000,      # 500K tokens/day
        "cap_model": "anthropic/claude-haiku-4.5",
        "description": "Sonnet 4.6 (500K/day) → Haiku → Llama 3.3"
    },
    "professional": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-opus-4-6",
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 2000000,     # 2M tokens/day
        "cap_model": "anthropic/claude-sonnet-4-6",
        "description": "Opus 4.6 (2M/day) → Sonnet → Haiku → Llama 3.3"
    },
    "pro": {
        "primary": "anthropic/claude-opus-4-6",
        "fallbacks": [
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "allowed": [
            "anthropic/claude-opus-4-6",
            "anthropic/claude-sonnet-4-6",
            "anthropic/claude-haiku-4.5",
            "do-inference/llama3.3-70b-instruct",
        ],
        "token_cap": 2000000,     # 2M tokens/day
        "cap_model": "anthropic/claude-sonnet-4-6",
        "description": "Opus 4.6 (2M/day) → Sonnet → Haiku → Llama 3.3"
    }
}


def build_openclaw_config(gateway_token, port, tier="free"):
    """Build the full openclaw.json config for a container based on user tier"""
    tc = TIER_CONFIG.get(tier, TIER_CONFIG["free"])

    # Build the models allowlist with aliases
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
            "bind": "0.0.0.0"
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
            "mode": "merge",
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
        "meta": {
            "lastTouchedVersion": "2026.4.21",
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
    """Ensure the Docker network exists for containers"""
    try:
        client.networks.get(DOCKER_NETWORK)
    except docker.errors.NotFound:
        logger.info(f"Creating network '{DOCKER_NETWORK}'...")
        client.networks.create(DOCKER_NETWORK, driver='bridge')
        logger.info(f"✓ Network '{DOCKER_NETWORK}' created")


def ensure_image_exists():
    """Check if OpenClaw image exists"""
    try:
        client.images.get(OPENCLAW_IMAGE)
        return True
    except docker.errors.ImageNotFound:
        logger.warning(f"⚠ Image '{OPENCLAW_IMAGE}' not found.")
        return False


def write_config_to_container(container, config):
    """Write openclaw.json + backup files into a container"""
    import tarfile
    import io

    config_json = json.dumps(config, indent=2)
    config_bytes = config_json.encode('utf-8')

    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        for fname in ['openclaw.json', 'openclaw.json.last-good', 'openclaw.json.bak']:
            info = tarfile.TarInfo(name=fname)
            info.size = len(config_bytes)
            tar.addfile(info, io.BytesIO(config_bytes))

    tar_stream.seek(0)
    container.put_archive('/root/.openclaw/.openclaw', tar_stream)


def configure_gateway_async(container_name, gateway_token, port, tier="free", user_id=None, callback_url=None):
    """Wait for container to start, then inject full config and restart"""
    def _configure():
        try:
            container = client.containers.get(container_name)

            # Wait for gateway to create config dir (up to 30s)
            for i in range(15):
                time.sleep(2)
                try:
                    exit_code, _ = container.exec_run('test -d /root/.openclaw/.openclaw')
                    if exit_code == 0:
                        logger.info(f"✓ Config dir exists after {(i+1)*2}s")
                        break
                except Exception:
                    pass
            else:
                logger.warning("Config dir not found after 30s, creating it")
                container.exec_run('mkdir -p /root/.openclaw/.openclaw')

            # Build and write the full config
            config = build_openclaw_config(gateway_token, port, tier)
            write_config_to_container(container, config)

            tc = TIER_CONFIG.get(tier, TIER_CONFIG["free"])
            logger.info(f"✓ Config written: {tc['description']}")

            # Restart to pick up new config
            container.restart(timeout=10)
            logger.info(f"✓ Container {container_name} configured and restarted")

            # Wait for gateway to come back up (up to 45s)
            for i in range(15):
                time.sleep(3)
                try:
                    import urllib.request
                    resp = urllib.request.urlopen(f'http://127.0.0.1:{port}', timeout=3)
                    if resp.status == 200:
                        logger.info(f"✓ Gateway responding on port {port}")
                        break
                except Exception:
                    pass

            # Notify portal that instance is ready
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

        except Exception as e:
            logger.error(f"Failed to configure gateway for {container_name}: {e}")

    thread = threading.Thread(target=_configure, daemon=True)
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
    """Return tier configuration (public, no auth needed)"""
    result = {}
    for tier_name, tc in TIER_CONFIG.items():
        if tier_name in ("pro",):  # skip alias
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
        gateway_token = uuid.uuid4().hex + uuid.uuid4().hex

        env_vars = {
            'USER_ID': user_id,
            'PAIRING_TOKEN': pairing_token,
            'ANTHROPIC_API_KEY': ANTHROPIC_API_KEY,
        }

        logger.info(f"Creating container '{container_name}' on port {port}...")

        file_port = port + 1
        container = client.containers.run(
            OPENCLAW_IMAGE,
            name=container_name,
            ports={'18789/tcp': port, '18790/tcp': file_port},
            network=DOCKER_NETWORK,
            environment=env_vars,
            detach=True,
            restart_policy={'Name': 'unless-stopped'},
            labels={
                'laverdi.user_id': user_id,
                'laverdi.tier': tier,
                'laverdi.model': tc['primary'],
                'laverdi.token_cap': str(tc['token_cap']),
                'laverdi.created_at': datetime.now().isoformat(),
                'laverdi.gateway_port': str(port),
            }
        )

        logger.info(f"✓ Container created: {container.id[:12]}")

        callback_url = data.get('callbackUrl', '').replace('/webhooks/do-callback', '/webhooks/instance-ready')
        if not callback_url:
            callback_url = f'http://127.0.0.1:3000/api/webhooks/instance-ready'
        configure_gateway_async(container_name, gateway_token, port, tier, user_id, callback_url)

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

        # Read current config to get gateway token
        exit_code, output = container.exec_run(
            'cat /root/.openclaw/.openclaw/openclaw.json'
        )
        current_config = json.loads(output.decode())
        gateway_token = current_config.get('gateway', {}).get('auth', {}).get('token', '')

        # Build new config with upgraded tier
        new_config = build_openclaw_config(gateway_token, port, new_tier)
        write_config_to_container(container, new_config)

        # Restart container
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

        return jsonify({
            "status": "deleted",
            "userId": user_id,
            "deletedContainers": deleted
        }), 200

    except Exception as e:
        logger.error(f"Error deleting container: {e}")
        return jsonify({"error": str(e)}), 500


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
    logger.info("LAVERDI COMMAND CENTER")
    logger.info(f"Image: {OPENCLAW_IMAGE} | Ports: {BASE_PORT}+ | IP: {PUBLIC_IP}")
    logger.info(f"Anthropic key: {'✓ set' if ANTHROPIC_API_KEY else '✗ MISSING'}")
    logger.info(f"DO Inference key: {'✓ set' if DO_INFERENCE_KEY else '✗ MISSING'}")
    logger.info("─" * 60)
    for tier_name, tc in TIER_CONFIG.items():
        if tier_name == "pro":
            continue
        logger.info(f"  {tier_name:14s} → {tc['description']}")
    logger.info("=" * 60)

    if client:
        try:
            ensure_network_exists()
        except Exception as e:
            logger.warning(f"Failed to ensure network: {e}")

    app.run(host='0.0.0.0', port=8000, debug=False)
