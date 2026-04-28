# Laverdi Portal - Test Agent & Command Center Deployment

This guide provides the exact Docker commands to deploy the **Test Agent** and **OpenClaw Command Center** on the Laverdi Portal VPS (64.23.142.154).

## Architecture

```
┌─────────────────────────────────────────┐
│  Laverdi Portal VPS (64.23.142.154)     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ laverdi-net (Docker Network)     │  │
│  │                                  │  │
│  │ ┌──────────────┐  ┌───────────┐ │  │
│  │ │laverdi-portal│  │laverdi-   │ │  │
│  │ │(Next.js)     │  │nginx      │ │  │
│  │ │:3000         │  │:80/:443   │ │  │
│  │ └──────────────┘  └───────────┘ │  │
│  │                                  │  │
│  │ ┌──────────────┐  ┌───────────┐ │  │
│  │ │command-center│  │test-agent │ │  │
│  │ │(Flask):5000  │  │(Flask):5001 │  │
│  │ └──────────────┘  └───────────┘ │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Prerequisites

- Docker and Docker Compose installed on VPS
- VPS has existing `laverdi-net` network
- Port 5000 (command center) and 5001 (test agent) are available
- SSH access to VPS

## Build Images

Before running containers, build the Docker images:

```bash
# SSH into VPS
ssh root@64.23.142.154

# Clone or copy the deployment directory
cd /opt/laverdi-deploy

# Build test-agent image
docker build -t laverdi/test-agent:latest ./test-agent

# Build command-center image
docker build -t laverdi/command-center:latest ./command-center
```

## Deploy Test Agent

```bash
docker run -d \
  --name test-agent-1 \
  --network laverdi-net \
  --restart unless-stopped \
  -e AGENT_ID=test-agent-1 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_HOST=test-agent-1 \
  -e AGENT_PORT=5001 \
  -p 5001:5001 \
  laverdi/test-agent:latest
```

### Environment Variables
- `AGENT_ID`: Unique identifier for this agent (default: auto-generated)
- `COMMAND_CENTER_URL`: URL to reach the command center (use Docker network name)
- `AGENT_HOST`: Hostname for agent (for Docker network communication)
- `AGENT_PORT`: Port agent listens on (default: 5001)

### Multiple Agents

Deploy additional agents with different ports:

```bash
# Agent 2
docker run -d \
  --name test-agent-2 \
  --network laverdi-net \
  --restart unless-stopped \
  -e AGENT_ID=test-agent-2 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_PORT=5002 \
  -p 5002:5002 \
  laverdi/test-agent:latest

# Agent 3
docker run -d \
  --name test-agent-3 \
  --network laverdi-net \
  --restart unless-stopped \
  -e AGENT_ID=test-agent-3 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_PORT=5003 \
  -p 5003:5003 \
  laverdi/test-agent:latest
```

## Deploy Command Center

```bash
docker run -d \
  --name command-center \
  --network laverdi-net \
  --restart unless-stopped \
  -e COMMAND_CENTER_URL=http://localhost:5000 \
  -e COMMAND_CENTER_PORT=5000 \
  -p 5000:5000 \
  laverdi/command-center:latest
```

### Environment Variables
- `COMMAND_CENTER_URL`: Base URL for this command center (for callbacks/webhooks)
- `COMMAND_CENTER_PORT`: Port to listen on (default: 5000)

## Access the Dashboard

Once deployed, access the command center at:

```
http://64.23.142.154:5000
```

The dashboard will show:
- **Agents Panel**: List of connected agents and their status
- **Task Creation**: Form to send tasks to agents
- **Task History**: Real-time task status and results

## Agent Registration

Agents are automatically discovered when they send their first task report. To manually register:

```bash
curl -X POST http://64.23.142.154:5000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "agent_url": "http://test-agent-1:5001"
  }'
```

## Testing - Simple Task Flow

### 1. Check Agent Health

```bash
curl http://test-agent-1:5001/health
```

Response:
```json
{
  "status": "healthy",
  "agent_id": "test-agent-1",
  "timestamp": "2024-04-18T20:42:00.123456"
}
```

### 2. Send Echo Task

```bash
curl -X POST http://test-agent-1:5001/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-echo-001",
    "type": "echo",
    "params": {
      "message": "Hello from test!"
    }
  }'
