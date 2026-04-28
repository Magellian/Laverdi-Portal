# Test Agent - Autonomous Task Executor

A lightweight Flask-based agent that listens for HTTP tasks and executes them autonomously.

## Features

- 🎯 HTTP webhook endpoint for task submission
- ⚡ Async task execution (non-blocking)
- 📡 Auto-reporting of task results to command center
- 📊 Task history tracking
- 🏥 Health check endpoint
- 🔗 Automatic discovery by command center

## How It Works

```
1. Command Center sends HTTP POST to /task
2. Agent receives task, generates task_id
3. Agent queues task for async execution
4. Returns 202 Accepted immediately
5. Task executes in background thread
6. Agent captures result/error
7. Agent POSTs result back to Command Center
8. Command Center updates dashboard
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_ID` | auto-generated | Unique agent identifier |
| `COMMAND_CENTER_URL` | http://command-center:5000 | Where to report results |
| `AGENT_HOST` | test-agent | Hostname for Docker network |
| `AGENT_PORT` | 5001 | Port to listen on |

## Running the Agent

### Docker

```bash
docker run -d \
  --name test-agent-1 \
  --network laverdi-net \
  -e AGENT_ID=test-agent-1 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_PORT=5001 \
  -p 5001:5001 \
  laverdi/test-agent:latest
```

### Local (Development)

```bash
# Install dependencies
pip install -r requirements.txt

# Run directly
python app.py

# With custom config
AGENT_ID=my-agent AGENT_PORT=5001 python app.py
```

## API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "agent_id": "test-agent-1",
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

### Submit Task
```bash
POST /task
Content-Type: application/json

Body:
{
  "task_id": "unique-id",
  "type": "echo",
  "params": {
    "message": "hello"
  }
}

Response (202 Accepted):
{
  "task_id": "unique-id",
  "status": "accepted",
  "agent_id": "test-agent-1"
}
```

### Get Task Status
```bash
GET /tasks/<task_id>

Response:
{
  "task_id": "unique-id",
  "type": "echo",
  "status": "completed",
  "result": {
    "message": "hello"
  },
  "error": null,
  "completed_at": "2024-04-18T20:42:05.123456"
}
```

### List All Tasks
```bash
GET /tasks

Response:
{
  "agent_id": "test-agent-1",
  "tasks": [
    {
      "task_id": "...",
      "type": "echo",
      "status": "completed",
      ...
    }
  ],
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

### Get Agent Info
```bash
GET /info

