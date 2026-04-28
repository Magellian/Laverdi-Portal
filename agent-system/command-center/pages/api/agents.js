/**
 * API endpoint to manage agent registry
 * Stores agent metadata in memory (demo) or file-based persistence
 */

let agentRegistry = {};

export default function handler(req, res) {
  if (req.method === 'GET') {
    // List all agents
    const agents = Object.values(agentRegistry).map(agent => ({
      ...agent,
      lastSeen: agent.lastSeen ? new Date(agent.lastSeen).toISOString() : null
    }));
    return res.status(200).json({ agents });
  }
  
  if (req.method === 'POST') {
    // Register or update agent
    const { id, name, url } = req.body;
    
    if (!id || !url) {
      return res.status(400).json({ error: 'Missing required fields: id, url' });
    }
    
    agentRegistry[id] = {
      id,
      name: name || id,
      url,
      status: 'online',
      lastSeen: new Date().toISOString(),
      tasksCompleted: agentRegistry[id]?.tasksCompleted || 0
    };
    
    return res.status(200).json({ agent: agentRegistry[id] });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
