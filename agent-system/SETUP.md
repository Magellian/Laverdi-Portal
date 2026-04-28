# Setup & Deployment Guide

## Prerequisites Checklist

- [ ] Docker installed (v20.10+)
- [ ] Docker Compose installed (v2.0+)
- [ ] Ports 5000 and 8000 are available
- [ ] Linux/macOS with bash OR Windows with PowerShell
- [ ] git (optional, for cloning)

### Verify Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10 or higher

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.0 or higher

# Test Docker
docker run hello-world
```

---

## Installation Steps

### 1. Clone or Download Project

```bash
# Option A: Clone from repository
git clone <your-repo-url> agent-system
cd agent-system

# Option B: Extract from zip
unzip agent-system.zip
cd agent-system
```

### 2. Verify Directory Structure

```
agent-system/
├── agent-service/
│   ├── app.py
│   └── Dockerfile
├── command-center/
│   ├── pages/
│   ├── styles/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── start.sh          (or start.bat on Windows)
├── test-e2e.sh
└── README.md
```

### 3. Set Permissions (Linux/macOS only)

```bash
chmod +x start.sh
chmod +x test-e2e.sh
```

### 4. Start Services

**Linux/macOS:**
```bash
./start.sh
```

**Windows (PowerShell):**
```powershell
.\start.bat
```

**Or manually with Docker Compose:**
```bash
docker-compose up -d
```

### 5. Verify Services Are Running

```bash
# Check containers
docker ps

# You should see:
# - agent (port 5000)
# - command-center (port 8000)

# Check health
curl http://localhost:5000/health
# Should return: {"status": "healthy", "timestamp": "..."}
```

---

## First Run Walkthrough

### Step 1: Open Dashboard (2 minutes)

1. Open browser to: **http://localhost:8000**
2. You should see the Command Center dashboard with:
   - Left panel: "📍 Agents" (empty)
   - Middle panel: "⚡ Send Task"
   - Right panel: "📋 Task History" (empty)

### Step 2: Register an Agent (1 minute)

1. Click the **"Register Agent"** button (blue button in left panel)
2. A popup will ask for the agent URL
3. Enter: `http://agent:5000`
4. Press Enter or click OK

Expected result:
- Agent appears in the agents list
- Shows: "Agent-xxxxx" with URL and green "● Online" status
- Agent is now selected (radio button checked)

### Step 3: Send Your First Task (2 minutes)

1. In the middle panel, verify:
   - **Command:** `echo` (default)
   - **Arguments:** `hello world` (default)
   - **Task Name:** Leave empty (optional)

2. Click **"Send Task"** button (green button)

3. You should see:
   - Success message: "Task sent successfully!"
   - New task appears in right panel: Task History
   - Status changes: pending → running → completed
   - Output shows: `hello world`

### Step 4: Try More Commands

Use the **"Quick Commands"** section in the task panel:

- **Echo Test:** Tests basic command execution
- **System Info:** Shows system details
- **Current Date:** Displays timestamp
- **Working Dir:** Shows current directory

Each command will execute on the agent and display results in Task History.

---

## Testing

### Automated End-to-End Test

Run the comprehensive E2E test:

**Linux/macOS:**
```bash
./test-e2e.sh
```

**Windows:**
```batch
test-e2e.bat
```

Expected output:
```
🧪 Running End-to-End Test...

📍 Step 1: Registering agent...
✅ Agent registered: test-agent-1

⚡ Step 2: Sending test task...
✅ Task sent: task-1234567890-abc

⏳ Step 3: Waiting for task execution...
✅ Task completed!

📋 Step 4: Verifying task result...
Task Result:
{
  "stdout": "hello world\n",
  "stderr": "",
  "returncode": 0
}

✅ Output verified!

✨ End-to-End Test PASSED!
```

### Manual API Testing

#### Test Agent Health
```bash
curl http://localhost:5000/health

# Expected:
# {"status":"healthy","timestamp":"2024-01-15T..."}
```

#### Test Task Submission
```bash
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "manual-test-1",
    "name": "Manual Test",
    "command": "echo",
    "args": ["test", "message"]
  }'

# Expected:
# {"id":"manual-test-1","status":"pending","message":"Task queued for execution"}
```

#### List All Tasks
```bash
curl http://localhost:5000/tasks

# Expected: JSON array of tasks with results
```

---

## Configuration

### Ports

If you need to use different ports:

**Edit docker-compose.yml:**
```yaml
services:
  agent:
    ports:
      - "5001:5000"  # Change 5001 to your desired port

  command-center:
    ports:
      - "8001:8000"  # Change 8001 to your desired port
```

Then update any references to these ports in scripts and URLs.

### Agent Service Settings

**Edit agent-service/app.py:**

