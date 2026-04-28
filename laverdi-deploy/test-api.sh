#!/bin/bash

# API Test Script for Command Center & Agent
# Tests all endpoints and task types

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
COMMAND_CENTER_URL="${1:-http://localhost:5000}"
TEST_AGENT_URL="${2:-http://localhost:5001}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   OpenClaw Command Center & Agent API Test Suite          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Command Center: $COMMAND_CENTER_URL"
echo "  Test Agent: $TEST_AGENT_URL\n"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
test_result() {
    local name=$1
    local result=$2
    local output=$3
    
    if [ "$result" = "0" ]; then
        echo -e "${GREEN}✓${NC} $name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name"
        if [ -n "$output" ]; then
            echo -e "  ${RED}Error: $output${NC}"
        fi
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# 1. Command Center Health
echo -e "${YELLOW}=== Command Center Health ===${NC}"
RESPONSE=$(curl -s "$COMMAND_CENTER_URL/api/health")
test_result "Command Center Health Check" $(echo "$RESPONSE" | grep -q '"status"' && echo 0 || echo 1) "$RESPONSE"

# 2. Agent Health
echo -e "\n${YELLOW}=== Agent Health ===${NC}"
RESPONSE=$(curl -s "$TEST_AGENT_URL/health")
test_result "Agent Health Check" $(echo "$RESPONSE" | grep -q '"status"' && echo 0 || echo 1) "$RESPONSE"

# 3. Register Agent with Command Center
echo -e "\n${YELLOW}=== Agent Registration ===${NC}"
RESPONSE=$(curl -s -X POST "$COMMAND_CENTER_URL/api/agents/register" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "agent_url": "'$TEST_AGENT_URL'"
  }')
test_result "Register Agent" $(echo "$RESPONSE" | grep -q '"status"' && echo 0 || echo 1) "$RESPONSE"

# 4. Get Agents List
echo -e "\n${YELLOW}=== Agent Management ===${NC}"
RESPONSE=$(curl -s "$COMMAND_CENTER_URL/api/agents")
test_result "Get Agents List" $(echo "$RESPONSE" | grep -q '"agents"' && echo 0 || echo 1) "$RESPONSE"

# 5. Echo Task
echo -e "\n${YELLOW}=== Task: Echo ===${NC}"
ECHO_TASK_ID=$(uuidgen 2>/dev/null || echo "echo-task-$(date +%s)")
RESPONSE=$(curl -s -X POST "$TEST_AGENT_URL/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$ECHO_TASK_ID'",
    "type": "echo",
    "params": {
      "message": "Hello from test suite!"
    }
  }')
test_result "Send Echo Task" $(echo "$RESPONSE" | grep -q '"task_id"' && echo 0 || echo 1) "$RESPONSE"

# Wait and check result
sleep 2
RESPONSE=$(curl -s "$TEST_AGENT_URL/tasks/$ECHO_TASK_ID")
test_result "Check Echo Task Result" $(echo "$RESPONSE" | grep -q '"completed"' && echo 0 || echo 1) "$RESPONSE"

# 6. System Info Task
echo -e "\n${YELLOW}=== Task: System Info ===${NC}"
SYSINFO_TASK_ID=$(uuidgen 2>/dev/null || echo "sysinfo-task-$(date +%s)")
RESPONSE=$(curl -s -X POST "$TEST_AGENT_URL/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$SYSINFO_TASK_ID'",
    "type": "system_info",
    "params": {}
  }')
test_result "Send System Info Task" $(echo "$RESPONSE" | grep -q '"task_id"' && echo 0 || echo 1) "$RESPONSE"

sleep 2
RESPONSE=$(curl -s "$TEST_AGENT_URL/tasks/$SYSINFO_TASK_ID")
test_result "Check System Info Task Result" $(echo "$RESPONSE" | grep -q '"completed"' && echo 0 || echo 1) "$RESPONSE"

# 7. Web Request Task
echo -e "\n${YELLOW}=== Task: Web Request ===${NC}"
WEB_TASK_ID=$(uuidgen 2>/dev/null || echo "web-task-$(date +%s)")
RESPONSE=$(curl -s -X POST "$TEST_AGENT_URL/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$WEB_TASK_ID'",
    "type": "web_request",
    "params": {
      "url": "https://example.com"
    }
  }')
test_result "Send Web Request Task" $(echo "$RESPONSE" | grep -q '"task_id"' && echo 0 || echo 1) "$RESPONSE"

sleep 3
RESPONSE=$(curl -s "$TEST_AGENT_URL/tasks/$WEB_TASK_ID")
test_result "Check Web Request Task Result" $(echo "$RESPONSE" | grep -q '"status"' && echo 0 || echo 1) "$RESPONSE"

# 8. Read File Task
echo -e "\n${YELLOW}=== Task: Read File ===${NC}"
FILE_TASK_ID=$(uuidgen 2>/dev/null || echo "file-task-$(date +%s)")
RESPONSE=$(curl -s -X POST "$TEST_AGENT_URL/task" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$FILE_TASK_ID'",
    "type": "read_file",
    "params": {
      "path": "/etc/hostname"
    }
  }')
test_result "Send Read File Task" $(echo "$RESPONSE" | grep -q '"task_id"' && echo 0 || echo 1) "$RESPONSE"

sleep 2
RESPONSE=$(curl -s "$TEST_AGENT_URL/tasks/$FILE_TASK_ID")
test_result "Check Read File Task Result" $(echo "$RESPONSE" | grep -q '"completed"' && echo 0 || echo 1) "$RESPONSE"

# 9. Get All Tasks from Agent
echo -e "\n${YELLOW}=== Task History ===${NC}"
RESPONSE=$(curl -s "$TEST_AGENT_URL/tasks")
test_result "Get All Tasks from Agent" $(echo "$RESPONSE" | grep -q '"tasks"' && echo 0 || echo 1) "$RESPONSE"

# 10. Command Center Create Task
echo -e "\n${YELLOW}=== Create Task via Command Center ===${NC}"
RESPONSE=$(curl -s -X POST "$COMMAND_CENTER_URL/api/tasks/create" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "type": "echo",
    "params": {
      "message": "Task from command center"
    }
  }')
test_result "Create Task via Command Center" $(echo "$RESPONSE" | grep -q '"task_id"' && echo 0 || echo 1) "$RESPONSE"

# 11. Get Tasks from Command Center
echo -e "\n${YELLOW}=== Task Management (Command Center) ===${NC}"
RESPONSE=$(curl -s "$COMMAND_CENTER_URL/api/tasks")
test_result "Get All Tasks" $(echo "$RESPONSE" | grep -q '"tasks"' && echo 0 || echo 1) "$RESPONSE"

# 12. Agent Info
echo -e "\n${YELLOW}=== Agent Info ===${NC}"
RESPONSE=$(curl -s "$TEST_AGENT_URL/info")
test_result "Get Agent Info" $(echo "$RESPONSE" | grep -q '"agent_id"' && echo 0 || echo 1) "$RESPONSE"

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Summary                                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))

echo -e "\n${YELLOW}Success Rate: $PERCENTAGE% ($TESTS_PASSED/$TOTAL)${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
