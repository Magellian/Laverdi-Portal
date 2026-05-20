/**
 * Provisioning Callback Webhook Handler
 * Handles POST requests from provisioning scripts
 * Path: /api/webhooks/do-callback
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface CallbackPayload {
  user_id: string;
  instance_id: string;
  instance_ip: string;
  instance_port: number;
  auth_token: string;
  status: string;
  provisioned_at?: string;
}

interface CallbackResponse {
  success: boolean;
  message: string;
  instanceId?: string;
  error?: string;
}

/**
 * Handler for POST /api/webhooks/do-callback
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CallbackResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only POST requests are accepted'
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Configuration error',
        error: 'Supabase credentials not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse callback payload
    const payload: CallbackPayload = req.body;

    // Validate required fields
    if (!payload.user_id || !payload.instance_id || !payload.instance_ip || !payload.auth_token) {
      return res.status(400).json({
        success: false,
        message: 'Bad request',
        error: 'Missing required fields: user_id, instance_id, instance_ip, auth_token'
      });
    }

    // Update instance record in Supabase
    const { error: updateError } = await supabase
      .from('instances')
      .update({
        instance_ip: payload.instance_ip,
        instance_port: payload.instance_port || 18789,
        auth_token: payload.auth_token,
        status: payload.status || 'ready',
        gateway: `http://${payload.instance_ip}:${payload.instance_port || 18789}`,
        gateway_port: payload.instance_port || 18789,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.instance_id)
      .eq('user_id', payload.user_id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Database update failed',
        error: updateError.message
      });
    }

    console.log(`✓ Instance ${payload.instance_id} updated: IP=${payload.instance_ip}, token=${payload.auth_token.substring(0, 8)}...`);

    return res.status(200).json({
      success: true,
      message: `Instance provisioning completed successfully`,
      instanceId: payload.instance_id
    });

  } catch (error: any) {
    console.error('Callback handler error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'An unexpected error occurred'
    });
  }
}
