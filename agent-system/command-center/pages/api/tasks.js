/**
 * API endpoint to manage tasks
 * Sends tasks to agents and tracks their execution
 */
import axios from 'axios';

let taskRegistry = {};
let agentRegistry = {};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List all tasks
    const tasks = Object.values(taskRegistry).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 100);
    
    return res.status(200).json({ tasks });
  }
  
  if (req.method === 'POST') {
    // Create and send task to agent
    const { agentId, name, command, args } = req.body;
    
    if (!agentId || !command) {
      return res.status(400).json({ 
        error: 'Missing required fields: agentId, command' 
      });
    }
    
    // Check if agent exists
    const agent = agentRegistry[agentId];
    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found. Register agent first.' 
      });
    }
    
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Send task to agent
      const response = await axios.post(
        `${agent.url}/task`,
        {
          id: taskId,
          name: name || command,
          command,
          args: args || [],
          callback_url: `${process.env.COMMAND_CENTER_URL || 'http://localhost:8000'}/api/task-result`
        },
        { timeout: 5000 }
      );
      
      // Track task
      taskRegistry[taskId] = {
        id: taskId,
        agentId,
        agentName: agent.name,
        name: name || command,
        command,
        args: args || [],
        status: 'pending',
        result: null,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      
      return res.status(202).json({ 
        task: taskRegistry[taskId],
        message: 'Task sent to agent'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: `Failed to send task to agent: ${error.message}`
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
