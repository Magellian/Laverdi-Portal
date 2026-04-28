# System Architecture

## High-Level Overview

```
┌────────────────────────────────────────────────────────────┐
│                    Internet Users                          │
│                   (64.23.142.154)                          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       ↓
        ┌──────────────────────────────┐
        │    nginx Reverse Proxy       │
        │   (laverdi-nginx, :80/:443)  │
        └─────────────┬────────────────┘
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
        
    ┌──────────┐  ┌───────────┐  ┌─────────────┐
    │ Portal   │  │ Command   │  │ (Other)     │
    │ App      │  │ Center    │  │ Services    │
    │ :3000    │  │ :5000     │  │             │
    └──────────┘  └───────────┘  └─────────────┘
         │            │
         └────┬───────┘
              │
              ↓
    ┌────────────────────────────────┐
    │   laverdi-net (Docker Network) │
    │   (Bridge network)             │
    │                                │
    │  ┌────────────────────────┐   │
    │  │ Command Center (Flask) │   │
    │  │ Port: 5000             │   │
    │  │ - REST API             │   │
    │  │ - Dashboard (HTML/JS)  │   │
    │  │ - Agent manager        │   │
    │  └────────────────────────┘   │
    │           ↑ ↑ ↑                │
    │    HTTP  │ │ │  HTTP          │
    │          │ │ └─────────────────┤─┐
    │          │ │                   │ │
    │  ┌───────┴─┴───┬─┬─┐          │ │
    │  ↓       ↓     ↓ ↓ ↓          │ │
    │  ┌─────┐┌─────┐┌─────┐        │ │
    │  │TA-1 ││TA-2 ││TA-3 │        │ │
    │  │5001 ││5002 ││5003 │        │ │
    │  └─────┘└─────┘└─────┘        │ │
    │     ↑       ↑       ↑         │ │
    │     └───┬───┴───┬───┘         │ │
    │         │       │             │ │
    │    Report Results             │ │
    │         │       │             │ │
    │         └───┬───┘             │ │
    │             ↓                 │ │
    │  ┌─────────────────────┐      │ │
    │  │ Update Status       │      │ │
    │  │ Update Dashboard    │      │ │
    │  └─────────────────────┘      │ │
    │                                │ │
    └────────────────────────────────┤─┘
                                     │
                                External Network
                                (if needed)
```

## Component Interaction Flow

### Task Submission Flow

```
User (Browser/API)
    │
    │ 1. Submit task
    ↓
Command Center Dashboard / API
    │
    │ 2. POST /tasks/create
    ↓
Command Center App
    │ 3. Validate & Store
    ↓
Agent Task Queue
    │
    │ 4. HTTP POST /task
    ↓
Test Agent (e.g., test-agent-1)
    │
    │ 5. Accept & Queue
    ↓
Agent Returns 202 Accepted
    │
    │ 6. Async Execute
    ↓
Task Execution Engine
    │
    │ 7. Run task type handler
    ↓
Task Completes (or Fails)
    │
    │ 8. HTTP POST /task-report
    ↓
Command Center /api/task-report
    │
    │ 9. Update task status
    ↓
Dashboard Polling
    │
    │ 10. GET /api/tasks
    ↓
Dashboard Refreshed
    │
    ↓
User Sees Results
```

## Network Communication Paths

### Docker Network (laverdi-net)

All internal communication happens on the `laverdi-net` Docker bridge network:

```
[Agent] ←→ [Command Center]
  :5001    :5000
  
Communication:
- Agent sends task reports to: http://command-center:5000/api/task-report
- Command Center sends tasks to: http://test-agent-1:5001/task
- Dashboard queries API on: http://localhost:5000/api/*
```

### External Access (Host Machine)

Exposed ports:

```
Host Machine (64.23.142.154)
  │
  ├─ :5000 → command-center:5000 (Dashboard)
  ├─ :5001 → test-agent-1:5001 (Agent API)
  ├─ :5002 → test-agent-2:5002 (Agent API)
  ├─ :5003 → test-agent-3:5003 (Agent API)
  │
  ├─ :3000 → laverdi-portal:3000 (Next.js app)
  │
  └─ :80, :443 → laverdi-nginx (Reverse proxy)
```

