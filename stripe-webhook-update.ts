// pages/api/webhooks/stripe.ts - UPDATED WEBHOOK HANDLER
// Handles Stripe checkout.session.completed and subscription changes
// NOW: Provisions OpenClaw with tier-based model

import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const tierMap: { [key: string]: string } = {
  [process.env.STRIPE_PRICE_ID_STARTER || '']: 'starter',
  [process.env.STRIPE_PRICE_ID_PROFESSIONAL || '']: 'professional',
};

async function provisionOpenClawForUser(userId: string, tier: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/provision-openclaw-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_SECRET_KEY}`,
        },
        body: JSON.stringify({ userId, tier }),
      }
    );
    const data = await response.json();
    console.log(`Provisioned OpenClaw for user ${userId} with tier ${tier}`);
    return data;
  } catch (error) {
    console.error(`Failed to provision OpenClaw for user ${userId}:`, error);
    // Don't throw - allow webhook to complete even if provisioning fails
    // User can retry manually
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const priceId = session.line_items?.data[0]?.price?.id;

      if (!userId || !priceId) {
        console.error('Missing userId or priceId in checkout session');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const tier = tierMap[priceId] || 'starter';

      // Update user tier in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tier,
          subscription_status: 'active',
          subscription_id: session.subscription as string,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Provision OpenClaw container with tier-based model
      await provisionOpenClawForUser(userId, tier);

      // Send welcome email (existing logic)
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier }),
      });

      return res.status(200).json({ received: true });
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;

      // Find user by subscription ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('subscription_id', subscription.id)
        .single();

      if (user && priceId) {
        const tier = tierMap[priceId] || 'starter';

        // Update tier
        await supabase
          .from('users')
          .update({ tier })
          .eq('id', user.id);

        // Re-provision with new model
        await provisionOpenClawForUser(user.id, tier);
      }

      return res.status(200).json({ received: true });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      // Find user by subscription ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('subscription_id', subscription.id)
        .single();

      if (user) {
        // Downgrade to free tier
        await supabase
          .from('users')
          .update({
            tier: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', user.id);

        // Re-provision with free model
        await provisionOpenClawForUser(user.id, 'free');
      }

      return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
}
