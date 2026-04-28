# Laverdi Portal - Test Agent & Command Center

A lightweight, production-ready autonomous agent system with a command center dashboard for the Laverdi Portal VPS.

## 🎯 What This Does

**Test Agent**: A simple autonomous container that:
- ✅ Listens for HTTP webhook tasks
- ✅ Executes operations (file read, web requests, system info, echo)
- ✅ Reports status back to command center
- ✅ Stores task history
- ✅ Auto-connects to command center

**Command Center**: A Flask + HTML dashboard that:
- 📊 Lists and monitors all agents
- ➕ Creates and sends tasks to agents
- 📋 Tracks task history and results
- 📡 Receives task completion reports
- 🔄 Auto-refreshes status

## 🏗️ Architecture

```
VPS (64.23.142.154)
├── Docker Network (laverdi-net)
│   ├── command-center:5000
│   │   └── Web Dashboard + API
│   ├── laverdi-portal:3000
│   ├── laverdi-nginx:80/443
│   └── test-agent-{1,2,3}:500{1,2,3}
│       └── Task execution + reporting
```

## 📦 Components

### `/test-agent`
- **Dockerfile** - Python 3.11 Flask container
- **app.py** - Agent with task execution engine
- **requirements.txt** - Dependencies

### `/command-center`
- **Dockerfile** - Python 3.11 Flask container
- **app.py** - API + agent management
- **templates/dashboard.html** - React-like dashboard
- **requirements.txt** - Dependencies

### Root Files
- **DEPLOYMENT.md** - Detailed deployment guide
- **docker-compose.yml** - Multi-container orchestration
- **quick-start.sh** - One-command setup script
- **test-api.sh** - Automated API testing

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# 1. SSH into VPS
ssh root@64.23.142.154

# 2. Clone this repo (or copy files)
cd /opt && git clone <repo-url> laverdi-deploy
cd laverdi-deploy

# 3. Deploy with docker-compose
docker-compose up -d

# 4. Access dashboard
# http://64.23.142.154:5000
```

### Option 2: Using Quick Start Script

```bash
# Full deployment (build + deploy)
./quick-start.sh full

# Or step by step
./quick-start.sh build
./quick-start.sh deploy
./quick-start.sh test
```

### Option 3: Manual Docker Commands

See **DEPLOYMENT.md** for exact `docker run` commands.

## 📊 Dashboard Access

Once deployed:

```
http://64.23.142.154:5000
```

Features:
- **Agents Panel**: Real-time agent status
- **Create Task Form**: Send tasks with parameters
- **Task History**: View all task results
- **Auto-refresh**: Updates every 5 seconds

## 🔌 API Endpoints

### Command Center (Port 5000)

```bash
# Dashboard
GET /

# Health check
GET /api/health

# Agents
GET /api/agents
POST /api/agents/register

# Tasks
GET /api/tasks
POST /api/tasks/create
GET /api/tasks/<task_id>

# Task Reports (from agents)
POST /api/task-report

# Agent Health
GET /api/agents/<agent_id>/health
```

### Test Agent (Port 5001)

```bash
# Health check
GET /health

# Submit task
POST /task

# Task history
GET /tasks
GET /tasks/<task_id>

# Agent info
GET /info
```

## 📝 Example Usage

### 1. Register Agent

```bash
curl -X POST http://localhost:5000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "agent_url": "http://test-agent-1:5001"
  }'
```

### 2. Send Task (Echo)

```bash
curl -X POST http://localhost:5001/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task-001",
    "type": "echo",
    "params": {
      "message": "Hello Agent!"
    }
  }'
```

### 3. Check Task Status

```bash
curl http://localhost:5001/tasks/task-001
```

### 4. Create Task via Command Center

```bash
curl -X POST http://localhost:5000/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "test-agent-1",
    "type": "web_request",
    "params": {
      "url": "https://api.github.com"
    }
  }'
```

## 🧪 Testing

### Automated Test Suite

```bash
# Test all endpoints
./test-api.sh

# With custom URLs
./test-api.sh http://custom-cc:5000 http://custom-agent:5001
```

### Manual Testing

```bash
# Check all containers are running
docker ps | grep -E "(command-center|test-agent)"

# View logs
docker logs -f command-center
docker logs -f test-agent-1

# Test network connectivity
docker exec test-agent-1 curl http://command-center:5000/api/health

# Execute command in container
docker exec test-agent-1 curl http://localhost:5001/health
```

## 📋 Supported Task Types

### `echo`
Echo back a message.
```json
{
  "type": "echo",
  "params": { "message": "your message" }
}
```

### `system_info`
Get agent system information.
```json
{
  "type": "system_info",
  "params": {}
}
```

### `web_request`
Make a GET request to a URL.
```json
{
  "type": "web_request",
  "params": { "url": "https://example.com" }
}
```

### `read_file`
Read a file from the agent container.
```json
{
  "type": "read_file",
  "params": { "path": "/etc/hostname" }
}
```

## 🔄 Task Lifecycle

```
1. Task Created
   └─> Sent to Agent via HTTP POST
       └─> Agent Receives & Queues
           └─> Agent Executes (async)
               └─> Task Completes
                   └─> Agent Reports Result
                       └─> Command Center Updates Status
                           └─> Dashboard Shows Result
```

## 🎛️ Configuration

### Environment Variables

**Test Agent:**
- `AGENT_ID` - Unique identifier (auto-generated if not set)
- `COMMAND_CENTER_URL` - Where to report task results
- `AGENT_HOST` - Hostname for Docker network
- `AGENT_PORT` - Port to listen on

**Command Center:**
- `COMMAND_CENTER_URL` - Base URL for callbacks
- `COMMAND_CENTER_PORT` - Port to listen on

Example (docker-compose):
```yaml
environment:
  AGENT_ID: test-agent-1
  COMMAND_CENTER_URL: http://command-center:5000
  AGENT_HOST: test-agent-1
  AGENT_PORT: 5001
