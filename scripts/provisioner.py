#!/usr/bin/env python3
"""
LaVerdi Provisioner — HTTP API to create/manage Hermes agent instances.
Runs on the host (not in Docker) and handles Hermes profile lifecycle.
Listens on 127.0.0.1:9090 (internal only).
"""

import sys
import subprocess
import json
import os
import hmac
import hashlib
import secrets
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

HERMES_BIN = "/usr/local/bin/hermes"
HERMES_HOME = "/root/.hermes"
COMPANION_NSIS_DIR = "/root/laverdi-portal/companion-app/installer"
COMPANION_NSIS_SCRIPT = f"{COMPANION_NSIS_DIR}/laverdi-companion.nsi"

# No hardcoded fallbacks: a previous version of this file defaulted these to
# fixed strings when the env var was unset, which meant those strings —
# committed in plain text in this repo — were in fact the live secrets in
# production. Fail loudly at startup instead of silently running insecure.
VULTR_API_KEY = os.environ.get("VULTR_INFERENCE_KEY")
CALLBACK_SECRET = os.environ.get("PROVISION_CALLBACK_SECRET")

if not VULTR_API_KEY or not CALLBACK_SECRET:
    missing = [
        name for name, val in [
            ("VULTR_INFERENCE_KEY", VULTR_API_KEY),
            ("PROVISION_CALLBACK_SECRET", CALLBACK_SECRET),
        ] if not val
    ]
    print(f"[provisioner] FATAL: missing required env var(s): {', '.join(missing)}")
    sys.exit(1)

VULTR_BASE_URL = "https://api.vultrinference.com/v1"
PORTAL_URL = "http://127.0.0.1:3001"

# Tier to model mapping
TIER_MODELS = {
    "starter": "deepseek-ai/DeepSeek-V4-Flash",
    "pro": "moonshotai/Kimi-K2.6",
    "enterprise": "zai-org/GLM-5.1-FP8",
}

DEFAULT_MODEL = "deepseek-ai/DeepSeek-V4-Flash"


def run_cmd(cmd, check=True):
    """Run a shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}\n{result.stderr}")
    return result.stdout.strip()


def hash_password(password):
    """Generate scrypt hash for Hermes dashboard auth."""
    salt = secrets.token_bytes(16)
    import base64
    dk = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    salt_b64 = base64.b64encode(salt).decode()
    dk_b64 = base64.b64encode(dk).decode()
    return f"scrypt$16384$8$1${salt_b64}${dk_b64}"


def provision_instance(instance_id, port, tier, telegram_token=None):
    """Create a Hermes profile and start services for a new user."""
    profile_name = f"user-{instance_id[:10]}"
    profile_dir = f"{HERMES_HOME}/profiles/{profile_name}"
    model = TIER_MODELS.get(tier, DEFAULT_MODEL)
    tunnel_port = 20000 + (int(port) - 9000) * 2
    
    # Generate dashboard password
    dashboard_pw = secrets.token_urlsafe(12)
    pw_hash = hash_password(dashboard_pw)
    
    # Create profile
    run_cmd(f"{HERMES_BIN} profile create {profile_name}", check=False)  # OK if exists
    
    # Write config
    config = f"""model:
  model: {model}
  provider: custom
  base_url: {VULTR_BASE_URL}
  api_key: {VULTR_API_KEY}
dashboard:
  basic_auth:
    username: agent
    password_hash: "{pw_hash}"
terminal:
  backend: docker
  container_cpu: 0.5
  container_memory: 512
  container_disk: 2048
  container_persistent: false
  docker_extra_args:
    - "--memory-swap"
    - "512m"
security:
  allow_lazy_installs: false
proxy:
  enabled: true
  tunnel_port: {tunnel_port}
  enforce_on_docker: true
  extra_allowed_hosts:
    - host.docker.internal
  upstream_deny_cidrs:
    - 127.0.0.0/8
    - ::1/128
    - 169.254.0.0/16
    - fe80::/10
    - 10.0.0.0/8
    - 172.16.0.0/16
    - 172.18.0.0/15
    - 172.20.0.0/14
    - 172.24.0.0/13
    - 192.168.0.0/16
    - fc00::/7
    - ::ffff:0:0/96
    - 100.64.0.0/10
    - 198.18.0.0/15
# Wire this instance's sandboxed terminal to the companion delegation bridge:
# a blocked install (allow_lazy_installs: false, above) gets handed to
# the paired local companion app instead of just failing. See
# hermes-hybrid-companion-design.md section 6 and
# /usr/local/bin/hermes-delegate.
hooks_auto_accept: true
hooks:
  pre_tool_call:
    - matcher: "terminal"
      command: "/usr/local/bin/hermes-delegate hook {instance_id}"
      timeout: 115
      fail_closed: false
