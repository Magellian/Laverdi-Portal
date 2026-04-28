#!/bin/bash
# Fix the nginx agent location block
sed -i 's|location ~ .*agent.*{|location ~ ^/agent/([0-9]+)(/.*)?\$ {|' /etc/nginx/nginx.conf

# Also fix the proxy_pass to handle optional path
sed -i 's|proxy_pass http://127.0.0.1:\$agent_port/\$2\$is_args\$args;|proxy_pass http://127.0.0.1:$agent_port$2$is_args$args;|' /etc/nginx/nginx.conf

nginx -t && systemctl reload nginx && echo "Nginx fixed and reloaded"
