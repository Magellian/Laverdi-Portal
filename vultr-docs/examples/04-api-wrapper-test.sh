#!/bin/bash
# Example 4: Test the API wrapper with curl
# Usage: VULTR_API_KEY=sk-... bash 04-api-wrapper-test.sh

BASE_URL="${WRAPPER_URL:-http://localhost:3030}"

echo "=== Vultr API Wrapper Tests ==="
echo "Endpoint: $BASE_URL"
echo

# Health check
echo "--- Health Check ---"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo

# List models
echo "--- Models ---"
curl -s "$BASE_URL/v1/models" | python3 -m json.tool
echo

# Chat completion
echo "--- Chat Completion ---"
curl -s -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.3-70b-instruct",
    "messages": [{"role": "user", "content": "Say hello in French"}],
    "max_tokens": 50
  }' | python3 -m json.tool
echo

# Streaming
echo "--- Streaming ---"
curl -s -X POST "$BASE_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.3-70b-instruct",
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true,
    "max_tokens": 100
  }'
echo

# Usage stats
echo "--- Usage Stats ---"
curl -s "$BASE_URL/admin/usage" | python3 -m json.tool