```python
# Line 95: Timeout for task execution (in seconds)
timeout=30  # Change this value

# Line 110: Task history limit (in /tasks endpoint)
c.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50")
# Change 50 to your desired limit
```

### Command Center Settings

**Edit command-center/pages/index.js:**

```javascript
// Line 28: Polling interval (in milliseconds)
const interval = setInterval(() => {
  fetchAgents();
  fetchTasks();
}, 3000); // Change 3000 to your desired interval
```

---

## Troubleshooting

### Issue: "Docker is not running"

**Solution:**
```bash
# On Linux/macOS
sudo systemctl start docker

# On Windows
# - Open Docker Desktop from Start menu
# - Wait for it to fully start

# Verify
docker ps
```

### Issue: "Ports already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :5000    # Linux/macOS
netstat -ano | findstr :5000  # Windows

# Either kill the process or use different ports (see Configuration above)
```

### Issue: "Command Center shows 'No agents registered'"

**Solution:**

1. Verify agent URL is correct (should be `http://agent:5000` for Docker)
2. Check agent health:
   ```bash
   curl http://localhost:5000/health
   ```
3. Check network connectivity:
   ```bash
   docker network ls
   docker network inspect laverdi-net
   ```

### Issue: "Task not executing"

**Check logs:**
```bash
# View all logs
docker-compose logs

# View agent logs only
docker-compose logs agent

# View command center logs only
docker-compose logs command-center

# Follow logs in real-time
docker-compose logs -f agent
```

**Common causes:**
- Command doesn't exist in container (e.g., `python` might be `python3`)
- Command arguments are incorrect
- Agent not healthy (check health endpoint)
- Task timeout exceeded (30 seconds default)

### Issue: "Browser shows blank page"

**Solution:**
1. Check Command Center is running:
   ```bash
   curl http://localhost:8000
   ```
2. Check browser console for errors (F12)
3. Clear browser cache and reload
4. Check logs:
   ```bash
   docker-compose logs command-center
   ```

### Issue: "Connection refused on localhost:8000"

**Solution:**
```bash
# Check if Command Center is running
docker ps | grep command-center

# If not running, check why:
docker-compose logs command-center

# Restart:
docker-compose restart command-center
```

---

## Monitoring & Logs

### Real-Time Logs

```bash
# Follow all services
docker-compose logs -f

# Follow specific service
docker-compose logs -f agent
docker-compose logs -f command-center

# Show last N lines
docker-compose logs --tail 50 agent
```

### Check Service Status

```bash
# List running containers
docker ps

# Get detailed info
docker inspect agent

# Check health specifically
docker inspect --format='{{.State.Health.Status}}' agent
```

### Access Agent Database

```bash
# Connect to agent container
docker exec -it agent sh

# Inside container, query database
sqlite3 /app/data/agent.db

# SQL examples:
# SELECT * FROM tasks;
# SELECT COUNT(*) FROM tasks WHERE status='completed';
# SELECT * FROM tasks WHERE status='failed';
```

---

## Maintenance

### Clean Up

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes data)
docker-compose down -v

# Remove unused images
docker image prune

# Full cleanup (be careful!)
docker system prune -a
```

### Rebuild Services

```bash
# Rebuild images
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### Database Reset

```bash
# Remove agent database
docker volume rm agent-system_agent-data

# Or from inside container
docker exec agent rm /app/data/agent.db

# Database will recreate on next start
docker-compose restart agent
```

---

## Performance Tuning

### For Production Use

1. **Increase Task Timeout:**
   - Edit `agent-service/app.py`
   - Change `timeout=30` to higher value

2. **Switch to PostgreSQL:**
   - Replace SQLite with PostgreSQL in agent service
   - Add PostgreSQL service to docker-compose.yml

3. **Enable Caching:**
   - Add Redis for result caching
   - Implement WebSocket for real-time updates

4. **Load Balancing:**
   - Deploy multiple agent instances
   - Use nginx as reverse proxy

5. **Monitoring:**
   - Add Prometheus metrics
   - Integrate with ELK stack for logging

### Resource Limits

**Edit docker-compose.yml:**
```yaml
services:
  agent:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Next Steps

1. ✅ Verified services running
2. ✅ Sent first task
3. ✅ Viewed results in dashboard
4. Now:
   - Read [README.md](README.md) for detailed API docs
   - Review code comments in `agent-service/app.py`
   - Explore `command-center/pages/` for UI code
   - Add authentication (see Security notes)
   - Deploy to cloud (AWS, GCP, Azure, etc.)

---

## Support & Questions

- Check logs: `docker-compose logs`
- Review README.md for API details
- Check error codes table in README
- Ensure prerequisites are installed
- Verify Docker network is healthy

---

**Setup Complete!** 🎉

Your distributed task execution system is ready to use.
