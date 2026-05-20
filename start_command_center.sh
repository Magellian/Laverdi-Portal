#!/bin/bash
cd /root
python3 command-center.py > /tmp/command-center.log 2>&1 &
sleep 3
ps aux | grep command-center.py | grep -v grep