plugins:
  # Hermes's own dispatcher gives up waiting on ANY pre_tool_call hook after
  # this many seconds regardless of the hook's own `timeout:` above -- the
  # default is only 30s. hermes-delegate's own internal poll window is 90s
  # (see submit_and_wait's timeout_s in hermes-delegate hook), so this must
  # stay comfortably above that or a real approve+run cycle finishes too
  # late and the agent sees a generic "callback timed out" instead of our
  # actual delegated result. Found by an end-to-end test against a real
  # provisioned instance (2026-09-18) -- see Step 6 of the build plan.
  hook_callback_timeout: 110
"""
    with open(f"{profile_dir}/config.yaml", "w") as f:
        f.write(config)
    
    # Pre-approve the delegation hook's exact command so it fires
    # under the non-interactive gateway (systemd) without a first-use
    # TTY prompt -- see hermes hooks doctor / the Consent model docs.
    delegate_hook_cmd = f"/usr/local/bin/hermes-delegate hook {instance_id}"
    allowlist = {"approvals": [{"event": "pre_tool_call", "command": delegate_hook_cmd}]}
    with open(f"{profile_dir}/shell-hooks-allowlist.json", "w") as f:
        json.dump(allowlist, f)


    # Write .env
    env_lines = [
        f"OPENAI_API_KEY={VULTR_API_KEY}",
        f"OPENAI_BASE_URL={VULTR_BASE_URL}",
        "GATEWAY_ALLOW_ALL_USERS=true",
        "HERMES_DASHBOARD=true",
    ]
    if telegram_token:
        env_lines.append(f"TELEGRAM_BOT_TOKEN={telegram_token}")
    
    with open(f"{profile_dir}/.env", "w") as f:
        f.write("\n".join(env_lines) + "\n")
    
    # Configure egress lockdown (per-profile iron-proxy) -- needs OPENAI_API_KEY from .env, so must run after .env write
    run_cmd(f"{HERMES_BIN} --profile {profile_name} egress setup --tunnel-port {tunnel_port} --restart")

    # Create systemd service
    service_name = f"hermes-{instance_id}"
    service_content = f"""[Unit]
Description=Hermes Agent - {instance_id}
After=network.target

[Service]
Type=simple
User=root
Environment=HOME=/root
EnvironmentFile={profile_dir}/.env
ExecStart={HERMES_BIN} --profile {profile_name} gateway run --replace
Restart=always
RestartSec=5
TimeoutStopSec=210

[Install]
WantedBy=multi-user.target
"""
    with open(f"/etc/systemd/system/{service_name}.service", "w") as f:
        f.write(service_content)
    
    # Create dashboard service
    dash_service_name = f"hermes-dash-{instance_id}"
    dash_content = f"""[Unit]
Description=Hermes Dashboard - {instance_id}
After={service_name}.service

