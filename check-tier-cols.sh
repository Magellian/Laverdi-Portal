#!/bin/bash
KEY="REDACTED_SUPABASE_SERVICE_ROLE_KEY"
BASE="https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1"

curl -s "$BASE/model_tier_map?select=*" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY"
