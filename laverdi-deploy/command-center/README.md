# OpenClaw Command Center - Agent Management Dashboard

A lightweight Flask-based command center that manages agents, dispatches tasks, and monitors execution in real-time.

## Features

- 🎛️ Web dashboard for agent management
- 📤 Task creation and dispatch to multiple agents
- 📊 Real-time task status tracking
- 📋 Task history with results
- 🏥 Agent health monitoring
- ⚡ RESTful API for programmatic control
- 📱 Responsive design (works on mobile)
- 🔄 Auto-refresh every 5 seconds

## Architecture

```
Dashboard (HTML/JS)
    ↓
Flask REST API
    ↓
Agent Manager (In-Memory)
    ↓
Multiple Agents (HTTP)
```

## How It Works

1. **Agent Registration**: Agents register by sending task reports
2. **Task Creation**: User creates task via dashboard or API
3. **Task Dispatch**: Command center sends task to agent via HTTP
4. **Async Execution**: Agent executes task in background
5. **Result Report**: Agent POSTs result back to command center
6. **Status Update**: Dashboard reflects task completion
7. **History**: Tasks stored and searchable in dashboard

## Running

### Docker

```bash
docker run -d \
  --name command-center \
  --network laverdi-net \
  -p 5000:5000 \
  laverdi/command-center:latest
```

### Local (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Run Flask dev server
python app.py

# Access at http://localhost:5000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COMMAND_CENTER_URL` | http://localhost:5000 | Base URL for callbacks |
| `COMMAND_CENTER_PORT` | 5000 | Port to listen on |

## Web Dashboard

Access at: `http://<ip>:5000`

### Features

- **Stats Panel**: Shows agent count, total tasks, completed, failed
- **Agents Panel**: Live list of connected agents
- **Task Creation**: Form to send tasks to agents
- **Task History**: Real-time view of all tasks and results
- **Auto-refresh**: Updates every 5 seconds

### Creating a Task

1. Select an agent from "Select Agent" dropdown
2. Choose a task type from "Task Type"
3. Edit parameters (JSON format)
4. Click "Send Task"
5. Monitor in Task History section

### Example Parameters

**Echo Task:**
```json
{
  "message": "Hello Agent!"
}
```

**Web Request Task:**
```json
{
  "url": "https://api.github.com"
}
```

**File Read Task:**
```json
{
  "path": "/etc/hostname"
}
```

## REST API

### Dashboard

```
GET /
```

Serves the web dashboard.

### Health Check

```bash
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-04-18T20:42:00.123456",
  "agents_count": 2,
  "tasks_count": 15
}
```

### List Agents

```bash
GET /api/agents

Response:
{
  "agents": [
    {
      "agent_id": "test-agent-1",
      "agent_url": "http://test-agent-1:5001",
      "status": "online",
      "registered_at": "2024-04-18T20:40:00.123456",
      "last_heartbeat": "2024-04-18T20:42:00.123456",
      "tasks_count": 5
    }
  ],
  "count": 2,
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

### Register Agent (Manual)

```bash
POST /api/agents/register
Content-Type: application/json

Body:
{
  "agent_id": "test-agent-1",
  "agent_url": "http://test-agent-1:5001"
}

Response:
{
  "status": "registered",
  "agent_id": "test-agent-1"
}
```

*Note: Agents auto-register when they report their first task.*

### Create and Send Task

```bash
POST /api/tasks/create
Content-Type: application/json

Body:
{
  "agent_id": "test-agent-1",
  "type": "echo",
  "params": {
    "message": "hello"
  }
}

Response (202 Accepted):
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "test-agent-1",
  "status": "sent"
}
```

### List All Tasks

```bash
GET /api/tasks

Response:
{
  "tasks": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_id": "test-agent-1",
      "type": "echo",
      "params": {
        "message": "hello"
      },
      "status": "completed",
      "created_at": "2024-04-18T20:42:00.123456",
      "result": {
        "message": "hello"
      },
      "error": null
    }
  ],
  "count": 15,
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

### Get Task Status

```bash
GET /api/tasks/<task_id>

Response:
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "test-agent-1",
  "type": "echo",
  "params": { "message": "hello" },
  "status": "completed",
  "created_at": "2024-04-18T20:42:00.123456",
  "result": { "message": "hello" },
  "error": null,
  "completed_at": "2024-04-18T20:42:05.123456"
}
```

### Receive Task Report (from Agent)

```bash
POST /api/task-report
Content-Type: application/json

Body (sent by agent):
{
  "agent_id": "test-agent-1",
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": { "message": "hello" },
  "error": null,
  "timestamp": "2024-04-18T20:42:05.123456"
}

Response:
{
  "status": "acknowledged"
}
```

### Check Agent Health

```bash
GET /api/agents/<agent_id>/health

Response:
{
  "status": "healthy",
  "agent_id": "test-agent-1",
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

## Data Flow

```
┌─────────────────────────────────────────────┐
│          Web Dashboard (HTML/JS)            │
│  - Agent list                               │
│  - Task creation form                       │
│  - Task history                             │
└─────────────┬───────────────────────────────┘
              │ HTTP (AJAX)
              ↓
┌─────────────────────────────────────────────┐
│        Flask REST API (Port 5000)           │
│  - GET /api/agents                          │
│  - POST /api/tasks/create                   │
│  - GET /api/tasks                           │
│  - POST /api/task-report                    │
└─────────────┬───────────────────────────────┘
              │ HTTP
              ↓
