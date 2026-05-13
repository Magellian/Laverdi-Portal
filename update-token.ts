import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, token, secret } = req.query;
  if (secret !== 'webhook-secret-token-change-in-production') {
    return res.status(401).json({ error: 'invalid secret' });
  }
  if (!userId || !token) {
    return res.status(400).json({ error: 'missing userId or token' });
  }
  const { error } = await supabase
    .from('instances')
    .update({ api_key: token as string })
    .eq('user_id', userId as string);
  if (error) {
    console.error('Token update failed:', error);
    return res.status(500).json({ error: 'update failed' });
  }
  console.log('Token saved for user:', userId);
  return res.status(200).json({ success: true });
}
