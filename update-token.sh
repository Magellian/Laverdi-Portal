#!/bin/bash
KEY="REDACTED_SUPABASE_SERVICE_ROLE_KEY"
TOKEN="591d1f4e96883a6dc14396629e957c1c0fb2b3d0c8a32d76"
USER_ID="e64c80d4-daea-4b6e-8df9-60ef2f476b0c"
URL="https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?user_id=eq.${USER_ID}"

curl -s -X PATCH "$URL" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$TOKEN\"}"

echo "Done - token updated to $TOKEN"
