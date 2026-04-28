// pages/api/models/tier-mapping.ts
// Returns current tier → model mapping

import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: tiers, error } = await supabase
      .from('model_tier_map')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      tiers: tiers || [],
    });
  } catch (error) {
    console.error('Tier mapping error:', error);
    return res.status(500).json({ error: 'Failed to fetch tier mapping' });
  }
}
