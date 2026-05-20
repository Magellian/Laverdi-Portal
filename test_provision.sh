#!/bin/bash
USER_ID="6fe59da4-dbe4-4517-b5ec-058c7322e166"
PAYLOAD='{"userId":"'"$USER_ID"'"}'

echo "Sending provisioning request with userId: $USER_ID"
curl -X POST http://localhost:3005/api/provision \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  2>&1
echo ""
echo "Done"
