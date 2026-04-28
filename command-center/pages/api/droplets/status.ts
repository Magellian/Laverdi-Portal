import { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/droplets/status
 * Returns the current droplet status for the authenticated user
 * 
 * This endpoint queries the Supabase user_droplets table to get:
 * - Droplet ID
 * - Status (provisioning/ready/error)
 * - Public IP
 * - Pairing token
 * - Tier info
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Extract user ID from auth context
    // For now, mock data to demonstrate the dashboard structure
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    // This will be replaced with actual Supabase query:
    // SELECT * FROM user_droplets WHERE user_id = $1
    
    // Mock responses for different scenarios
    if (userId === 'provisioning-user') {
      return res.status(200).json({
        droplet: {
          id: '1',
          droplet_id: 456789,
          public_ip: null,
          private_ip: null,
          status: 'provisioning',
          pairing_token: null,
          tier: 'starter',
          created_at: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
          updated_at: new Date().toISOString(),
        },
      });
    }

    if (userId === 'ready-user') {
      return res.status(200).json({
        droplet: {
          id: '1',
          droplet_id: 123456,
          public_ip: '192.0.2.42',
          private_ip: '10.132.0.2',
          status: 'ready',
          pairing_token: 'pair_abcd1234efgh5678ijkl9012mnop3456',
          tier: 'starter',
          created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          updated_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        },
      });
    }

    if (userId === 'error-user') {
      return res.status(200).json({
        droplet: {
          id: '1',
          droplet_id: 789012,
          public_ip: null,
          private_ip: null,
          status: 'error',
          pairing_token: null,
          tier: 'starter',
          created_at: new Date(Date.now() - 600000).toISOString(),
          updated_at: new Date(Date.now() - 300000).toISOString(),
        },
      });
    }

    // No droplet provisioned yet
    return res.status(200).json({
      error: 'No agent provisioned yet. Upgrade your plan to get started.',
    });
  } catch (error: any) {
    console.error('Error fetching droplet status:', error);
    return res.status(500).json({
      error: 'Failed to fetch droplet status',
      details: error.message,
    });
  }
}
