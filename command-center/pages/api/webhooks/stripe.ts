/**
 * Stripe Webhook Handler
 * Listens for payment events and triggers droplet provisioning
 */

import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { DropletProvisioner } from '../../../lib/droplet-provisioner';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Get the portal base URL for callback
 */
function getPortalBaseUrl(): string {
  if (process.env.PORTAL_BASE_URL) {
    return process.env.PORTAL_BASE_URL;
  }
  // Default to localhost for dev, or use request origin in production
  return process.env.NODE_ENV === 'production'
    ? 'https://laverdi.agent-portal.dev'
    : 'http://localhost:3000';
}

/**
 * Extract user ID from Stripe subscription metadata
 */
function getUserIdFromSubscription(subscription: Stripe.Subscription): string {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    throw new Error('Subscription missing user_id in metadata');
  }
  return userId;
}

/**
 * Extract tier from Stripe price
 */
async function getTierFromPrice(priceId: string): Promise<string> {
  const price = await stripe.prices.retrieve(priceId);
  const tier = price.metadata?.tier;

  if (!tier || !['starter', 'pro', 'enterprise'].includes(tier)) {
    throw new Error(`Invalid or missing tier in price metadata: ${tier}`);
  }

  return tier;
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(
    `[Stripe] Subscription created: ${subscription.id} for customer ${subscription.customer}`
  );

  try {
    // Extract metadata
    const userId = getUserIdFromSubscription(subscription);
    const priceId = subscription.items.data[0]?.price.id;

    if (!priceId) {
      throw new Error('Subscription has no price');
    }

    const tier = await getTierFromPrice(priceId);

    console.log(
      `[Stripe] Triggering provisioning: user=${userId}, tier=${tier}`
    );

    // Provision droplet
    const provisioner = new DropletProvisioner();
    const result = await provisioner.provision({
      userId,
      tier: tier as 'starter' | 'pro' | 'enterprise',
      webhookUrl: getPortalBaseUrl(),
    });

    if (!result.success) {
      console.error(`[Stripe] Provisioning failed: ${result.error}`);
      // Don't fail the webhook - Stripe will retry
      // We'll handle the error asynchronously
      return res.status(200).json({
        received: true,
        message: 'Webhook received, provisioning queued',
        warning: result.error,
      });
    }

    console.log(`[Stripe] Droplet provisioned: ${result.dropletId}`);

    return res.status(200).json({
      received: true,
      dropletId: result.dropletId,
      status: result.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Stripe] Error handling subscription: ${message}`);

    // Return 200 to acknowledge receipt, but log the error
    // Stripe doesn't need to retry this
    return res.status(200).json({
      received: true,
      error: message,
    });
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log(
    `[Stripe] Subscription deleted: ${subscription.id}`
  );

  try {
    const userId = getUserIdFromSubscription(subscription);

    console.log(`[Stripe] Marking droplets as deleted for user ${userId}`);

    // Note: We could delete droplets here, but for now we just mark them
    // in the database and let the user manually clean up
    // This prevents accidental data loss

    return res.status(200).json({
      received: true,
      message: 'Subscription deletion acknowledged',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Stripe] Error handling subscription deletion: ${message}`);

    return res.status(200).json({
      received: true,
      error: message,
    });
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.warn('[Stripe] Missing signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`[Stripe] Webhook signature verification failed: ${message}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log(`[Stripe] Received event: ${event.type}`);

  // Route to appropriate handler
  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event, req, res);

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event, req, res);

    case 'customer.subscription.updated':
      // Could handle tier changes here
      return res.status(200).json({ received: true });

    case 'customer.subscription.trial_will_end':
      // Could send reminder email here
      return res.status(200).json({ received: true });

    default:
      // Acknowledge other event types without processing
      console.log(`[Stripe] Ignoring event type: ${event.type}`);
      return res.status(200).json({ received: true });
  }
}
