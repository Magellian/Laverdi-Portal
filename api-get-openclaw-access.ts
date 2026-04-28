// pages/api/openclaw/access.ts
// Get user's OpenClaw instance access details (URL, token, etc.)

import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface AccessResponse {
  success: boolean;
  instance?: {
    url: string;
    token: string;
    port: number;
    containerName: string;
    modelId: string;
    instructions: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get auth token from request (passed as Authorization: Bearer {token})
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get user from session (you'll need to implement this based on your auth setup)
    // For now, assume user ID comes from a query param or header
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    // Get user's instance from database
    const { data: instance, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (instanceError || !instance) {
      return res.status(404).json({ success: false, error: 'No instance found for user' });
    }

    // Get token from the container (in production, store this in DB)
    // For now, we'll need to read it from the container
    const token = instance.api_key || 'token-from-container';

    const accessUrl = `http://64.23.142.154:${instance.port}/?token=${token}`;

    return res.status(200).json({
      success: true,
      instance: {
        url: accessUrl,
        token: token,
        port: instance.port,
        containerName: instance.container_id,
        modelId: instance.model_id,
        instructions: `Click the button below to access your OpenClaw instance running ${instance.model_id}. If you have issues, use the SSH tunnel method: ssh -L ${instance.port}:localhost:${instance.port} root@64.23.142.154`,
      },
    });
  } catch (error) {
    console.error('Access endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get access details',
    });
  }
}
