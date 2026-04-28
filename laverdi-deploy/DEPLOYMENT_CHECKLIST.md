# Deployment Checklist

## Pre-Deployment

- [ ] VPS SSH access verified (64.23.142.154)
- [ ] Docker installed and running on VPS
- [ ] Docker Compose 1.29+ installed on VPS
- [ ] `laverdi-net` Docker network exists
- [ ] Ports 5000-5003 available on VPS
- [ ] Deployment files copied to VPS at `/opt/laverdi-deploy`

## Build Phase

- [ ] Navigate to `/opt/laverdi-deploy`
- [ ] Run `docker build -t laverdi/test-agent:latest ./test-agent`
  - ✓ Image builds successfully
  - ✓ No errors or warnings
- [ ] Run `docker build -t laverdi/command-center:latest ./command-center`
  - ✓ Image builds successfully
  - ✓ No errors or warnings
- [ ] Verify images with `docker images | grep laverdi`
  - ✓ `laverdi/test-agent:latest` present
  - ✓ `laverdi/command-center:latest` present

## Deployment Phase (Option 1: Docker Compose)

- [ ] Run `docker-compose up -d`
  - ✓ Command completes without errors
- [ ] Wait 5 seconds for containers to start
- [ ] Verify containers: `docker ps | grep -E "(command-center|test-agent)"`
  - ✓ command-center running on port 5000
  - ✓ test-agent-1 running on port 5001
  - ✓ test-agent-2 running on port 5002
  - ✓ All containers showing "Up"

## Deployment Phase (Option 2: Manual Docker Run)

### Command Center

- [ ] Run command center deployment command:
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
- [ ] Verify: `docker ps | grep command-center`
  - ✓ Container running
  - ✓ Port 5000 mapped
  - ✓ Status shows "Up"

### Test Agent 1

- [ ] Run agent deployment command:
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
- [ ] Verify: `docker ps | grep test-agent-1`
  - ✓ Container running
  - ✓ Port 5001 mapped
  - ✓ Status shows "Up"

### Test Agent 2 & 3 (Optional)

- [ ] Deploy test-agent-2 on port 5002 (same as above, update ports)
- [ ] Deploy test-agent-3 on port 5003 (same as above, update ports)

## Verification Phase

### Health Checks

- [ ] Command Center Health:
  ```bash
  curl http://localhost:5000/api/health
  ```
  - ✓ Returns `{"status":"healthy"}`

- [ ] Agent Health:
  ```bash
  curl http://localhost:5001/health
  ```
  - ✓ Returns `{"status":"healthy"}`

### Container Logs

- [ ] Check command-center logs:
  ```bash
  docker logs command-center
  ```
  - ✓ No errors
  - ✓ Shows "Starting OpenClaw Command Center"

- [ ] Check agent logs:
  ```bash
  docker logs test-agent-1
  ```
  - ✓ No errors
  - ✓ Shows "Starting Test Agent"

### Network Connectivity

- [ ] Agent can reach command center:
  ```bash
  docker exec test-agent-1 curl http://command-center:5000/api/health
  ```
  - ✓ Returns `{"status":"healthy"}`

- [ ] Command center can reach agent:
  ```bash
  docker exec command-center curl http://test-agent-1:5001/health
  ```
  - ✓ Returns `{"status":"healthy"}`

## Testing Phase

### Dashboard Access

- [ ] Open browser to `http://64.23.142.154:5000`
  - ✓ Dashboard loads
  - ✓ No 404 or connection errors
  - ✓ Stats panel visible

- [ ] Verify agent appears in dashboard
  - ✓ Agents panel shows "test-agent-1"
  - ✓ Agent status shows "Online"

### Simple Task Test

- [ ] Submit echo task via API:
  ```bash
  curl -X POST http://localhost:5001/task \
    -H "Content-Type: application/json" \
    -d '{
      "task_id": "check-001",
      "type": "echo",
      "params": {"message": "Deployment successful!"}
    }'
  ```
  - ✓ Returns 202 Accepted
  - ✓ Returns task_id

- [ ] Check task status:
  ```bash
  curl http://localhost:5001/tasks/check-001
  ```
  - ✓ Status shows "completed"
  - ✓ Result shows original message

- [ ] Verify in dashboard:
  - ✓ Task appears in "Task History"
  - ✓ Status shows "completed" (green)
  - ✓ Result visible

### Dashboard Task Creation

- [ ] Create task via dashboard form
  1. Select agent: test-agent-1
  2. Task type: Echo Message
  3. Message: "Dashboard test"
  4. Click "Send Task"
  - ✓ Task alert appears
  - ✓ Form clears

- [ ] Verify task appears immediately
  - ✓ Task visible in Task History (within 5 seconds)
  - ✓ Status shows "completed"

### Advanced Task Types

- [ ] System Info task:
  ```bash
  curl -X POST http://localhost:5001/task \
    -H "Content-Type: application/json" \
    -d '{"task_id":"sys-001","type":"system_info","params":{}}'
  ```
  - ✓ Returns 202
  - [ ] Wait 2 seconds
  - ✓ Status shows "completed"
  - ✓ Result contains agent_id

