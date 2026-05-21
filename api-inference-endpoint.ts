// pages/api/inference/chat.ts
// Vultr inference endpoint with tier-based model routing
// Deployed: 2026-05-20

import { NextApiRequest, NextApiResponse } from 'next';
import { getModelForTier, getModelConfig, calculateRequestCost } from '@/lib/models';

interface ChatRequest {
  message: string;
  userTier: string;
  userId: string;
  conversationId?: string;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  model?: string;
  tokensUsed?: number;
  error?: string;
  tier?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { message, userTier, userId } = req.body as ChatRequest;

    // Validation
    if (!message || !userTier || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, userTier, userId',
      });
    }

    // Get model for tier (will throw if enterprise/coming soon)
    let model: string;
    try {
      model = getModelForTier(userTier);
    } catch (error) {
      return res.status(402).json({
        success: false,
        error: error instanceof Error ? error.message : 'Model not available',
      });
    }

    const config = getModelConfig(userTier);

    // Call Vultr Inference API
    const vultrResponse = await fetch(
      `${process.env.VULTR_INFERENCE_ENDPOINT}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VULTR_INFERENCE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: message }],
          max_tokens: config.maxTokens,
          temperature: 0.7,
          top_p: 0.9,
        }),
      }
    );

    if (!vultrResponse.ok) {
      const error = await vultrResponse.text();
      console.error('Vultr API Error:', vultrResponse.status, error);
      return res.status(502).json({
        success: false,
        error: `Vultr API error: ${vultrResponse.status}`,
      });
    }

    const data = await vultrResponse.json();

    // Extract response
    const responseText = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!responseText) {
      return res.status(500).json({
        success: false,
        error: 'No response from model',
      });
    }

    // Log usage (optional - for cost tracking)
    if (process.env.NODE_ENV === 'production') {
      // In production, log to database
      const cost = calculateRequestCost(userTier, tokensUsed);
      console.log(`[USAGE] User: ${userId}, Tier: ${userTier}, Model: ${model}, Tokens: ${tokensUsed}, Cost: $${cost.toFixed(4)}`);
      // TODO: Store in database for billing
    }

    return res.status(200).json({
      success: true,
      response: responseText,
      model: config.displayName,
      tokensUsed: tokensUsed,
      tier: userTier,
    });

  } catch (error) {
    console.error('Inference API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
