#!/bin/bash

# Test insert with minimal fields
curl -s -X POST 'https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances' \
  -H 'apikey: REDACTED_SUPABASE_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"390e5c8d-bbda-4167-84af-8c87e829127a","droplet_id":"test123","status":"ready"}'