- [ ] Web Request task:
  ```bash
  curl -X POST http://localhost:5001/task \
    -H "Content-Type: application/json" \
    -d '{"task_id":"web-001","type":"web_request","params":{"url":"https://example.com"}}'
  ```
  - ✓ Returns 202
  - [ ] Wait 3 seconds
  - ✓ Status shows "completed"
  - ✓ Result shows status_code (200)

- [ ] Read File task:
  ```bash
  curl -X POST http://localhost:5001/task \
    -H "Content-Type: application/json" \
    -d '{"task_id":"file-001","type":"read_file","params":{"path":"/etc/hostname"}}'
  ```
  - ✓ Returns 202
  - [ ] Wait 2 seconds
  - ✓ Status shows "completed"
  - ✓ Result contains file content

### Agent Registration

- [ ] Verify agent auto-registers via API:
  ```bash
  curl http://localhost:5000/api/agents
  ```
  - ✓ Returns list with test-agent-1
  - ✓ agent_url is correct
  - ✓ status shows "online"

### API Test Suite

- [ ] Run comprehensive test:
  ```bash
  chmod +x test-api.sh
  ./test-api.sh http://localhost:5000 http://localhost:5001
  ```
  - ✓ All tests pass (green checkmarks)
  - ✓ Success rate shows 100%
  - ✓ No failures

## Production Checklist

### Persistence (Optional)

- [ ] If using Docker Compose, verify volumes persist tasks
- [ ] Consider adding database for persistent task history

### Logging

- [ ] Verify logs are captured:
  ```bash
  docker logs -f command-center
  ```
  - ✓ Shows task submissions
  - ✓ Shows agent registrations

### Monitoring

- [ ] Set up container monitoring:
  ```bash
  docker stats --no-stream
  ```
  - ✓ Memory usage reasonable (<300MB for CC)
  - ✓ CPU usage low when idle

### Backup Plan

- [ ] Document procedure to restart containers:
  ```bash
  docker-compose restart
  ```
  - ✓ Containers come back online
  - ✓ Agents reconnect

## Scaling Checklist (Optional)

If deploying multiple agents:

- [ ] Agent 2:
  - [ ] Deploy on port 5002
  - [ ] Verify in dashboard
  - [ ] Send test task

- [ ] Agent 3:
  - [ ] Deploy on port 5003
  - [ ] Verify in dashboard
  - [ ] Send test task

- [ ] Load Test:
  ```bash
  for i in {1..10}; do
    curl -X POST http://localhost:5001/task \
      -H "Content-Type: application/json" \
      -d "{\"task_id\":\"load-$i\",\"type\":\"echo\",\"params\":{\"message\":\"test\"}}"
  done
  ```
  - ✓ All tasks submit successfully
  - ✓ All tasks complete within 10 seconds
  - ✓ Dashboard shows all tasks

## Final Verification

### System Ready

- [ ] Dashboard accessible: `http://64.23.142.154:5000`
- [ ] At least 1 agent connected
- [ ] Can create and execute tasks
- [ ] Tasks report results
- [ ] Dashboard updates in real-time

### Documentation

- [ ] All README files in place:
  - [ ] `/opt/laverdi-deploy/README.md`
  - [ ] `/opt/laverdi-deploy/DEPLOYMENT.md`
  - [ ] `/opt/laverdi-deploy/ARCHITECTURE.md`
  - [ ] `/opt/laverdi-deploy/test-agent/README.md`
  - [ ] `/opt/laverdi-deploy/command-center/README.md`

### Scripts Available

- [ ] `quick-start.sh` working
- [ ] `test-api.sh` working
- [ ] `docker-compose.yml` ready

### Team Handoff

- [ ] All files committed to repository (if applicable)
- [ ] Deployment procedure documented
- [ ] Support contacts identified
- [ ] Monitoring setup documented
- [ ] Backup procedures documented

## Troubleshooting Issues Found

During deployment, note any issues and resolution:

### Issue 1
- **Problem**: [describe]
- **Resolution**: [how fixed]
- **Prevention**: [to prevent future]

### Issue 2
- **Problem**: [describe]
- **Resolution**: [how fixed]
- **Prevention**: [to prevent future]

## Sign-Off

- **Deployed By**: _________________ (name/date)
- **Verified By**: _________________ (name/date)
- **Ready for Production**: [ ] Yes [ ] No

## Post-Deployment

### Week 1
- [ ] Monitor container health daily
- [ ] Check logs for errors
- [ ] Verify auto-restart is working

### Ongoing
- [ ] Monitor resource usage
- [ ] Review task execution times
- [ ] Plan for scaling if needed
- [ ] Update documentation

---

**Deployment Status**: ☐ Not Started | ☐ In Progress | ☐ Complete | ☐ Issues

**Date Completed**: _______________

**Notes**:
```
[Space for additional notes]
```
