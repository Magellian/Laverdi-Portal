#!/bin/bash
# Expose the Hermes dashboard directly on port 9000 via nginx
# Use agent.laverdi.tech subdomain instead of path prefix

# Remove old path-based config
cat > /etc/nginx/hermes-instances.conf << 'BLANK'
# Agent instances managed by LaVerdi provisioning
# Instances use direct port access or subdomain routing
BLANK

# Add a new server block for agent access on port 9000
cat > /etc/nginx/sites-enabled/hermes-agent << 'EOF'
server {
    listen 80;
    server_name agent.laverdi.tech;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
EOF

nginx -t && nginx -s reload

# Get SSL cert for the subdomain
certbot --nginx -d agent.laverdi.tech --non-interactive --agree-tos --email chrislaverdiere@gmail.com 2>&1 || echo "SSL cert may need manual setup"

echo "Done. Access at: https://agent.laverdi.tech"
