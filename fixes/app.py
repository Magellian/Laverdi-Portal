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
DO_INFERENCE_KEY = os.getenv('DO_INFERENCE_KEY', '')
PUBLIC_IP = os.getenv('PUBLIC_IP', '64.23.142.154')

if not VPS_ADMIN_TOKEN:
    logger.warning('⚠️ VPS_ADMIN_TOKEN not set! Provisioning will be disabled.')
    VPS_ADMIN_TOKEN = 'DISABLED'

# Track allocated ports to avoid conflicts
allocated_ports = set()

# Gateway setup script (injected into each container)
GATEWAY_SETUP_SCRIPT = '''
const fs = require('fs');
const path = require('path');
const configPath = '/root/.openclaw/.openclaw/openclaw.json';
const token = process.env.GATEWAY_TOKEN;
const port = process.env.PORT;
const publicIp = process.env.PUBLIC_IP;

let c = {};
try { c = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}

c.gateway = c.gateway || {};
c.gateway.bind = '0.0.0.0';
c.gateway.auth = { mode: 'token', token: token };
c.gateway.controlUi = c.gateway.controlUi || {};
c.gateway.controlUi.allowedOrigins = [
    'http://' + publicIp + ':' + port,
    'https://laverdi.tech',
    'http://localhost:18789',
    'http://127.0.0.1:18789'
];
c.gateway.controlUi.dangerouslyDisableDeviceAuth = true;

fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(c, null, 2));
console.log('Gateway configured');
'''


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


def configure_gateway_async(container_name, gateway_token, port, user_id=None, callback_url=None):
    """Wait for container to start, then inject gateway config and restart"""
    def _configure():
        try:
            container = client.containers.get(container_name)

            # Wait for gateway to generate initial config (up to 30s)
            for i in range(15):
                time.sleep(2)
                try:
                    exit_code, _ = container.exec_run(
                        'test -f /root/.openclaw/.openclaw/openclaw.json'
                    )
                    if exit_code == 0:
                        logger.info(f"✓ Config file exists after {(i+1)*2}s")
                        break
                except Exception:
                    pass
            else:
                logger.warning("Config file not found after 30s, configuring anyway")

            # Write setup script into container
            import tarfile
            import io
            tar_stream = io.BytesIO()
            with tarfile.open(fileobj=tar_stream, mode='w') as tar:
                script_bytes = GATEWAY_SETUP_SCRIPT.encode('utf-8')
                info = tarfile.TarInfo(name='setup-gateway.js')
                info.size = len(script_bytes)
                tar.addfile(info, io.BytesIO(script_bytes))
            tar_stream.seek(0)
            container.put_archive('/tmp', tar_stream)

            # Run the setup script
            env = {
                'GATEWAY_TOKEN': gateway_token,
                'PORT': str(port),
                'PUBLIC_IP': PUBLIC_IP,
            }
            exit_code, output = container.exec_run(
                'node /tmp/setup-gateway.js',
                environment=env
            )
            logger.info(f"Setup script output: {output.decode()}, exit: {exit_code}")

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
        container_name = data.get('containerName') or f"openclaw-{user_id[:8]}-{int(datetime.now().timestamp())}"
        pairing_token = data.get('pairingToken', uuid.uuid4().hex)

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        logger.info(f"Provisioning container for user: {user_id}")

        ensure_network_exists()
        if not ensure_image_exists():
            return jsonify({
                "error": "OpenClaw image not found. Build it first.",
                "image": OPENCLAW_IMAGE
            }), 500

        # Get next available port
        port = get_next_available_port()

        # Generate a gateway auth token for this user
        gateway_token = uuid.uuid4().hex + uuid.uuid4().hex  # 64 char hex token

        # Prepare environment variables
        env_vars = {
            'USER_ID': user_id,
            'PAIRING_TOKEN': pairing_token,
            'DO_API_KEY': DO_API_KEY,
            'DO_INFERENCE_KEY': DO_INFERENCE_KEY,
        }

        # Create container
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
                'laverdi.created_at': datetime.now().isoformat(),
                'laverdi.gateway_port': str(port),
            }
        )

        logger.info(f"✓ Container created: {container.id[:12]}")

        # Configure gateway async (inject token, origins, restart, notify portal when ready)
        callback_url = data.get('callbackUrl', '').replace('/webhooks/do-callback', '/webhooks/instance-ready')
        if not callback_url:
            callback_url = f'http://127.0.0.1:3000/api/webhooks/instance-ready'
        configure_gateway_async(container_name, gateway_token, port, user_id, callback_url)

        return jsonify({
            "status": "provisioning",
            "userId": user_id,
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
    logger.info("=" * 60)

    if client:
        try:
            ensure_network_exists()
        except Exception as e:
            logger.warning(f"Failed to ensure network: {e}")

    app.run(host='0.0.0.0', port=8000, debug=False)
