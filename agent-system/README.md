# 🎯 Distributed Task Execution System

A scalable, containerized system for distributing and executing tasks across multiple agent services, with a web-based command center for management and monitoring.

## 📋 Architecture

```
┌─────────────────────┐
│  Command Center     │
│  (Next.js + API)    │
│  :8000              │
└──────────┬──────────┘
           │ HTTP
           ├─────────────────────┐
           │                     │
      ┌────▼────┐          ┌────▼────┐
      │  Agent   │          │  Agent   │
      │ Service  │          │ Service  │
      │ (Flask)  │          │ (Flask)  │
      │ :5000    │          │ :5001    │
      └──────────┘          └──────────┘
         SQLite                SQLite
         + Exec                + Exec
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Bash (Linux/macOS) or PowerShell (Windows)
- Port 5000 and 8000 available

### Start the System

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```batch
start.bat
```

This will:
1. Build Docker images
2. Start Agent Service (port 5000)
3. Start Command Center (port 8000)
4. Perform health checks

### Access the Dashboard

Open your browser to: **http://localhost:8000**

## 📖 Usage Guide

### 1. Register an Agent

1. Open Command Center dashboard
2. Click **"Register Agent"**
3. Enter agent URL: `http://agent:5000`
4. Agent appears in the agents list

### 2. Send a Task

1. Select an agent from the left panel
2. Fill in task details:
   - **Command:** The executable (e.g., `echo`, `curl`, `ls`)
   - **Arguments:** Space-separated args (optional)
   - **Task Name:** Descriptive name (optional)
3. Click **"Send Task"**
4. Task status updates in real-time

### 3. View Results

Results appear in the Task History panel:
- Status badge (pending, running, completed, failed)
- Command output (first 500 chars)
- Execution timestamps

## 🔧 API Reference

### Agent Service API (port 5000)

#### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Submit Task
```bash
POST /task
Content-Type: application/json

{
  "id": "task-1234567890-abc",
  "name": "Echo Test",
  "command": "echo",
  "args": ["hello", "world"],
  "callback_url": "http://command-center:8000/api/task-result"
}
```

Response (202 Accepted):
```json
{
  "id": "task-1234567890-abc",
  "status": "pending",
  "message": "Task queued for execution"
}
```

#### Get All Tasks
```bash
GET /tasks
```

Response:
```json
{
  "tasks": [
    {
      "id": "task-1234567890-abc",
      "name": "Echo Test",
      "command": "echo",
      "args": ["hello", "world"],
      "status": "completed",
      "result": {
        "stdout": "hello world\n",
        "stderr": "",
        "returncode": 0
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "completed_at": "2024-01-15T10:30:01.000Z"
    }
  ]
}
```

#### Get Specific Task
```bash
GET /task/<task-id>
```

### Command Center API (port 8000)

#### Register Agent
```bash
POST /api/agents
Content-Type: application/json

{
  "id": "agent-123",
  "name": "My Agent",
  "url": "http://agent:5000"
}
```

#### List Agents
```bash
GET /api/agents
```

Response:
```json
{
  "agents": [
    {
      "id": "agent-123",
      "name": "My Agent",
      "url": "http://agent:5000",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "tasksCompleted": 5
    }
  ]
}
```

#### Send Task to Agent
```bash
POST /api/tasks
Content-Type: application/json

{
  "agentId": "agent-123",
  "name": "My Task",
  "command": "echo",
  "args": ["hello", "world"]
}
```

Response (202 Accepted):
```json
{
  "task": {
    "id": "task-1234567890-abc",
    "agentId": "agent-123",
    "agentName": "My Agent",
    "name": "My Task",
    "command": "echo",
    "args": ["hello", "world"],
    "status": "pending",
    "result": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null
  },
  "message": "Task sent to agent"
}
```

#### List Tasks
```bash
GET /api/tasks
```

## 🧪 Testing

### Automated End-to-End Test

**Linux/macOS:**
```bash
chmod +x test-e2e.sh
./test-e2e.sh
```

**Windows:**
```batch
test-e2e.bat
```

### Manual Testing

#### Test 1: Agent Health Check
```bash
curl http://localhost:5000/health
```

#### Test 2: Send a Simple Task
```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "test-1",
    "name": "Hello World",
    "command": "echo",
    "args": ["Hello", "World"]
  }'
```

