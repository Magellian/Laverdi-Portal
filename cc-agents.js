let agents = [
  { id: 'agent-001', url: 'http://laverdi-agent:5000', status: 'healthy' }
];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({ agents });
  } else if (req.method === 'POST') {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        const agent = { id: `agent-${Date.now()}`, url, status: 'healthy' };
        agents.push(agent);
        res.status(201).json({ agent });
      } else {
        res.status(400).json({ error: 'Health check failed' });
      }
    } catch (error) {
      res.status(400).json({ error: 'Cannot reach agent' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