## Container Specifications

### Command Center Container

```yaml
Image: laverdi/command-center:latest
Ports:
  - 5000:5000 (HTTP API & Dashboard)
Networks:
  - laverdi-net
Environment:
  - COMMAND_CENTER_URL=http://localhost:5000
  - COMMAND_CENTER_PORT=5000
Volume: None (in-memory storage)
Memory: ~100-200MB
CPU: Minimal (event-driven)
Restart: unless-stopped
Health Check: GET /api/health
```

### Test Agent Container (Multiple Instances)

```yaml
Image: laverdi/test-agent:latest
Instances: 1, 2, 3 (scalable)
Ports:
  - 5001:5001 (test-agent-1)
  - 5002:5002 (test-agent-2)
  - 5003:5003 (test-agent-3)
Networks:
  - laverdi-net
Environment:
  - AGENT_ID=test-agent-{N}
  - COMMAND_CENTER_URL=http://command-center:5000
  - AGENT_HOST=test-agent-{N}
  - AGENT_PORT=500{N}
Volume: None (in-memory task history)
Memory: ~50-100MB per agent
CPU: Minimal per agent
Restart: unless-stopped
Health Check: GET /health
```

## Data Flow Sequence Diagrams

### Task Execution Sequence

```
Dashboard          CommandCenter    Agent-1      Agent-2
    │                  │             │            │
    │ 1. Create Task   │             │            │
    ├─────────────────→│             │            │
    │                  │ 2. Store    │            │
    │                  │ (pending)   │            │
    │                  │             │            │
    │                  │ 3. Dispatch │            │
    │                  ├────────────→│            │
    │                  │             │            │
    │                  │ 4. Accept   │            │
    │<─────────────────┤─────────────┤            │
    │  5. Poll         │             │            │
    │   every 5s       │             │ 6. Execute│
    │                  │             │  (async)   │
    │                  │             │            │
    │                  │             │ 7. Report  │
    │                  │←────────────┤────────────│
    │                  │             │            │
    │                  │ 8. Update   │            │
    │                  │ (completed) │            │
    │                  │             │            │
    │ 9. Refresh       │             │            │
    ├─────────────────→│             │            │
    │                  │ 10. Return  │            │
    │                  │  results    │            │
    │←─────────────────┤             │            │
    │ 11. Display      │             │            │
    │  results         │             │            │
```

### Agent Registration Sequence

```
Agent              CommandCenter       Dashboard
  │                    │                 │
  │ 1. First task      │                 │
  │    submitted       │                 │
  ├───────────────────→│                 │
  │                    │ 2. Accept       │
  │←───────────────────┤                 │
  │                    │                 │
  │ 3. Execute         │                 │
  │ (offline)          │                 │
  │                    │                 │
  │ 4. Report result   │                 │
  ├──→POST /task-report│                 │
  │                    │ 5. Register     │
  │                    │    agent        │
  │                    │                 │
  │                    │ 6. Store agent  │
  │                    │    metadata     │
  │                    │                 │
  │                    │ 7. GET /agents  │
  │                    │←────────────────┤
  │                    │ 8. Return list  │
  │                    │────────────────→│
  │                    │                 │ 9. Display
  │                    │                 │    agent
```

## State Management

### In-Memory Data Structures

```python
agents = {
    "test-agent-1": {
        "agent_id": "test-agent-1",
        "agent_url": "http://test-agent-1:5001",
        "status": "online",
        "registered_at": "2024-04-18T20:40:00",
        "last_heartbeat": "2024-04-18T20:42:00",
        "tasks_count": 5
    },
    "test-agent-2": { ... }
}

tasks = {
    "550e8400-e29b-41d4-a716-446655440000": {
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "agent_id": "test-agent-1",
        "type": "echo",
        "params": { "message": "hello" },
        "status": "completed",
        "created_at": "2024-04-18T20:42:00",
        "result": { "message": "hello" },
        "error": null,
        "completed_at": "2024-04-18T20:42:05"
    }
}
```

### Agent Task History (Local)

