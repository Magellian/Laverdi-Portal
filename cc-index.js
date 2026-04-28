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
    if (selectedAgent) loadTasks(selectedAgent.url);
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
      alert('Failed to register agent');
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
      alert('Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 mb-2">🤖 Command Center</h1>
        <p className="text-slate-400 mb-8">Manage agents and execute tasks</p>

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
                {registering ? 'Registering...' : 'Register'}
              </button>
            </div>
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                    selectedAgent?.id === agent.id
                      ? 'bg-blue-600'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium">{agent.id.slice(0, 12)}</div>
                  <div className="text-xs text-slate-400">{agent.url}</div>
                </button>
              ))}
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
                  placeholder="Command"
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
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Task'}
                </button>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Select an agent</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-blue-300">Tasks</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tasks.slice(0, 20).map((task) => (
                <div key={task.id} className="bg-slate-700 p-2 rounded text-xs border border-slate-600">
                  <div className="font-medium text-blue-300">{task.name}</div>
                  <div className={task.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>
                    {task.status}
                  </div>
                  {task.output && (
                    <div className="mt-1 text-slate-300 bg-slate-800 p-1 rounded max-h-20 overflow-y-auto whitespace-pre-wrap text-xs">
                      {task.output.slice(0, 150)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