[Service]
Type=simple
User=root
Environment=HOME=/root
EnvironmentFile={profile_dir}/.env
ExecStart={HERMES_BIN} --profile {profile_name} dashboard --port {port} --host 0.0.0.0 --no-open --isolated --skip-build
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""
    with open(f"/etc/systemd/system/{dash_service_name}.service", "w") as f:
        f.write(dash_content)
    
    # Open firewall port
    run_cmd(f"ufw allow {port}/tcp", check=False)
    
    # Start services
    run_cmd("systemctl daemon-reload")
    run_cmd(f"systemctl enable {service_name}")
    run_cmd(f"systemctl start {service_name}")
    run_cmd(f"systemctl enable {dash_service_name}")
    run_cmd(f"systemctl start {dash_service_name}")

    # Add nginx proxy route for this instance
    # Build using string concatenation (not f-strings) to avoid escaping hell
    _I = instance_id
    _P = str(port)
    _W = dashboard_pw
    nginx_lines = [
        "",
        f"# Hermes Agent - instance {_I}",
        f"location /agent/{_I}/ {{",
        f"    proxy_pass http://127.0.0.1:{_P}/;",
        "    proxy_http_version 1.1;",
        "    proxy_set_header Upgrade $http_upgrade;",
        '    proxy_set_header Connection "upgrade";',
        "    proxy_set_header Host $host;",
        "    proxy_set_header X-Real-IP $remote_addr;",
        "    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
        "    proxy_set_header X-Forwarded-Proto $scheme;",
        "    proxy_read_timeout 86400;",
        "",
        f"    proxy_redirect ~^/(?!agent/|_next/|api/|favicon)(.*)$ /agent/{_I}/$1;",
        "",
        f'    sub_filter "\'/auth/" "\'/agent/{_I}/auth/";',
        f'    sub_filter \'"/auth/"\' \'"/agent/{_I}/auth/"\';',
        f'    sub_filter "href=\'/login" "href=\'/agent/{_I}/login";',
        f'    sub_filter "window.location.assign(\'/" "window.location.assign(\'/agent/{_I}/";',
        f'    sub_filter "src=\'/fonts/" "src=\'/agent/{_I}/fonts/";',
        f'    sub_filter "href=\'/fonts/" "href=\'/agent/{_I}/fonts/";',
        f'    sub_filter "src=\\"/assets/" "src=\\"/agent/{_I}/assets/";',
        f'    sub_filter "href=\\"/assets/" "href=\\"/agent/{_I}/assets/";',
        f'    sub_filter "src=\\"/api/" "src=\\"/agent/{_I}/api/";',
        f'    sub_filter "__HERMES_BASE_PATH__=\\"\\"" "__HERMES_BASE_PATH__=\\"/agent/{_I}\\"";',
        "",
        # Auto-login JS — built carefully to avoid nginx syntax conflicts
        '    sub_filter "</head>" "<script>document.addEventListener(\\"DOMContentLoaded\\",function(){'
        'var f=document.querySelector(\\"form[data-provider=basic]\\");'
        'if(!f)return;'
        'f.querySelector(\\"input[name=username]\\").value=\\"agent\\";'
        f'f.querySelector(\\"input[name=password]\\").value=\\"{_W}\\";'
        'f.addEventListener(\\"submit\\",function(e){'
        'e.preventDefault();e.stopImmediatePropagation();'
        f'fetch(\\"/agent/{_I}/auth/password-login\\",{{'
        'method:\\"POST\\",'
        'headers:{\\"Content-Type\\":\\"application/json\\"},'
        f'body:JSON.stringify({{provider:\\"basic\\",username:\\"agent\\",password:\\"{_W}\\",next:\\"\\"}}),'
        'credentials:\\"same-origin\\"'
        '}).then(function(r){return r.json()}).then(function(d){'
        f'var t=(d&&d.next)||\\"/\\";window.location.href=\\"/agent/{_I}/\\"+t'
        '}).catch(function(){'
        f'window.location.href=\\"/agent/{_I}/\\"'
        '})'
        '},true);'
        'setTimeout(function(){'
        'f.dispatchEvent(new Event(\\"submit\\",{cancelable:true}))'
        '},100)'
        '});</script></head>";',
        "",
        "    sub_filter_once off;",
        "    sub_filter_types text/html;",
        "}",
    ]
    nginx_conf = "\n".join(nginx_lines)
    with open("/etc/nginx/hermes-instances.conf", "a") as f:
        f.write(nginx_conf)
    run_cmd("nginx -t", check=True)
    run_cmd("nginx -s reload", check=False)
    print(f"[provisioner] Added nginx route for /agent/{instance_id}/")

    # Notify portal
    try:
        import urllib.request
        data = json.dumps({
            "instanceId": instance_id,
            "containerId": profile_name,
        }).encode()
        req = urllib.request.Request(
            f"{PORTAL_URL}/api/agents/callback",
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {CALLBACK_SECRET}",
            },
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"Callback failed (non-fatal): {e}")
    
    return {
        "status": "running",
        "profile": profile_name,
        "model": model,
        "port": port,
        "dashboard_url": f"http://108.61.195.97:{port}/",
        "dashboard_user": "agent",
        "dashboard_password": dashboard_pw,
        "gateway_service": service_name,
        "dashboard_service": dash_service_name,
    }


def teardown_instance(instance_id):
    """Stop and remove a Hermes instance."""
    service_name = f"hermes-{instance_id}"
    dash_service_name = f"hermes-dash-{instance_id}"
    profile_name = f"user-{instance_id[:10]}"
    profile_dir = f"{HERMES_HOME}/profiles/{profile_name}"

    run_cmd(f"systemctl stop {service_name}", check=False)
    run_cmd(f"systemctl stop {dash_service_name}", check=False)
    run_cmd(f"systemctl disable {service_name}", check=False)
    run_cmd(f"systemctl disable {dash_service_name}", check=False)
    run_cmd(f"rm -f /etc/systemd/system/{service_name}.service", check=False)
    run_cmd(f"rm -f /etc/systemd/system/{dash_service_name}.service", check=False)
    run_cmd("systemctl daemon-reload")
    run_cmd(f"systemctl reset-failed {service_name} {dash_service_name}", check=False)

    # Remove nginx location block
    import re
    try:
        with open("/etc/nginx/hermes-instances.conf", "r") as f:
            content = f.read()
        content = re.sub(
            r"# Hermes Agent - instance " + re.escape(instance_id) + r".*?\n\}",
            "", content, flags=re.DOTALL
        )
        with open("/etc/nginx/hermes-instances.conf", "w") as f:
            f.write(content)
        run_cmd("nginx -t", check=False)
        run_cmd("nginx -s reload", check=False)
        print(f"[provisioner] Removed nginx route for /agent/{instance_id}/")
    except Exception as e:
        print(f"[provisioner] Nginx cleanup failed (non-fatal): {e}")

    # Stop this profile's iron-proxy egress process before deleting its config/token
    run_cmd(f"{HERMES_BIN} --profile {profile_name} egress stop", check=False)

    # Remove Hermes profile directory
    run_cmd(f"rm -rf {profile_dir}", check=False)

    return {"status": "stopped", "instance_id": instance_id}


