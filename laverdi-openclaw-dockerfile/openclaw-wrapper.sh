#!/bin/bash
# Laverdi OpenClaw wrapper — intercepts self-update attempts

if [ "$1" = "update" ] || [ "$1" = "upgrade" ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Updates are managed by Laverdi."
  echo ""
  echo "  Your instance is always kept up to date"
  echo "  automatically. No action needed on your part."
  echo ""
  echo "  Questions? support@laverdi.tech"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 0
fi

exec /usr/local/bin/openclaw-real "$@"