```python
task_history = {
    "task-001": {
        "task_id": "task-001",
        "type": "echo",
        "status": "completed",
        "result": { "message": "hello" },
        "error": null,
        "completed_at": "2024-04-18T20:42:05"
    }
}
```

## Deployment Topology

### Single VPS Deployment

```
VPS: 64.23.142.154
├── OS: Linux (Ubuntu 20.04+)
├── Docker: 20.10+
├── Docker Compose: 1.29+
│
└── Containers (laverdi-net)
    ├── laverdi-portal (Next.js :3000)
    ├── laverdi-nginx (nginx :80,:443)
    ├── command-center (Flask :5000)
    ├── test-agent-1 (Flask :5001)
    ├── test-agent-2 (Flask :5002)
    └── test-agent-3 (Flask :5003)
```

### Scaled Deployment (Multi-VPS)

```
Load Balancer (64.23.142.154:80)
    │
    ├─ VPS-1 (Portal Server)
    │  └─ laverdi-portal, laverdi-nginx
    │
    ├─ VPS-2 (Command Center + 5 Agents)
    │  ├─ command-center :5000
    │  ├─ test-agent-1 :5001
    │  ├─ test-agent-2 :5002
    │  ├─ test-agent-3 :5003
    │  ├─ test-agent-4 :5004
    │  └─ test-agent-5 :5005
    │
    ├─ VPS-3 (10 Additional Agents)
    │  ├─ test-agent-6 :5006
    │  ├─ test-agent-7 :5007
    │  └─ ... test-agent-15 :5015
    │
    └─ VPS-N (N Agents)
```

## Performance Characteristics

### Single Command Center

```
Metric                  Value
────────────────────────────────
API Latency (p95)       ~50ms
Dashboard Refresh Rate  5 seconds
Concurrent Agents       100+
Concurrent Tasks        1000+
Memory Per Agent        10KB
Memory Per Task         5KB
Total Memory (CC)       100-200MB
CPU Usage               <5% idle
Max Throughput          ~100 tasks/sec
```

### Single Agent

```
Metric                  Value
────────────────────────────────
Task Submission         202 in <10ms
Task Execution (avg)    1-5 seconds
Memory Baseline         50MB
Memory Per Task         ~1KB
Max Concurrent Tasks    ~50
CPU Usage               <10% per task
Max Throughput          ~20 tasks/sec
```

## Security Architecture

### Network Isolation

```
┌─────────────────────────────┐
│   Host Network              │
│  (Port Mapping)             │
│                             │
│  :5000 ─┐                  │
│  :5001 ─┤                  │
│  :5002 ─┤→ laverdi-net     │
│  :5003 ─┤   (Isolated)     │
│  :80   ─┤                  │
│  :443  ─┤                  │
└─────────────────────────────┘

Containers on laverdi-net can communicate
via container names (DNS resolution).
External access only via exposed ports.
```

### Authentication Considerations

Current: **None** (development only)

Production should add:

```
Client
  │
  ├─ TLS/HTTPS ──→ nginx
  │
  ├─ API Key ──→ Command Center
  │
  └─ Signature Verification ──→ Agent
```

## Disaster Recovery

### Data Loss Scenarios

**Current (In-Memory)**:
- ❌ Task history lost on container restart
- ❌ No persistent state
- ✅ Agents can be restarted independently

**Production (Recommended)**:
- ✅ Database backup
- ✅ Task audit log
- ✅ Agent state snapshot
- ✅ Transaction logging

### High Availability

```
Active:
┌─────────────────┐
│ Command Center  │ ← Primary
│ (Master)        │
└────────┬────────┘
         │
    Write/Read
         │
    ┌────▼────────────────┐
    │ Distributed Cache   │
    │ (Redis/Memcached)   │
    └────┬────────────────┘
         │
    Read
         │
┌────────▼──────────┐
│ Command Center    │ ← Standby
│ (Replica)         │
└───────────────────┘

Agents point to either via load balancer
```

---

**Key Takeaways**:

1. **Modular**: Command center and agents are independent
2. **Scalable**: Add agents without changing command center
3. **Resilient**: Failures are isolated to containers
4. **Simple**: HTTP for all communication (no message queues)
5. **Observable**: All endpoints expose health/status
