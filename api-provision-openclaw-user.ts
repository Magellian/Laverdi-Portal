// pages/api/provision-openclaw-user.ts
// Provision OpenClaw container with tier-based model

import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DO_API_KEY = process.env.DO_INFERENCE_API_KEY || 'sk-do-REDACTED_DO_INFERENCE_KEY';
const COMMAND_CENTER_URL = process.env.COMMAND_CENTER_URL || 'http://laverdi-command-center:8000';
const DO_INFERENCE_BASE = 'https://inference.do-ai.run/v1';

interface ProvisionRequest {
  userId: string;
  tier?: string;
}

interface ProvisionResponse {
  success: boolean;
  container?: {
    id: string;
    model_id: string;
    endpoint: string;
    apiKey: string;
    port: number;
    url: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProvisionResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { userId, tier } = req.body as ProvisionRequest;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Determine tier (use provided tier or existing user tier)
    const userTier = tier || user.tier || 'free';

    // Look up model for this tier
    const { data: tierMap, error: mapError } = await supabase
      .from('model_tier_map')
      .select('model_id')
      .eq('tier', userTier)
      .single();

    if (mapError || !tierMap) {
      return res.status(500).json({ success: false, error: `Model not found for tier: ${userTier}` });
    }

    const modelId = tierMap.model_id;

    // Call Command Center to provision container
    // The Command Center will handle Docker operations
    const provisioningResponse = await fetch(`${COMMAND_CENTER_URL}/api/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        model: modelId,
        env: {
          OPENAI_API_BASE: DO_INFERENCE_BASE,
          OPENAI_API_KEY: DO_API_KEY,
          OPENAI_MODEL: modelId,
        },
      }),
    });

    const provisioning = await provisioningResponse.json();
    const { containerId, port, ipAddress } = provisioning;

    // Update user record with model info
    await supabase
      .from('users')
      .update({
        tier: userTier,
        model_id: modelId,
        openclaw_base_url: DO_INFERENCE_BASE,
      })
      .eq('id', userId);

    // Store instance info
    await supabase.from('instances').insert({
      user_id: userId,
      container_id: containerId,
      model_id: modelId,
      port: port,
      ip_address: ipAddress,
      status: 'running',
    });

    return res.status(200).json({
      success: true,
      container: {
        id: containerId,
        model_id: modelId,
        endpoint: DO_INFERENCE_BASE,
        apiKey: DO_API_KEY,
        port: port,
        url: `http://${ipAddress}:${port}`,
      },
    });
  } catch (error) {
    console.error('Provision error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Provisioning failed',
    });
  }
}
