#!/bin/bash
# Fix Docker daemon DNS and disable IPv6
echo '{"ipv6": false, "dns": ["8.8.8.8", "1.1.1.1"]}' > /etc/docker/daemon.json
cat /etc/docker/daemon.json
systemctl restart docker
echo "Docker restarted with new DNS config"
sleep 5
docker ps --format "table {{.Names}}\t{{.Status}}"
