#!/bin/bash
# Fix SENDGRID_API_KEY
sed -i 's|^SENDGRID_API_KEY=.*|SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY|' /root/laverdi-portal/.env.local

# Fix APP_URL
sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://laverdi.tech|' /root/laverdi-portal/.env.local

# Verify
echo "--- Verify ---"
grep SENDGRID_API_KEY /root/laverdi-portal/.env.local
grep NEXT_PUBLIC_APP_URL /root/laverdi-portal/.env.local
