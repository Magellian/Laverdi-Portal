import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, instance_id, instance_ip, instance_port, auth_token, status } = req.body;

    if (!user_id || !instance_id || !instance_ip || !auth_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, just acknowledge receipt
    // In production, this would update Supabase
    console.log(`✓ Callback received for instance ${instance_id}: IP=${instance_ip}, token=${auth_token.substring(0, 8)}...`);

    return res.status(200).json({
      success: true,
      message: 'Provisioning callback received',
      instanceId: instance_id
    });
  } catch (error: any) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: error.message });
  }
}
