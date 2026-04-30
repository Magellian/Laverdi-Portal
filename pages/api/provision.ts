import type { NextApiRequest, NextApiResponse } from 'next';
import { provisionDroplet } from '@/lib/digitalocean';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In production, you would verify the user session or ensure this is called
  // securely from your Stripe webhook handler.
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request body' });
  }

  try {
    const result = await provisionDroplet(userId);

    return res.status(200).json({
      success: true,
      message: 'Provisioning started',
      dropletId: result.dropletId,
      pairingToken: result.pairingToken // Note: Usually we don't send this back to the client yet, we wait for the callback.
    });

  } catch (error: any) {
    console.error('Provisioning Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