```

Response:
```json
{
  "task_id": "task-echo-001",
  "status": "accepted",
  "agent_id": "test-agent-1"
}
```

### 3. Check Task Status

```bash
curl http://test-agent-1:5001/tasks/task-echo-001
```

Response:
```json
{
  "task_id": "task-echo-001",
  "type": "echo",
  "status": "completed",
  "result": {
    "message": "Hello from test!"
  },
  "error": null,
  "completed_at": "2024-04-18T20:42:05.123456"
}
```

## Supported Task Types

### echo
Echoes back a message.
```json
{
  "type": "echo",
  "params": {
    "message": "your message here"
  }
}
```

### system_info
Returns agent system info.
```json
{
  "type": "system_info",
  "params": {}
}
```

### web_request
Performs a GET request to a URL.
```json
{
  "type": "web_request",
  "params": {
    "url": "https://example.com"
  }
}
```

### read_file
Reads a file from the agent container.
```json
{
  "type": "read_file",
  "params": {
    "path": "/etc/hostname"
  }
}
```

## API Endpoints

### Command Center

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/api/health` | Health check |
| GET | `/api/agents` | List all agents |
| POST | `/api/agents/register` | Register an agent |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks/create` | Create and send a task |
| GET | `/api/tasks/<task_id>` | Get task status |
| POST | `/api/task-report` | Receive task completion report |
| GET | `/api/agents/<agent_id>/health` | Check specific agent health |

### Test Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/task` | Receive and queue a task |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/<task_id>` | Get task status |
| GET | `/info` | Get agent info |

## Monitoring & Logs

### View container logs

```bash
# Command center logs
docker logs -f command-center

# Test agent logs
docker logs -f test-agent-1

# All containers
docker logs -f test-agent-2 test-agent-3
```

### Check running containers

```bash
docker ps -a | grep -E "(command-center|test-agent)"
```

### Check network connectivity

```bash
# From command center, ping test agent
docker exec command-center curl http://test-agent-1:5001/health

# From test agent, ping command center
docker exec test-agent-1 curl http://command-center:5000/api/health
```

## Troubleshooting

### Agent not appearing in dashboard

1. Ensure agent is running: `docker ps | grep test-agent`
2. Check logs: `docker logs test-agent-1`
3. Verify network: `docker network inspect laverdi-net`
4. Test connectivity: `docker exec test-agent-1 curl http://command-center:5000/api/health`

### Tasks not completing

1. Check agent health: `curl http://agent-url:5001/health`
2. Check agent logs: `docker logs test-agent-1`
3. Verify network connectivity between containers
4. Check if command center is reachable from agent

### Port conflicts

If port 5000 or 5001 is already in use:

```bash
# Find what's using the port
lsof -i :5000

# Use different port mapping
docker run ... -p 5010:5000 laverdi/command-center:latest
```

## Cleanup

```bash
# Stop all containers
docker stop command-center test-agent-1 test-agent-2 test-agent-3

# Remove containers
docker rm command-center test-agent-1 test-agent-2 test-agent-3

# Remove images
docker rmi laverdi/test-agent:latest laverdi/command-center:latest
```

## Production Recommendations

1. **Use Docker Compose** for easier multi-container management
2. **Add logging driver** (e.g., awslogs, splunk) for centralized logs
3. **Set resource limits** (`--memory`, `--cpus`) on containers
4. **Use secrets** for sensitive environment variables
5. **Add health checks** in Dockerfile with `HEALTHCHECK`
6. **Set up monitoring** with Prometheus/Grafana or similar
7. **Enable container restart policies** (already done with `--restart unless-stopped`)
8. **Use nginx reverse proxy** (laverdi-nginx) to expose dashboard securely

## Next Steps

1. Deploy containers on VPS
2. Register agents via API or through dashboard
3. Send test tasks through the dashboard
4. Monitor task execution and logs
5. Integrate with your workflow (CI/CD, automation, etc.)
6. Scale with additional agents as needed
