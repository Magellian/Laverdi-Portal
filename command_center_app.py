from flask import Flask, render_template_string
import requests
import json

app = Flask(__name__)

HTML = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Command Center</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900">
    <div class="min-h-screen text-white p-6">
        <div class="max-w-7xl mx-auto">
            <h1 class="text-4xl font-bold text-blue-400 mb-2">🤖 Command Center</h1>
            <p class="text-slate-400 mb-8">Agent Service Dashboard</p>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Agents Panel -->
                <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h2 class="text-xl font-bold mb-4 text-blue-300">Agent Status</h2>
                    <div id="agentStatus" class="space-y-2">
                        <div class="bg-slate-700 p-3 rounded">
                            <div class="font-medium">agent-001</div>
                            <div class="text-sm text-slate-400">http://laverdi-agent:5000</div>
                            <div id="agentHealth" class="text-sm text-yellow-400 mt-2">Checking...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Task Submission -->
                <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h2 class="text-xl font-bold mb-4 text-blue-300">Submit Task</h2>
                    <input type="text" id="taskName" placeholder="Task name" class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm mb-2"/>
                    <input type="text" id="command" placeholder="Command (e.g., echo)" class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm mb-2"/>
                    <input type="text" id="args" placeholder="Arguments" class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm mb-2"/>
                    <button onclick="submitTask()" class="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-medium">Send Task</button>
                    <div id="taskStatus" class="mt-3 text-sm text-slate-400"></div>
                </div>
                
                <!-- Task History -->
                <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h2 class="text-xl font-bold mb-4 text-blue-300">Task History</h2>
                    <div id="taskHistory" class="space-y-2 max-h-96 overflow-y-auto">
                        <p class="text-slate-500 text-sm">Loading tasks...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const AGENT_URL = 'http://laverdi-agent:5000';
        
        async function checkAgentHealth() {
            try {
                const res = await fetch(`${AGENT_URL}/health`, { mode: 'no-cors' });
                document.getElementById('agentHealth').innerHTML = '<span class="text-green-400">✓ Healthy</span>';
            } catch (e) {
                document.getElementById('agentHealth').innerHTML = '<span class="text-red-400">✗ Offline</span>';
            }
        }
        
        async function loadTasks() {
            try {
                const res = await fetch(`${AGENT_URL}/tasks`);
                const data = await res.json();
                const tasks = data.tasks || [];
                
                if (tasks.length === 0) {
                    document.getElementById('taskHistory').innerHTML = '<p class="text-slate-500 text-sm">No tasks yet</p>';
                    return;
                }
                
                const html = tasks.slice(0, 20).map(t => `
                    <div class="bg-slate-700 p-3 rounded border border-slate-600">
                        <div class="font-medium text-blue-300">${t.name}</div>
                        <div class="text-xs text-slate-400">${t.command} ${t.args}</div>
                        <div class="text-xs font-bold mt-2 ${
                            t.status === 'completed' ? 'text-green-400' : 
                            t.status === 'running' ? 'text-yellow-400' : 
                            'text-red-400'
                        }">${t.status.toUpperCase()}</div>
                        ${t.output ? `<div class="text-slate-300 bg-slate-800 p-2 rounded mt-2 max-h-20 overflow-y-auto whitespace-pre-wrap text-xs">${t.output.slice(0, 200)}</div>` : ''}
                    </div>
                `).join('');
                document.getElementById('taskHistory').innerHTML = html;
            } catch (e) {
                document.getElementById('taskHistory').innerHTML = '<p class="text-red-400 text-sm">Failed to load tasks</p>';
            }
        }
        
        async function submitTask() {
            const name = document.getElementById('taskName').value || 'unnamed';
            const command = document.getElementById('command').value;
            const args = document.getElementById('args').value || '';
            
            if (!command) {
                alert('Enter a command');
                return;
            }
            
            const status = document.getElementById('taskStatus');
            status.innerHTML = 'Sending...';
            
            try {
                const res = await fetch(`${AGENT_URL}/task`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, command, args })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    status.innerHTML = `✓ Task ${data.task_id.slice(0, 8)}... submitted`;
                    document.getElementById('taskName').value = '';
                    document.getElementById('command').value = '';
                    document.getElementById('args').value = '';
                    setTimeout(loadTasks, 500);
                } else {
                    status.innerHTML = '✗ Failed to submit task';
                }
            } catch (e) {
                status.innerHTML = `✗ Error: ${e.message}`;
            }
        }
        
        // Initial load
        checkAgentHealth();
        loadTasks();
        
        // Refresh every 3 seconds
        setInterval(() => {
            checkAgentHealth();
            loadTasks();
        }, 3000);
    </script>
</body>
</html>
'''

@app.route('/')
def dashboard():
    return render_template_string(HTML)

@app.route('/health')
def health():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    print('🚀 Command Center starting on 0.0.0.0:8000')
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
