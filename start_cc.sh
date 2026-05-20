#!/bin/bash
pkill -f 'python3 command-center.py' 2>/dev/null || true
sleep 1
cd /root
nohup python3 command-center.py > /tmp/cc.log 2>&1 &
sleep 4
curl -s http://laverdi-command-center:8000/health | jq .
