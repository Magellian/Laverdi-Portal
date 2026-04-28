#!/bin/bash

# Laverdi Portal API Tests

BASE_URL="http://localhost:3000"
ADMIN_TOKEN="admin-token-change-me-in-production"
TEST_EMAIL="test-$(date +%s)@laverdi-test.com"

echo "🧪 Laverdi Portal API Tests"
echo "=================================================="
echo ""
echo "📧 Test email: $TEST_EMAIL"
echo "🔐 Admin token: (using default)"
echo ""

# Test 1: Invalid token
echo "1️⃣  Testing invalid token handling..."
echo ""
curl -s -X POST "$BASE_URL/api/admin/upgrade-user" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"tier\":\"starter\"}" \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 2: Missing token
echo "2️⃣  Testing missing authorization header..."
echo ""
curl -s -X POST "$BASE_URL/api/admin/upgrade-user" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"tier\":\"starter\"}" \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Valid token, non-existent user
echo "3️⃣  Testing valid token with non-existent user..."
echo ""
curl -s -X POST "$BASE_URL/api/admin/upgrade-user" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"tier\":\"starter\"}" \
  | jq '.'

echo ""
echo "=================================================="
echo ""
echo "✨ Tests completed!"
echo ""
echo "Next steps:"
echo "1. Create a user via signup: http://localhost:3000/signup"
echo "2. Get the email you used"
echo "3. Test the upgrade with that email:"
echo ""
echo "curl -X POST http://localhost:3000/api/admin/upgrade-user \\"
echo "  -H 'Authorization: Bearer admin-token-change-me-in-production' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"YOUR_EMAIL\",\"tier\":\"starter\"}'"
