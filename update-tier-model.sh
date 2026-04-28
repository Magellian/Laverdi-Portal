#!/bin/bash
KEY="REDACTED_SUPABASE_SERVICE_ROLE_KEY"
BASE="https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1"

# Update free tier to DeepSeek V3
curl -s -X PATCH "$BASE/model_tier_map?tier=eq.free" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "deepseek-v3", "description": "Powerful open-source AI for everyday tasks"}'

echo "Free tier updated to deepseek-v3"
