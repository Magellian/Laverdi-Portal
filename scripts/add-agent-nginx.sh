#!/bin/bash
# Add agent dashboard route to nginx

cat > /etc/nginx/hermes-instances.conf << 'EOF'
# Hermes Agent Dashboard - instance cmqx0egxq0005nx0i6sdzr9qf
location /agent/cmqx0egxq0005nx0i6sdzr9qf/ {
    proxy_pass http://127.0.0.1:9000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
EOF

nginx -t && nginx -s reload
echo "Agent route added: https://laverdi.tech/agent/cmqx0egxq0005nx0i6sdzr9qf/"
