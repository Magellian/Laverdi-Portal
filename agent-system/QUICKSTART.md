# ⚡ Quick Start Card

**Print this or bookmark it!**

---

## 🚀 Start (5 minutes)

```bash
# Linux/macOS
./start.sh

# Windows
start.bat

# Wait for: "✨ System Started!"
```

## 🌐 Access

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:8000 | Web UI |
| Agent API | http://localhost:5000 | Task execution |
| Health | http://localhost:5000/health | Status check |

## 📋 First Task

1. Open http://localhost:8000
2. Click **"Register Agent"**
3. Enter: `http://agent:5000`
4. Fill form:
   - Command: `echo`
   - Arguments: `hello world`
5. Click **"Send Task"**
6. View result in history

## 🧪 Test API

```bash
# Health check
curl http://localhost:5000/health

# Send task
curl -X POST http://localhost:5000/task \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "test-1",
    "command": "echo",
    "args": ["hello"]
  }'

# Check tasks
curl http://localhost:5000/tasks
```

## 📚 Documentation

| File | Purpose | Time |
|------|---------|------|
| INDEX.md | Navigation | 5 min |
| SETUP.md | Full setup | 20 min |
| README.md | Complete ref | 15 min |
| API-TESTING.md | API docs | 10 min |

## 🐛 Troubleshooting

```bash
# View logs
docker-compose logs -f

# Check specific service
docker-compose logs agent
docker-compose logs command-center

# Restart services
docker-compose restart

# Stop
docker-compose down
```

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| "Ports in use" | Kill process or use different port |
| "Can't connect" | Check Docker is running |
| "Agent not registering" | Use `http://agent:5000` (container network) |
| "Task not executing" | Check logs: `docker-compose logs agent` |

## ⚙️ Configuration

**Change ports:** Edit `docker-compose.yml`
```yaml
agent:
  ports:
    - "5001:5000"  # Change 5001
command-center:
  ports:
    - "8001:8000"  # Change 8001
```

**Change timeout:** Edit `agent-service/app.py`
```python
timeout=60  # Change from 30 to 60 seconds
```

## 🎯 API Quick Reference

### Agent Service (5000)
```bash
POST   /task              # Submit task
GET    /health            # Health check
GET    /tasks             # List all tasks
GET    /task/<id>         # Get specific task
```

### Command Center (8000)
```bash
POST   /api/agents        # Register agent
GET    /api/agents        # List agents
POST   /api/tasks         # Send task to agent
GET    /api/tasks         # List tasks
POST   /api/task-result   # Callback (agent → CC)
```

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 202 | Task accepted |
| 400 | Bad request |
| 404 | Not found |
| 500 | Server error |

## 🔍 Key Ports

```
5000  - Agent Service (Flask)
8000  - Command Center (Next.js)
```

## 💾 Database

**SQLite location:** `/app/data/agent.db` (in container)

Access via:
```bash
docker exec agent sqlite3 /app/data/agent.db
```

SQL examples:
```sql
SELECT * FROM tasks;
SELECT COUNT(*) FROM tasks WHERE status='completed';
SELECT * FROM tasks WHERE status='failed';
```

## 🗑️ Clean Up

```bash
# Stop services
docker-compose down

# Remove data
docker-compose down -v

# Remove images
docker image prune -a

# Full cleanup
docker system prune -a
```

## ✨ Next Steps

1. ✅ Services running?
2. ✅ Sent test task?
3. ✅ Got result?
4. → Read [README.md](README.md) for complete reference
5. → Check [API-TESTING.md](API-TESTING.md) for all endpoints

## 🎓 Learn More

- Full setup: [SETUP.md](SETUP.md)
- All features: [README.md](README.md)
- API details: [API-TESTING.md](API-TESTING.md)
- What's included: [DELIVERABLES.md](DELIVERABLES.md)
- Navigation: [INDEX.md](INDEX.md)

---

## 🚨 Emergency Commands

```bash
# View everything
docker-compose logs

# Restart everything
docker-compose restart

# Rebuild from scratch
docker-compose down -v && docker-compose build && docker-compose up -d

# Force rebuild
docker-compose build --no-cache

# Check if running
docker ps

# Get container IPs
docker network inspect laverdi-net
```

---

## 💡 Pro Tips

- Use `docker-compose logs -f` for real-time monitoring
- Browser dev tools (F12) shows errors if UI doesn't load
- Each task gets unique ID automatically
- Task history limited to 100 most recent
- Results stored permanently in SQLite DB

---

## 🎯 You're All Set!

**Everything is running and ready to use.** 🚀

For detailed docs, see [INDEX.md](INDEX.md) or jump to [README.md](README.md).

