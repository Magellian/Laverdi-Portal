// pages/api/openclaw/get-instance.ts
// Returns the OpenClaw instance info for the logged-in user

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from cookies or header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const accessToken = authHeader.substring(7);

    // Verify user with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get instance info from instances table
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (instanceError || !instance) {
      return res.status(404).json({ error: 'No instance found' });
    }

    // Column is api_key (not auth_token) in the instances table
    const token = instance.auth_token || instance.api_key;

    return res.status(200).json({
      instanceId: instance.id,
      userId: instance.user_id,
      port: instance.port,
      authToken: token,
      model: instance.model_id || instance.model,
      status: instance.status,
      url: `https://agent.laverdi.tech/?token=${token}`
    });

  } catch (error) {
    console.error('Error fetching instance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
