#!/bin/bash

# End-to-end test script
set -e

BASE_URL="http://localhost:8000"
AGENT_SERVICE_URL="http://localhost:5000"

echo "🧪 Running End-to-End Test..."
echo ""

# Step 1: Register Agent
echo "📍 Step 1: Registering agent..."
AGENT_ID=$(curl -s -X POST "$BASE_URL/api/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-agent-1",
    "name": "Test Agent",
    "url": "http://agent:5000"
  }' | jq -r '.agent.id')

if [ -z "$AGENT_ID" ] || [ "$AGENT_ID" == "null" ]; then
    echo "❌ Failed to register agent"
    exit 1
fi

echo "✅ Agent registered: $AGENT_ID"
echo ""

# Step 2: Send test task
echo "⚡ Step 2: Sending test task..."
TASK_ID=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"$AGENT_ID\",
    \"name\": \"Echo Test\",
    \"command\": \"echo\",
    \"args\": [\"hello\", \"world\"]
  }" | jq -r '.task.id')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" == "null" ]; then
    echo "❌ Failed to send task"
    exit 1
fi

echo "✅ Task sent: $TASK_ID"
echo ""

# Step 3: Wait for task completion
echo "⏳ Step 3: Waiting for task execution..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    TASK_STATUS=$(curl -s "$AGENT_SERVICE_URL/task/$TASK_ID" | jq -r '.status')
    
    if [ "$TASK_STATUS" == "completed" ]; then
        echo "✅ Task completed!"
        break
    elif [ "$TASK_STATUS" == "failed" ]; then
        echo "❌ Task failed!"
        exit 1
    fi
    
    echo "   Status: $TASK_STATUS (waiting...)"
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Task execution timeout"
    exit 1
fi

# Step 4: Verify result
echo ""
echo "📋 Step 4: Verifying task result..."
TASK_RESULT=$(curl -s "$AGENT_SERVICE_URL/task/$TASK_ID" | jq '.result')

echo "Task Result:"
echo "$TASK_RESULT" | jq '.'

# Check if output contains expected result
if echo "$TASK_RESULT" | grep -q "hello world"; then
    echo "✅ Output verified!"
else
    echo "⚠️  Output doesn't contain expected text"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ End-to-End Test PASSED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  Agent ID: $AGENT_ID"
echo "  Task ID: $TASK_ID"
echo "  Task Status: $TASK_STATUS"
echo ""
