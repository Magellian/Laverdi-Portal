#!/bin/bash

# Command Center Deployment Script

cat > /tmp/command-center-Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
EOF

cat > /tmp/package.json << 'EOF'
{
  "name": "command-center",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 8000",
    "build": "next build",
    "start": "next start -p 8000",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "axios": "^1.6.0"
  }
}
EOF

mkdir -p /tmp/command-center/pages/api

cat > /tmp/command-center/pages/index.js << 'JSEOF'
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [taskForm, setTaskForm] = useState({ name: '', command: '', args: '' });
  const [loading, setLoading] = useState(false);
  const [agentUrl, setAgentUrl] = useState('http://laverdi-agent:5000');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadTasks(selectedAgent.url);
    }
  }, [selectedAgent]);

  const loadAgents = async () => {
    try {
      const response = await axios.get('/api/agents');
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadTasks = async (agentUrl) => {
    try {
      const response = await axios.get(`${agentUrl}/tasks`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const registerAgent = async () => {
    if (!agentUrl) return;
    setRegistering(true);
    try {
      await axios.post('/api/agents', { url: agentUrl });
      setAgentUrl('');
      loadAgents();
    } catch (error) {
      alert('Failed to register agent: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  const submitTask = async () => {
    if (!selectedAgent || !taskForm.command) return;
    setLoading(true);
    try {
      await axios.post(`${selectedAgent.url}/task`, {
        name: taskForm.name || 'unnamed',
        command: taskForm.command,
        args: taskForm.args,
      });
      setTaskForm({ name: '', command: '', args: '' });
      setTimeout(() => loadTasks(selectedAgent.url), 500);
    } catch (error) {
      alert('Failed to submit task: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400">🤖 Command Center</h1>
          <p className="text-slate-400 mt-2">Manage agents and execute tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-blue-300">Agents</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="http://agent:5000"
                value={agentUrl}
                onChange={(e) => setAgentUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm mb-2"
              />
              <button
                onClick={registerAgent}
                disabled={registering}
                className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Register Agent'}
              </button>
            </div>

            <div className="space-y-2">
              {agents.length === 0 ? (
                <p className="text-slate-500 text-sm">No agents registered</p>
              ) : (
                agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                      selectedAgent?.id === agent.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <div className="font-medium">Agent {agent.id.slice(0, 8)}</div>
                    <div className="text-xs text-slate-400">{agent.url}</div>
                    {agent.status && <div className="text-xs text-green-400">✓ Healthy</div>}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-blue-300">Send Task</h2>
            
            {selectedAgent ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task name"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Command (e.g., echo)"
                  value={taskForm.command}
                  onChange={(e) => setTaskForm({ ...taskForm, command: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
                <input
                  type="text"
                  placeholder="Arguments"
                  value={taskForm.args}
                  onChange={(e) => setTaskForm({ ...taskForm, args: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                />
                <button
                  onClick={submitTask}
                  disabled={loading || !taskForm.command}
                  className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Task'}
                </button>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Select an agent to send tasks</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-blue-300">Task History</h2>
            
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">No tasks</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.slice(0, 20).map((task) => (
                  <div key={task.id} className="bg-slate-700 p-2 rounded text-xs border border-slate-600">
                    <div className="font-medium text-blue-300">{task.name}</div>
                    <div className="text-slate-400">{task.command} {task.args}</div>
                    <div className={`text-xs font-bold ${
                      task.status === 'completed' ? 'text-green-400' : 
                      task.status === 'failed' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      {task.status}
                    </div>
                    {task.output && (
                      <div className="mt-1 text-slate-300 bg-slate-800 p-1 rounded max-h-20 overflow-y-auto whitespace-pre-wrap text-xs">
                        {task.output.slice(0, 200)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
JSEOF

cat > /tmp/command-center/pages/api/agents.js << 'APIEOF'
let agents = [
  { id: 'agent-001', url: 'http://laverdi-agent:5000', status: 'healthy' }
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ agents });
  } else if (req.method === 'POST') {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }
    
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        const agent = {
          id: `agent-${Date.now()}`,
          url,
          status: 'healthy'
        };
        agents.push(agent);
        res.status(201).json({ agent });
      } else {
        res.status(400).json({ error: 'Agent health check failed' });
      }
    } catch (error) {
      res.status(400).json({ error: 'Cannot reach agent' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
APIEOF

cat > /tmp/command-center/next.config.js << 'CONFEOF'
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}
module.exports = nextConfig
CONFEOF

cat > /tmp/command-center/Dockerfile << 'DOCKEREOF'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "start"]
DOCKEREOF

# Copy files
cp /tmp/package.json /tmp/command-center/
cp /tmp/command-center-Dockerfile /tmp/command-center/Dockerfile

# Build and deploy
docker build -t laverdi-command-center:latest /tmp/command-center/
docker stop laverdi-command-center 2>/dev/null
docker rm laverdi-command-center 2>/dev/null
docker run -d \
  --name laverdi-command-center \
  --network laverdi-net \
  -p 8000:8000 \
  laverdi-command-center:latest

sleep 5
echo "✅ Command Center deployed!"
curl -s http://localhost:8000 | head -20
