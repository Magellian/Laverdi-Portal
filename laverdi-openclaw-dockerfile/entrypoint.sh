#!/bin/bash
set -e
echo "OpenClaw Gateway Startup"
exec openclaw gateway --bind auto --allow-unconfigured