def add_telegram(instance_id, bot_token):
    """Add Telegram bot to an existing instance."""
    profile_name = f"user-{instance_id[:10]}"
    profile_dir = f"{HERMES_HOME}/profiles/{profile_name}"
    env_path = f"{profile_dir}/.env"
    
    # Read existing .env and add/update TELEGRAM_BOT_TOKEN
    lines = []
    if os.path.exists(env_path):
        with open(env_path) as f:
            lines = [l for l in f.read().splitlines() if not l.startswith("TELEGRAM_BOT_TOKEN=")]
    lines.append(f"TELEGRAM_BOT_TOKEN={bot_token}")
    
    with open(env_path, "w") as f:
        f.write("\n".join(lines) + "\n")
    
    # Restart gateway to pick up new token
    service_name = f"hermes-{instance_id}"
    run_cmd(f"systemctl restart {service_name}")
    
    return {"status": "ok", "platform": "telegram"}


def build_companion_installer(instance_id, pairing_token, base_url="https://laverdi.tech"):
    """Build a personalized LaVerdi Companion installer (.exe) for one
    instance -- pairing token baked in via NSIS command-line defines so the
    installer pairs and registers its own background task silently. Runs
    makensis on this host (not available inside the app's Alpine container).
    Returns the built file's bytes, base64-encoded for the JSON response.
    """
    import re as _re
    import base64
    import tempfile

    if not _re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", instance_id):
        raise ValueError("invalid instanceId")
    if not _re.fullmatch(r"[0-9a-f]{48}", pairing_token):
        raise ValueError("invalid pairingToken")
    if not _re.fullmatch(r"https://[a-zA-Z0-9_.-]{1,255}", base_url):
        raise ValueError("invalid baseUrl")

    with tempfile.TemporaryDirectory() as tmp:
        out_path = f"{tmp}/LaVerdiCompanion-Setup.exe"
        cmd = [
            "makensis",
            f"-DINSTANCEID={instance_id}",
            f"-DPAIRTOKEN={pairing_token}",
            f"-DBASEURL={base_url}",
            f"-DOUTFILE={out_path}",
            COMPANION_NSIS_SCRIPT,
        ]
        proc = subprocess.run(
            cmd, cwd=COMPANION_NSIS_DIR, capture_output=True, text=True, timeout=60
        )
        if proc.returncode != 0:
            raise RuntimeError(f"makensis failed: {proc.stdout}\n{proc.stderr}")

        with open(out_path, "rb") as f:
            data = f.read()

    return {
        "status": "ok",
        "filename": "LaVerdiCompanion-Setup.exe",
        "dataBase64": base64.b64encode(data).decode(),
    }


class ProvisionerHandler(BaseHTTPRequestHandler):
    # A client that opens a connection and never finishes sending a
    # request (or just sits there) used to wedge the whole server: the
    # old HTTPServer handles one connection at a time, so anyone -- a
    # scanner, a stalled client, this port used to be reachable from the
    # whole internet -- could block every real caller behind it. Now
    # threaded (below), plus bound how long we wait on one connection.
    timeout = 30

    def do_POST(self):
        # Auth check (constant-time compare to avoid a timing side-channel)
        auth = self.headers.get("Authorization", "")
        if not hmac.compare_digest(auth, f"Bearer {CALLBACK_SECRET}"):
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error":"unauthorized"}')
            return
        
        content_length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_length)) if content_length else {}
        
        try:
            if self.path == "/provision":
                result = provision_instance(
                    body["instanceId"],
                    body["port"],
                    body.get("tier", "starter"),
                    body.get("telegramToken"),
                )
            elif self.path == "/teardown":
                result = teardown_instance(body["instanceId"])
            elif self.path == "/telegram":
                result = add_telegram(body["instanceId"], body["botToken"])
            elif self.path == "/companion-installer":
                result = build_companion_installer(
                    body["instanceId"],
                    body["pairingToken"],
                    body.get("baseUrl", "https://laverdi.tech"),
                )
            else:
                self.send_response(404)
                self.end_headers()
                return
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        print(f"[provisioner] {args[0]}")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 9090), ProvisionerHandler)
    server.daemon_threads = True
    print("LaVerdi Provisioner listening on 0.0.0.0:9090 (threaded, firewalled to localhost + docker bridge)")
    server.serve_forever()