```

## 🔐 Security Notes

⚠️ **This is a development/testing setup. For production:**

1. **Add authentication** (JWT, API keys)
2. **Use HTTPS** with proper certificates
3. **Add input validation** for all endpoints
4. **Implement rate limiting** to prevent abuse
5. **Use secrets management** (e.g., Docker secrets, HashiCorp Vault)
6. **Add audit logging** for all operations
7. **Restrict network access** (firewall rules)
8. **Add resource limits** (`--memory`, `--cpus`)
9. **Use reverse proxy** (nginx) with TLS
10. **Scan images** for vulnerabilities

## 📈 Monitoring & Logs

### View Logs

```bash
# All containers
docker-compose logs -f

# Specific service
docker logs -f command-center
docker logs -f test-agent-1
```

### Container Stats

```bash
# Real-time stats
docker stats --no-stream

# CPU and memory
docker ps --format "table {{.Names}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Manual health check
curl http://localhost:5000/api/health
curl http://localhost:5001/health
```

## 🚨 Troubleshooting

### Agent not connecting to command center

```bash
# 1. Verify container is running
docker ps | grep test-agent-1

# 2. Check logs
docker logs test-agent-1

# 3. Verify network
docker network inspect laverdi-net

# 4. Test connectivity from agent
docker exec test-agent-1 curl http://command-center:5000/api/health

# 5. Verify URL is correct in agent environment
docker inspect test-agent-1 | grep COMMAND_CENTER_URL
```

### Tasks not executing

```bash
# 1. Check agent health
curl http://localhost:5001/health

# 2. View agent logs
docker logs -f test-agent-1

# 3. Check task was received
curl http://localhost:5001/tasks

# 4. Verify task format
# (see supported task types above)
```

### Dashboard not loading

```bash
# 1. Check command center health
curl http://localhost:5000/api/health

# 2. View command center logs
docker logs -f command-center

# 3. Check port is open
netstat -tulpn | grep 5000

# 4. Try direct API call
curl http://localhost:5000/api/agents
```

### Port already in use

```bash
# Find what's using port 5000
lsof -i :5000

# Use different port mapping
docker run -p 5010:5000 laverdi/command-center:latest
```

## 📚 File Structure

```
laverdi-deploy/
├── README.md                          # This file
├── DEPLOYMENT.md                      # Detailed deployment guide
├── docker-compose.yml                 # Multi-container orchestration
├── quick-start.sh                     # One-command setup
├── test-api.sh                        # API test suite
│
├── test-agent/
│   ├── Dockerfile                     # Build configuration
│   ├── app.py                         # Agent application
│   ├── requirements.txt               # Python dependencies
│   └── README.md                      # Agent documentation
│
└── command-center/
    ├── Dockerfile                     # Build configuration
    ├── app.py                         # Command center API
    ├── requirements.txt               # Python dependencies
    ├── templates/
    │   └── dashboard.html             # Web dashboard
    └── README.md                      # Command center documentation
```

## 🔄 Scaling

### Deploy Additional Agents

```bash
# Agent 2 (port 5002)
docker run -d \
  --name test-agent-2 \
  --network laverdi-net \
  -e AGENT_ID=test-agent-2 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_PORT=5002 \
  -p 5002:5002 \
  laverdi/test-agent:latest

# Agent 3 (port 5003)
docker run -d \
  --name test-agent-3 \
  --network laverdi-net \
  -e AGENT_ID=test-agent-3 \
  -e COMMAND_CENTER_URL=http://command-center:5000 \
  -e AGENT_PORT=5003 \
  -p 5003:5003 \
  laverdi/test-agent:latest
```

Agents automatically register and appear in the dashboard.

## 🧹 Cleanup

```bash
# Stop all containers
docker-compose down

# Or manually
docker stop command-center test-agent-1 test-agent-2 test-agent-3

# Remove containers
docker rm command-center test-agent-1 test-agent-2 test-agent-3

# Remove images
docker rmi laverdi/command-center:latest laverdi/test-agent:latest
```

## 📖 Documentation

- **DEPLOYMENT.md** - Complete deployment and configuration guide
- **test-api.sh** - Interactive API test suite with examples
- **docker-compose.yml** - Orchestration with health checks

## 🤝 Integration Examples

### With GitHub Actions

```yaml
- name: Send Task to Agent
  run: |
    curl -X POST http://agent:5001/task \
      -H "Content-Type: application/json" \
      -d '{
        "type": "echo",
        "params": {"message": "Deploy complete!"}
      }'
```

### With Webhooks

```python
@app.route('/webhook/deploy', methods=['POST'])
def handle_deploy():
    # Trigger agent task
    requests.post('http://agent:5001/task', json={
        'type': 'web_request',
        'params': {'url': 'http://deploy-server/trigger'}
    })
    return {'status': 'ok'}
```

### With cron

```bash
# Send periodic health check
0 */6 * * * curl -X POST http://agent:5001/task \
  -d '{"type":"system_info","params":{}}'
```

## 📞 Support

For issues or questions:

1. Check **DEPLOYMENT.md** for detailed configuration
2. Review logs: `docker logs -f <container>`
3. Run test suite: `./test-api.sh`
4. Verify network: `docker network inspect laverdi-net`

## 📄 License

Provided as-is for use with Laverdi Portal infrastructure.

---

**Ready to deploy?** Start with:

```bash
docker-compose up -d
```

Access dashboard at: **http://64.23.142.154:5000** 🎉