#### Test 3: Check Task Status
```bash
curl http://localhost:5000/tasks
```

#### Test 4: Via Command Center UI
1. Open http://localhost:8000
2. Register agent: `http://agent:5000`
3. Send test task with command: `echo` and args: `test message`
4. Watch task complete in history panel

## 📦 Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agent
docker-compose logs -f command-center
```

### Stop Services
```bash
docker-compose down
```

### Rebuild Images
```bash
docker-compose build --no-cache
```

### Scale Agents (Advanced)
```bash
docker-compose up -d --scale agent=3
```

Note: This requires port mapping adjustments.

## 🏗️ Project Structure

```
agent-system/
├── agent-service/
│   ├── app.py              # Flask agent service
│   └── Dockerfile
├── command-center/
│   ├── pages/
│   │   ├── index.js        # Dashboard UI
│   │   ├── _app.js
│   │   └── api/
│   │       ├── agents.js   # Agent registry API
│   │       ├── tasks.js    # Task management API
│   │       └── task-result.js # Callback handler
│   ├── styles/
│   │   └── globals.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── next.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker Compose configuration
├── start.sh               # Startup script (Linux/macOS)
├── start.bat              # Startup script (Windows)
├── test-e2e.sh            # E2E test script (Linux/macOS)
├── test-e2e.bat           # E2E test script (Windows)
└── README.md              # This file
```

## 🔐 Security Considerations

### Current MVP Limitations
- No authentication/authorization
- No input validation/sanitization
- No rate limiting
- Commands execute with container privileges

### For Production:
1. Add JWT authentication
2. Implement command whitelisting
3. Add request rate limiting
4. Use least-privilege container users
5. Add TLS/SSL for all communications
6. Implement audit logging
7. Validate and sanitize all inputs
8. Use secrets management for sensitive data

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check port availability
lsof -i :5000
lsof -i :8000

# View detailed logs
docker-compose logs
```

### Agent not registering
- Ensure agent URL is correct: `http://agent:5000` (container-to-container)
- Check agent service is healthy: `curl http://localhost:5000/health`
- Verify Docker network: `docker network ls`

### Task not executing
1. Check agent logs: `docker-compose logs agent`
2. Verify command exists in container
3. Check task submission response for errors
4. Review Agent Service SQLite DB

### UI not loading
- Verify port 8000 is accessible
- Check browser console for errors
- Verify Command Center logs: `docker-compose logs command-center`

## 📝 API Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 202 | Task accepted | Normal - task is queued |
| 400 | Bad request | Check JSON payload format |
| 404 | Not found | Agent/task ID doesn't exist |
| 405 | Method not allowed | Use GET/POST correctly |
| 500 | Server error | Check logs for details |

## 🎯 Example Workflows

### Workflow 1: System Information
```bash
# Terminal 1: Start services
./start.sh

# Terminal 2: Send task via API
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "sysinfo-1",
    "command": "uname",
    "args": ["-a"]
  }'

# Check result
curl http://localhost:5000/task/sysinfo-1
```

### Workflow 2: Parallel Execution
Register multiple agents and send different tasks to each for parallel execution.

### Workflow 3: Callback Integration
Send task with `callback_url` to receive HTTP notification when complete.

## 🚀 Performance Notes

- **Task Timeout:** 30 seconds (configurable in agent-service/app.py)
- **Database:** SQLite (suitable for MVP; consider PostgreSQL for scale)
- **Polling Interval:** 3 seconds (Command Center UI)
- **Max Task History:** 50 tasks (configurable)

## 📚 Further Development

### High Priority
- [ ] Persistent task storage (PostgreSQL)
- [ ] Real-time WebSocket updates
- [ ] Task scheduling/cron support
- [ ] Multi-agent deployment

### Medium Priority
- [ ] Authentication & RBAC
- [ ] Advanced filtering/search
- [ ] Log aggregation
- [ ] Metrics & monitoring

### Low Priority
- [ ] Mobile app
- [ ] CLI tool
- [ ] Kubernetes deployment
- [ ] Terraform/IaC

## 📄 License

This project is provided as-is for educational and testing purposes.

---

**Last Updated:** January 2024  
**Tested On:** Docker 24.x, Node 18+, Python 3.11+
