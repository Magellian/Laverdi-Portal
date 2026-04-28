# API Testing Guide

Quick reference for testing the system via curl and API endpoints.

---

## Agent Service (Port 5000)

### Health Check
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

---

### Send Task

```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "task-1",
    "name": "Hello World",
    "command": "echo",
    "args": ["hello", "world"]
  }'
```

**Response (202 Accepted):**
```json
{
  "id": "task-1",
  "status": "pending",
  "message": "Task queued for execution"
}
```

---

### Get All Tasks

```bash
curl http://localhost:5000/tasks
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Hello World",
      "command": "echo",
      "args": ["hello", "world"],
      "status": "completed",
      "result": {
        "stdout": "hello world\n",
        "stderr": "",
        "returncode": 0
      },
      "created_at": "2024-01-15T10:30:00.000000",
      "completed_at": "2024-01-15T10:30:01.000000"
    }
  ]
}
```

---

### Get Specific Task

```bash
curl http://localhost:5000/task/task-1
```

**Response:**
```json
{
  "id": "task-1",
  "name": "Hello World",
  "command": "echo",
  "args": ["hello", "world"],
  "status": "completed",
  "result": {
    "stdout": "hello world\n",
    "stderr": "",
    "returncode": 0
  },
  "created_at": "2024-01-15T10:30:00.000000",
  "completed_at": "2024-01-15T10:30:01.000000"
}
```

---

## Command Center (Port 8000)

### Register Agent

```bash
curl -X POST http://localhost:8000/api/agents \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "agent-1",
    "name": "My First Agent",
    "url": "http://agent:5000"
  }'
```

**Response (200 OK):**
```json
{
  "agent": {
    "id": "agent-1",
    "name": "My First Agent",
    "url": "http://agent:5000",
    "status": "online",
    "lastSeen": "2024-01-15T10:30:00.000Z",
    "tasksCompleted": 0
  }
}
```

---

### List Agents

```bash
curl http://localhost:8000/api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-1",
      "name": "My First Agent",
      "url": "http://agent:5000",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "tasksCompleted": 0
    }
  ]
}
```

---

### Send Task to Agent

```bash
curl -X POST http://localhost:8000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{
    "agentId": "agent-1",
    "name": "System Info",
    "command": "uname",
    "args": ["-a"]
  }'
```

**Response (202 Accepted):**
```json
{
  "task": {
    "id": "task-1234567890-xyz",
    "agentId": "agent-1",
    "agentName": "My First Agent",
    "name": "System Info",
    "command": "uname",
    "args": ["-a"],
    "status": "pending",
    "result": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null
  },
  "message": "Task sent to agent"
}
```

---

### List Tasks

```bash
curl http://localhost:8000/api/tasks
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-1234567890-xyz",
      "agentId": "agent-1",
      "agentName": "My First Agent",
      "name": "System Info",
      "command": "uname",
      "args": ["-a"],
      "status": "completed",
      "result": {
        "stdout": "Linux agent-service 5.10.0 #1 SMP...",
        "stderr": "",
        "returncode": 0
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:30:01.000Z"
    }
  ]
}
```

---

## Example Workflows

### Workflow 1: Simple Echo Test

**Step 1: Register Agent**
```bash
curl -X POST http://localhost:8000/api/agents \
  -H 'Content-Type: application/json' \
  -d '{"id":"a1","name":"Agent1","url":"http://agent:5000"}'
```

**Step 2: Send Task**
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"agentId":"a1","command":"echo","args":["test"]}'
```

**Step 3: View Results**
```bash
curl http://localhost:8000/api/tasks
```

---

### Workflow 2: Direct Agent Commands

**Send directly to agent (no command center):**
```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"direct-1",
    "command":"ls",
    "args":["-la"]
  }'
```

**Check results:**
```bash
curl http://localhost:5000/task/direct-1
```

---

### Workflow 3: With Callback

**Send task with callback URL:**
```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"callback-1",
    "command":"date",
    "args":[],
    "callback_url":"http://your-server/webhook"
  }'
```

Agent will POST result to `callback_url` when complete.

---

## Error Handling

### Missing Required Fields
```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{"name":"test"}'
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: id, command"
}
```

---

### Invalid Agent
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"agentId":"nonexistent","command":"echo"}'
```

**Response (404 Not Found):**
```json
{
  "error": "Agent not found. Register agent first."
}
```

---

### Task Timeout
If a task takes longer than 30 seconds:

**Task Status:**
```json
{
  "status": "failed",
  "result": {
    "error": "Task timed out after 30 seconds"
  }
}
```

---

## Testing Script (bash)

```bash
#!/bin/bash

# Complete workflow test
set -e

echo "1️⃣ Register agent..."
AGENT=$(curl -s -X POST http://localhost:8000/api/agents \
  -H 'Content-Type: application/json' \
  -d '{"id":"test-agent","name":"Test","url":"http://agent:5000"}' \
  | jq -r '.agent.id')

echo "✅ Registered: $AGENT"

echo "2️⃣ Send task..."
TASK=$(curl -s -X POST http://localhost:8000/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"agentId\":\"$AGENT\",\"command\":\"echo\",\"args\":[\"hello\"]}" \
  | jq -r '.task.id')

echo "✅ Task: $TASK"

echo "3️⃣ Wait for completion..."
sleep 2

echo "4️⃣ View result..."
curl -s http://localhost:8000/api/tasks | jq '.tasks[0]'

echo "✅ Done!"
```

---

## Using jq for JSON Parsing

```bash
# Get first task
curl -s http://localhost:5000/tasks | jq '.tasks[0]'

# Get task status
curl -s http://localhost:5000/task/task-1 | jq '.status'

# Get task output
curl -s http://localhost:5000/task/task-1 | jq '.result.stdout'

# Count completed tasks
curl -s http://localhost:5000/tasks | jq '[.tasks[] | select(.status=="completed")] | length'

# Get all failures
curl -s http://localhost:5000/tasks | jq '.tasks[] | select(.status=="failed")'
```

---

## Rate Limiting (Not Implemented in MVP)

Currently no rate limits. For production:
- Implement Redis-based rate limiting
- Add request throttling
- Implement API key authentication

---

## Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET requests, successful operations |
| 202 | Accepted | Task accepted but not yet complete |
| 400 | Bad Request | Missing fields, invalid JSON |
| 404 | Not Found | Agent/Task ID doesn't exist |
| 405 | Method Not Allowed | Using wrong HTTP method (POST vs GET) |
| 500 | Server Error | Internal error in agent/command center |

---

## Debugging Tips

### Check all tasks
```bash
curl -s http://localhost:5000/tasks | jq '.'
```

### Check specific task
```bash
curl -s http://localhost:5000/task/<task-id> | jq '.'
```

### Monitor in real-time
```bash
while true; do
  clear
  curl -s http://localhost:5000/tasks | jq '.tasks[0:3]'
  sleep 1
done
```

### Check agent health
```bash
curl -i http://localhost:5000/health
```

### Check command center
```bash
curl -i http://localhost:8000/api/agents
```

---

**Tip:** Save these as shell scripts or aliases for quick access!
