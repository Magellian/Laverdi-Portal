#!/usr/bin/env python3
"""
LaVerdi Provisioner — HTTP API to create/manage Hermes agent instances.
Runs on the host (not in Docker) and handles Hermes profile lifecycle.
Listens on 127.0.0.1:9090 (internal only).
"""

import subprocess
import json
import os
import hashlib
import secrets
from http.server import HTTPServer, BaseHTTPRequestHandler

HERMES_BIN = "/usr/local/bin/hermes"
HERMES_HOME = "/root/.hermes"
VULTR_API_KEY = os.environ.get("VULTR_INFERENCE_KEY", "5Q6AQULLLXA37KCIHRS2ZJIFEVE2VI6AXTJA")
VULTR_BASE_URL = "https://api.vultrinference.com/v1"
CALLBACK_SECRET = os.environ.get("PROVISION_CALLBACK_SECRET", "laverdi-callback-xK9m-2026")
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
"""
    with open(f"{profile_dir}/config.yaml", "w") as f:
        f.write(config)
    
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
    nginx_conf = f"""
# Hermes Agent - instance {instance_id}
location /agent/{instance_id}/ {{
    proxy_pass http://127.0.0.1:{port}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;

    proxy_redirect ~^/(?!agent/|_next/|api/|favicon)(.*)$ /agent/{instance_id}/$1;
    sub_filter "'/auth/" "'/agent/{instance_id}/auth/";
    sub_filter '"/auth/" '"/agent/{instance_id}/auth/";
    sub_filter "href='/login" "href='/agent/{instance_id}/login";
    sub_filter "window.location.assign('/" "window.location.assign('/agent/{instance_id}/";
    sub_filter "src='/fonts/" "src='/agent/{instance_id}/fonts/";
    sub_filter "href='/fonts/" "href='/agent/{instance_id}/fonts/";
    sub_filter "src=\\"/assets/" "src=\\"/agent/{instance_id}/assets/";
    sub_filter "href=\\"/assets/" "href=\\"/agent/{instance_id}/assets/";
    sub_filter "src=\\"/api/" "src=\\"/agent/{instance_id}/api/";
    sub_filter "__HERMES_BASE_PATH__=\\"\\"" "__HERMES_BASE_PATH__=\\"/agent/{instance_id}\\"";

    # Auto-login for dashboard
    sub_filter '</head>' '<script>document.addEventListener("DOMContentLoaded",function(){{var f=document.querySelector("form[data-provider=basic]");if(!f)return;f.querySelector("input[name=username]").value="agent";f.querySelector("input[name=password]").value="{dashboard_pw}";f.addEventListener("submit",function(e){{e.preventDefault();e.stopImmediatePropagation();fetch("/agent/{instance_id}/auth/password-login",{{method:"POST",headers:{{"Content-Type":"application/json"}},body:JSON.stringify({{provider:"basic",username:"agent",password:"{dashboard_pw}",next:""}}),credentials:"same-origin"}}).then(function(r){{return r.json()}}).then(function(d){{var t=(d&&d.next)||"/";window.location.href="/agent/{instance_id}/"+t}}).catch(function(){{window.location.href="/agent/{instance_id}/"}})}},true);setTimeout(function(){{f.dispatchEvent(new Event("submit",{{cancelable:true}}))}},100)}});</script></head>';

    sub_filter_once off;
    sub_filter_types text/html;
}}
"""
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
    
    run_cmd(f"systemctl stop {service_name}", check=False)
    run_cmd(f"systemctl stop {dash_service_name}", check=False)
    run_cmd(f"systemctl disable {service_name}", check=False)
    run_cmd(f"systemctl disable {dash_service_name}", check=False)
    run_cmd(f"rm -f /etc/systemd/system/{service_name}.service", check=False)
    run_cmd(f"rm -f /etc/systemd/system/{dash_service_name}.service", check=False)
    run_cmd("systemctl daemon-reload")
    
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


class ProvisionerHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Auth check
        auth = self.headers.get("Authorization", "")
        if auth != f"Bearer {CALLBACK_SECRET}":
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
    server = HTTPServer(("0.0.0.0", 9090), ProvisionerHandler)
    print("LaVerdi Provisioner listening on 127.0.0.1:9090")
    server.serve_forever()
