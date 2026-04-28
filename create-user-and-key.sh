#!/bin/bash
KEY="REDACTED_SUPABASE_SERVICE_ROLE_KEY"
BASE="https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1"

EMAIL="chrislaverdiere@gmail.com"
TIER="starter"
API_KEY="sk-do-DFg_YMpFEXXjXEYIHKZd3DnxaSYVFfNfM-ic0-ye1AL800d8Dfc9_xe06J"
USER_ID=$(uuidgen)

echo "Creating user: $EMAIL"
curl -s -X POST "$BASE/users" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$USER_ID\",\"email\":\"$EMAIL\",\"tier\":\"$TIER\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

echo ""
echo "Creating API key..."
curl -s -X POST "$BASE/api_keys" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"key\":\"$API_KEY\",\"tier\":\"$TIER\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

echo ""
echo "Done"
