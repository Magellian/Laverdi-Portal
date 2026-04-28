import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [taskForm, setTaskForm] = useState({
    name: '',
    command: 'echo',
    args: 'hello world'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch agents and tasks on mount and periodically
  useEffect(() => {
    fetchAgents();
    fetchTasks();
    
    const interval = setInterval(() => {
      fetchAgents();
      fetchTasks();
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await axios.get('/api/agents');
      setAgents(res.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const registerAgent = async () => {
    const agentId = `agent-${Date.now()}`;
    const agentUrl = prompt('Enter agent URL (e.g., http://agent:5000):');
    
    if (!agentUrl) return;
    
    try {
      setLoading(true);
      await axios.post('/api/agents', {
        id: agentId,
        name: `Agent-${Math.random().toString(36).substr(2, 5)}`,
        url: agentUrl
      });
      
      setMessage('Agent registered successfully!');
      fetchAgents();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTask = async (e) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      setMessage('Please select an agent');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/tasks', {
        agentId: selectedAgent,
        name: taskForm.name || taskForm.command,
        command: taskForm.command,
        args: taskForm.args.split(' ').filter(arg => arg)
      });
      
      setMessage('Task sent successfully!');
      setTaskForm({ name: '', command: 'echo', args: 'hello world' });
      fetchTasks();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎛️ Command Center</h1>
          <p className="text-purple-200">Distributed Task Execution System</p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Agent Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">📍 Agents</h2>
              
              <button
                onClick={registerAgent}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg mb-4 transition disabled:opacity-50"
              >
                Register Agent
              </button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {agents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No agents registered</p>
                ) : (
                  agents.map(agent => (
                    <label
                      key={agent.id}
                      className="flex items-center p-3 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition border border-slate-600"
                    >
                      <input
                        type="radio"
                        name="agent"
                        value={agent.id}
                        checked={selectedAgent === agent.id}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{agent.name}</div>
                        <div className="text-xs text-gray-400">{agent.url}</div>
                        <div className="text-xs text-green-400">● Online</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle Panel - Task Creation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">⚡ Send Task</h2>
              
              <form onSubmit={handleSendTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Task Name</label>
                  <input
                    type="text"
                    placeholder="Optional task name"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Command</label>
                  <input
                    type="text"
                    placeholder="e.g., echo, ls, curl"
                    value={taskForm.command}
                    onChange={(e) => setTaskForm({ ...taskForm, command: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Arguments</label>
                  <input
                    type="text"
                    placeholder="Space-separated arguments"
                    value={taskForm.args}
                    onChange={(e) => setTaskForm({ ...taskForm, args: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedAgent}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Task'}
                </button>
              </form>

              {/* Quick Commands */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-sm font-semibold text-gray-300 mb-2">Quick Commands:</p>
                <div className="space-y-2">
                  {[
                    { cmd: 'echo', args: 'hello world', label: 'Echo Test' },
                    { cmd: 'uname', args: '-a', label: 'System Info' },
                    { cmd: 'date', args: '', label: 'Current Date' },
                    { cmd: 'pwd', args: '', label: 'Working Dir' }
                  ].map((quick, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTaskForm({ name: quick.label, command: quick.cmd, args: quick.args })}
                      className="w-full text-left px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition"
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Task History */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30 max-h-full overflow-hidden flex flex-col">
              <h2 className="text-xl font-bold text-white mb-4">📋 Task History</h2>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tasks yet</p>
                ) : (
                  tasks.slice(0, 20).map(task => (
                    <div key={task.id} className="bg-slate-700 p-3 rounded border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{task.name}</div>
                          <div className="text-xs text-gray-400">{task.agentName}</div>
                        </div>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          task.status === 'completed' ? 'bg-green-600 text-white' :
                          task.status === 'running' ? 'bg-yellow-600 text-white' :
                          task.status === 'failed' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{task.command}</div>
                      {task.result && task.status === 'completed' && (
                        <div className="mt-2 bg-slate-600 p-2 rounded text-xs text-gray-200 max-h-20 overflow-y-auto font-mono">
                          {task.result.stdout || task.result.stderr || 'No output'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