┌──────────────────────────────────────────────┐
│  Agent Manager (In-Memory Storage)           │
│  - agents: { agent_id: {...} }              │
│  - tasks: { task_id: {...} }                │
└──────────────┬───────────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        ↓             ↓          ↓
    ┌──────┐      ┌──────┐  ┌──────┐
    │Agent1│      │Agent2│  │Agent3│
    └──────┘      └──────┘  └──────┘
    :5001         :5002     :5003
```

## Task Lifecycle States

```
pending      → Initial state, queued for dispatch
sent         → Task sent to agent, awaiting processing
processing   → Agent is executing the task
completed    → Task finished successfully
failed       → Task execution failed
```

## Logs

### View Logs

```bash
# Docker
docker logs -f command-center

# Local
# Appears on stdout/stderr
```

### Log Entries

```
INFO:root:Agent registered: test-agent-1 at http://test-agent-1:5001
INFO:root:Task 550e8400-e29b-41d4-a716-446655440000 sent to agent test-agent-1
INFO:root:Task 550e8400-e29b-41d4-a716-446655440000 reported: completed
```

## Performance

- **API Response Time**: ~10-50ms
- **Dashboard Refresh**: 5 seconds (configurable)
- **Memory Usage**: ~100-200MB
- **Max Concurrent Tasks**: 100+ (depends on agents)
- **Max Agents**: 1000+ (in-memory)

## Scaling Considerations

### Single Command Center

Good for:
- <10 agents
- <1000 tasks/day
- Single VPS

Limitations:
- In-memory storage (lost on restart)
- No persistence
- Single point of failure

### Multiple Command Centers

For higher scale:

```
┌──────────────────────────┐
│    Load Balancer         │
│    (nginx/HAProxy)       │
└──────────────┬───────────┘
       │
    ┌──┴──┬──────┐
    ↓     ↓      ↓
  CC1   CC2    CC3
  :5000 :5001  :5002
```

Each command center has:
- Independent agent list
- Independent task storage
- No synchronization

## Production Hardening

Add these for production:

1. **Persistence**
   ```python
   # Use SQLite or PostgreSQL
   from sqlalchemy import create_engine
   ```

2. **Authentication**
   ```python
   @app.before_request
   def check_auth():
       token = request.headers.get('Authorization')
       # Validate token
   ```

3. **Rate Limiting**
   ```python
   from flask_limiter import Limiter
   limiter = Limiter(app)
   
   @app.route('/api/tasks/create')
   @limiter.limit("100 per hour")
   def create_task(): ...
   ```

4. **Logging**
   ```python
   import logging
   logging.basicConfig(
       level=logging.INFO,
       handlers=[
           logging.FileHandler('command-center.log'),
           logging.StreamHandler()
       ]
   )
   ```

5. **Monitoring**
   ```python
   from prometheus_client import Counter, Histogram
   task_count = Counter('tasks_total', 'Total tasks')
   task_duration = Histogram('task_duration_seconds', 'Task duration')
   ```

6. **HTTPS**
   ```bash
   # Use nginx reverse proxy with TLS
   ```

## Extending the Dashboard

### Adding New Task Type

1. Update task type dropdown in `templates/dashboard.html`:
   ```html
   <option value="my_type">My Custom Task</option>
   ```

2. Update param templates in JavaScript:
   ```javascript
   const paramTemplates = {
       'my_type': { custom_param: 'value' }
   };
   ```

3. Implement handler in agent's `app.py`

### Custom Styling

Edit `templates/dashboard.html`:

```html
<style>
  .my-custom-class {
    color: #667eea;
    font-weight: bold;
  }
</style>
```

## API Integration Examples

### cURL

```bash
# Create task
curl -X POST http://localhost:5000/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "type": "web_request",
    "params": {"url": "https://example.com"}
  }'

# Get all tasks
curl http://localhost:5000/api/tasks
```

### Python

```python
import requests

# Create task
response = requests.post(
    'http://localhost:5000/api/tasks/create',
    json={
        'agent_id': 'test-agent-1',
        'type': 'echo',
        'params': {'message': 'hello'}
    }
)
task_id = response.json()['task_id']

# Check status
response = requests.get(f'http://localhost:5000/api/tasks/{task_id}')
print(response.json())
```

### JavaScript

```javascript
// Create task
const response = await fetch('http://localhost:5000/api/tasks/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: 'test-agent-1',
    type: 'echo',
    params: { message: 'hello' }
  })
});

const task = await response.json();
console.log('Task created:', task.task_id);
```

## Troubleshooting

### Dashboard not loading

```bash
# Check if Flask is running
curl http://localhost:5000/api/health

# Check Flask logs
docker logs command-center

# Verify port
netstat -tulpn | grep 5000
```

### No agents showing

1. Make sure agents are running
2. Send a task from an agent to trigger registration
3. Check agent is connected to same Docker network
4. Verify agent URL is correct:
   - Docker network: `http://container-name:5001`
   - Local: `http://localhost:5001`

### Tasks not sending

1. Verify agent URL is correct
2. Check agent health: `curl http://agent:5001/health`
3. Check network connectivity
4. Review command center logs

### Performance Issues

1. Check memory usage: `docker stats command-center`
2. Check agent count: `curl http://localhost:5000/api/agents | jq '.count'`
3. Clear old tasks (restart to reset in-memory storage)
4. Move to database-backed storage for production

## Related Documentation

- Parent: **../README.md** - Full system overview
- Deployment: **../DEPLOYMENT.md** - Production setup
- Agent: **../test-agent/README.md** - Agent documentation
- Tests: **../test-api.sh** - API test suite

---

**Quick Start:**

```bash
docker build -t laverdi/command-center:latest .
docker run -d --network laverdi-net -p 5000:5000 laverdi/command-center:latest
open http://localhost:5000
```
