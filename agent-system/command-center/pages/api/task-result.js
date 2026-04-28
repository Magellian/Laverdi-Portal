/**
 * Callback endpoint for agents to report task results
 */

let taskRegistry = {};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { id, name, status, result, completed_at } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing task id' });
    }
    
    // Update task status
    if (taskRegistry[id]) {
      taskRegistry[id].status = status;
      taskRegistry[id].result = result;
      taskRegistry[id].completedAt = completed_at;
      
      console.log(`[CALLBACK] Task ${id} reported as ${status}`);
    }
    
    return res.status(200).json({ received: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
