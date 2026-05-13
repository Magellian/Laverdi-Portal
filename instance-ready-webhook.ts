import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { instanceId, userId, instanceIp, instancePort, token } = req.body;

    // Validate webhook token
    const expectedToken = process.env.INSTANCE_WEBHOOK_TOKEN || 'webhook-secret-token-change-in-production';
    if (token !== expectedToken) {
      console.error('Invalid webhook token received');
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!instanceId || !userId) {
      return res.status(400).json({ error: 'Missing instanceId or userId' });
    }

    console.log('Instance ready webhook received:', { instanceId, userId, instanceIp, instancePort });

    // Update instance record
    const { error: instanceError } = await supabase
      .from('instances')
      .update({
        ip_address: instanceIp,
        port: instancePort || 9000,
        status: 'ready',
      })
      .eq('container_id', instanceId);

    if (instanceError) {
      console.error('Failed to update instance:', JSON.stringify(instanceError));

      // If no matching container_id, try upserting by user_id
      const { error: upsertError } = await supabase.from('instances').upsert({
        user_id: userId,
        container_id: instanceId,
        ip_address: instanceIp,
        port: instancePort || 9000,
        status: 'ready',
      }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Upsert also failed:', JSON.stringify(upsertError));
      } else {
        console.log('Instance upserted successfully');
      }
    } else {
      console.log('Instance updated to ready');
    }

    // Update user status to ready
    const { error: userError } = await supabase
      .from('users')
      .update({ status: 'ready' })
      .eq('id', userId);

    if (userError) {
      console.error('Failed to update user status:', JSON.stringify(userError));
    } else {
      console.log('User status updated to ready');
    }

    return res.status(200).json({ success: true, message: 'Instance marked as ready' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