Response:
{
  "agent_id": "test-agent-1",
  "agent_host": "test-agent",
  "agent_port": 5001,
  "command_center_url": "http://command-center:5000",
  "tasks_processed": 42,
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

## Task Types

### Echo
Echoes back a message (for testing).

```json
{
  "type": "echo",
  "params": {
    "message": "Hello World"
  }
}
```

Result:
```json
{
  "result": {
    "message": "Hello World"
  }
}
```

### System Info
Returns agent system information.

```json
{
  "type": "system_info",
  "params": {}
}
```

Result:
```json
{
  "result": {
    "agent_id": "test-agent-1",
    "agent_host": "test-agent",
    "agent_port": 5001
  }
}
```

### Web Request
Performs a GET request to a URL.

```json
{
  "type": "web_request",
  "params": {
    "url": "https://api.github.com/zen"
  }
}
```

Result:
```json
{
  "result": {
    "status_code": 200,
    "url": "https://api.github.com/zen",
    "length": 142
  }
}
```

### Read File
Reads a file from the agent's filesystem.

```json
{
  "type": "read_file",
  "params": {
    "path": "/etc/hostname"
  }
}
```

Result:
```json
{
  "result": {
    "content": "test-agent-1\n",
    "path": "/etc/hostname"
  }
}
```

## Task Lifecycle

```
PENDING
  ↓ (Task submitted)
PROCESSING (async execution)
  ↓ (Task completes or errors)
COMPLETED / FAILED
  ↓ (Result reported to command center)
REPORTED
```

## Adding New Task Types

1. Edit `app.py` in the `execute_task()` function
2. Add a new elif block for your task type
3. Implement the task logic
4. Update the result/error

Example:

```python
elif task_type == 'my_task':
    custom_param = params.get('custom_param')
    try:
        # Do something
        result = {"output": "success"}
    except Exception as e:
        error = str(e)
```

3. Restart the agent
4. Send task:

```json
{
  "type": "my_task",
  "params": {
    "custom_param": "value"
  }
}
```

## Logs

### View Agent Logs

```bash
# Docker
docker logs -f test-agent-1

# Local
# Logs appear on stdout
```

Log format:
```
INFO:__main__:[task-id] Task received: {...}
INFO:__main__:[task-id] Executing task type: echo
INFO:__main__:[task-id] Task result reported to command center
```

## Performance Characteristics

- **Task Submission**: ~10ms (returns immediately)
- **Task Execution**: Depends on task type (1s - 10s typically)
- **Result Reporting**: ~100ms
- **Memory Usage**: ~50-100MB baseline
- **CPU Usage**: Minimal, event-driven

## Troubleshooting

### Agent won't start

```bash
# Check if port is available
lsof -i :5001

# Check logs
docker logs test-agent-1

# Try different port
docker run -e AGENT_PORT=5010 -p 5010:5010 ...
```

### Agent not reporting to command center

```bash
# Verify command center URL is correct
docker inspect test-agent-1 | grep COMMAND_CENTER_URL

# Test connectivity from agent
docker exec test-agent-1 curl http://command-center:5000/api/health

# Check agent logs for errors
docker logs -f test-agent-1
```

### Task never completes

```bash
# Check task status
curl http://localhost:5001/tasks/<task_id>

# Check agent logs
docker logs test-agent-1

# Verify task type is supported
curl http://localhost:5001/info
```

### High memory usage

- Check if old tasks are accumulating: `GET /tasks`
- Consider clearing task history (restart agent)
- Monitor with: `docker stats test-agent-1`

## Development

### Local Testing

```bash
# Start agent
python app.py

# In another terminal, submit task
curl -X POST http://localhost:5001/task \
  -H "Content-Type: application/json" \
  -d '{"task_id":"test-1","type":"echo","params":{"message":"hello"}}'

# Check status
curl http://localhost:5001/tasks/test-1
```

### Building Custom Image

```bash
docker build -t my-agent:latest .

docker run -d \
  --name my-agent \
  -p 5001:5001 \
  my-agent:latest
```

## Performance Optimization

For production deployments:

1. **Increase timeout limits** if tasks take longer
2. **Add task queue** (Redis, RabbitMQ) for reliability
3. **Implement circuit breaker** for command center communication
4. **Add metrics/monitoring** (Prometheus)
5. **Use async framework** (FastAPI, asyncio)
6. **Add request validation** and sanitization
7. **Implement backoff** for command center reporting

## Security Considerations

⚠️ **Development only** - Add to production version:

1. Validate task type and parameters
2. Sandbox file operations (read-only directories)
3. Restrict web request endpoints (whitelist)
4. Add authentication to endpoints
5. Rate limit task submissions
6. Add request signing/verification
7. Encrypt sensitive data
8. Use HTTPS for communication

## Extending the Agent

### Custom Task Handler

Create a new file `tasks.py`:

```python
class TaskHandler:
    @staticmethod
    def handle_my_task(params):
        result = do_something(params)
        return result

# In app.py, call:
elif task_type == 'my_task':
    result = TaskHandler.handle_my_task(params)
```

### Database Persistence

Add SQLite for persistent task history:

```python
import sqlite3

def save_task(task):
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO tasks VALUES (...)')
    conn.commit()
```

### WebSocket Support

For real-time updates, add WebSocket endpoint:

```python
from flask_socketio import SocketIO, emit

socketio = SocketIO(app)

@socketio.on('subscribe_task')
def subscribe_task(task_id):
    # Stream task updates to client
    emit('task_update', task_data)
```

## Related Documentation

- Parent: **../README.md** - Full system overview
- Deployment: **../DEPLOYMENT.md** - Production setup
- Tests: **../test-api.sh** - API test suite

---

**Quick Start:**

```bash
docker build -t laverdi/test-agent:latest .
docker run -d --network laverdi-net -p 5001:5001 laverdi/test-agent:latest
curl http://localhost:5001/health
```
