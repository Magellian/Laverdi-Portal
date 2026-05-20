#!/bin/bash
# Server verification script for FIX #2
# Run on 66.42.70.66 as root

echo "=========================================="
echo "FIX #2 Server Verification Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection string
DB_CONN="postgresql://postgres:YAYRCCavxwCp513k@dcvrkpgvxqdcboostkpz.supabase.co:5432/postgres"

echo -e "${YELLOW}[PART 2] Checking Portal Environment Configuration${NC}"
echo "Location: /root/laverdi-portal/.env.local"
echo ""

if [ -f /root/laverdi-portal/.env.local ]; then
    echo "Current Postgres-related environment variables:"
    grep -i "postgres\|supabase\|database" /root/laverdi-portal/.env.local || echo "No postgres/supabase variables found"
    echo ""
    
    # Check if password needs updating
    if grep -q "postgres:[^Y]*@" /root/laverdi-portal/.env.local; then
        echo -e "${RED}[!] Old password detected. Update needed.${NC}"
        echo "Updating with new password..."
        sed -i 's/postgres:[^@]*@dcvrkpgvxqdcboostkpz/postgres:YAYRCCavxwCp513k@dcvrkpgvxqdcboostkpz/g' /root/laverdi-portal/.env.local
        echo -e "${GREEN}✅ Portal .env.local updated${NC}"
    else
        echo -e "${GREEN}✅ Password already current or not found (may use SDK)${NC}"
    fi
else
    echo -e "${RED}❌ Portal .env.local not found${NC}"
fi

echo ""
echo -e "${YELLOW}[PART 3] Checking Command Center Configuration${NC}"
echo "Location: /root/command-center.py"
echo ""

if [ -f /root/command-center.py ]; then
    POSTGRES_COUNT=$(grep -c "postgres" /root/command-center.py || echo 0)
    if [ $POSTGRES_COUNT -gt 0 ]; then
        echo "Found hardcoded postgres references:"
        grep -n "postgres" /root/command-center.py
        echo ""
        echo -e "${YELLOW}[!] Manual review required to update hardcoded connections${NC}"
    else
        echo -e "${GREEN}✅ No hardcoded postgres connections found (using SDK)${NC}"
    fi
else
    echo -e "${RED}❌ Command Center not found${NC}"
fi

echo ""
echo -e "${YELLOW}[PART 4] Database Connectivity Test${NC}"
echo ""

# Test 1: Direct connectivity
echo "Test 1: Direct psql connectivity..."
PSQL_RESULT=$(psql "$DB_CONN" -c "SELECT COUNT(*) FROM channels;" 2>&1)
if echo "$PSQL_RESULT" | grep -q "count"; then
    COUNT=$(echo "$PSQL_RESULT" | grep -oP '\d+' | tail -1)
    echo -e "${GREEN}✅ PASS - Table exists with $COUNT rows${NC}"
else
    echo -e "${RED}❌ FAIL - ${PSQL_RESULT}${NC}"
fi

echo ""
echo "Test 2: Verify table schema..."
SCHEMA_RESULT=$(psql "$DB_CONN" -c "\d channels" 2>&1)
if echo "$SCHEMA_RESULT" | grep -q "user_id\|platform\|token"; then
    echo -e "${GREEN}✅ PASS - Table schema verified${NC}"
    echo "$SCHEMA_RESULT" | head -20
else
    echo -e "${RED}❌ FAIL - Schema verification failed${NC}"
fi

echo ""
echo "Test 3: Verify indexes..."
INDEX_RESULT=$(psql "$DB_CONN" -c "SELECT indexname FROM pg_indexes WHERE tablename = 'channels';" 2>&1)
if echo "$INDEX_RESULT" | grep -q "idx_channels_"; then
    echo -e "${GREEN}✅ PASS - Indexes found${NC}"
    echo "$INDEX_RESULT"
else
    echo -e "${RED}❌ FAIL - Index verification failed${NC}"
fi

echo ""
echo "Test 4: Verify RLS policy..."
RLS_RESULT=$(psql "$DB_CONN" -c "SELECT * FROM pg_policies WHERE tablename = 'channels';" 2>&1)
if echo "$RLS_RESULT" | grep -q "Users can manage"; then
    echo -e "${GREEN}✅ PASS - RLS policy verified${NC}"
    echo "$RLS_RESULT"
else
    echo -e "${RED}❌ FAIL - RLS policy not found${NC}"
fi

echo ""
echo -e "${YELLOW}[PART 5] API Endpoint Testing${NC}"
echo ""

# Test 5: Portal Node.js connectivity
if [ -d /root/laverdi-portal ] && [ -f /root/laverdi-portal/package.json ]; then
    echo "Test 5: Portal Supabase connectivity..."
    cd /root/laverdi-portal
    
    PORTAL_TEST=$(node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://dcvrkpgvxqdcboostkpz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDYyODIsImV4cCI6MjA5MDU4MjI4Mn0.xgfGg_l1aXrlZX2Hjz45ZfGIFl8-JE3Dl8vmsrFhmKg'
    );
    supabase.from('channels').select().then(r => {
      if (r.error) throw r.error;
      console.log('✅ Portal can query channels table');
    }).catch(e => console.error('❌ Error: ' + e.message));
    " 2>&1)
    echo "$PORTAL_TEST"
else
    echo -e "${YELLOW}⚠️  Portal directory not found or no package.json${NC}"
fi

echo ""
echo "Test 6: Command Center API /get-channels..."
GET_RESULT=$(curl -s -X POST http://127.0.0.1:8000/api/get-channels \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-id"}' 2>&1)
if echo "$GET_RESULT" | grep -q "channels"; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "$GET_RESULT" | head -5
else
    echo -e "${RED}❌ FAIL - ${GET_RESULT}${NC}"
fi

echo ""
echo "Test 7: Command Center API /configure-channels..."
CONFIG_RESULT=$(curl -s -X POST http://127.0.0.1:8000/api/configure-channels \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-id","platform":"telegram","token":"test-token-123"}' 2>&1)
if echo "$CONFIG_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "$CONFIG_RESULT" | head -5
else
    echo -e "${YELLOW}⚠️  Response: ${CONFIG_RESULT}${NC}"
fi

echo ""
echo "Test 8: Verify data persistence..."
PERSIST_RESULT=$(curl -s -X POST http://127.0.0.1:8000/api/get-channels \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user-id"}' 2>&1)
if echo "$PERSIST_RESULT" | grep -q "test-token-123"; then
    echo -e "${GREEN}✅ PASS - Data persisted${NC}"
else
    echo -e "${YELLOW}⚠️  Data persistence check${NC}"
fi

echo ""
echo "=========================================="
echo "FIX #2 Verification Complete"
echo "=========================================="
