/**
 * pages/api/webhooks/stripe.ts
 * Handles Stripe events (subscription created, updated, cancelled)
 * Triggers droplet provisioning on upgrade
 */

import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  createUserDroplet,
  deleteUserDroplet,
  storeDropletInfo,
  getUserDroplet,
} from "../../../lib/droplet-provisioner";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

type ResponseData = {
  received: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ received: false, error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ received: false, error: "No signature" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook error: ${error.message}`);
    return res
      .status(400)
      .json({ received: false, error: `Webhook error: ${error.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).json({ received: false, error: err.message });
  }
}

/**
 * Handle checkout session completion (one-time or subscription payment)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe] Checkout session completed: ${session.id}`);

  if (!session.customer || !session.metadata) {
    console.error("Missing customer or metadata in checkout session");
    return;
  }

  const customerId = session.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`Could not find user for customer ${customerId}`);
    return;
  }

  // Get user email
  const { data: userData } = await supabase
    .from("users")
    .select("email, api_key")
    .eq("id", userId)
    .single();

  if (!userData) {
    console.error(`Could not find user ${userId}`);
    return;
  }

  // Determine tier from metadata or subscription
  let tier = "starter";
  if (session.metadata?.tier) {
    tier = session.metadata.tier;
  } else if (session.subscription) {
    // If there's a subscription, get tier from it
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    tier = getTierFromSubscription(subscription);
  }

  if (tier !== "free") {
    // Create droplet for paid tiers
    console.log(`Creating droplet for user ${userId} (tier: ${tier}) from checkout`);
    try {
      const droplet = await createUserDroplet({
        userId,
        tier: tier as "starter" | "pro",
        email: userData.email,
        apiKey: userData.api_key,
      });

      await storeDropletInfo(userId, droplet.dropletId, droplet.ipAddress, tier as "starter" | "pro");
      console.log(`Droplet created: ${droplet.dropletId} (IP: ${droplet.ipAddress})`);
    } catch (error) {
      console.error(`Error creating droplet: ${error}`);
    }
  }
}

/**
 * Handle new subscription (user upgraded from Free to Starter/Pro)
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`[Stripe] Subscription created: ${subscription.id}`);

  const tier = getTierFromSubscription(subscription);
  if (tier === "free") {
    console.log("Free tier subscription - no droplet needed");
    return;
  }

  const customerId = subscription.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`Could not find user for customer ${customerId}`);
    return;
  }

  // Get user email
  const { data: userData } = await supabase
    .from("users")
    .select("email, api_key")
    .eq("id", userId)
    .single();

  if (!userData) {
    console.error(`Could not find user ${userId}`);
    return;
  }

  // Create droplet
  console.log(`Creating droplet for user ${userId} (tier: ${tier})`);
  const droplet = await createUserDroplet({
    userId,
    tier: tier as "starter" | "pro",
    email: userData.email,
    apiKey: userData.api_key,
  });

  // Store droplet info
  await storeDropletInfo(userId, droplet.dropletId, droplet.ipAddress, tier as "starter" | "pro");
  console.log(
    `Droplet created: ${droplet.dropletId} (IP: ${droplet.ipAddress})`
  );
}

/**
 * Handle subscription update (tier change)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Stripe] Subscription updated: ${subscription.id}`);

  const customerId = subscription.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`Could not find user for customer ${customerId}`);
    return;
  }

  const newTier = getTierFromSubscription(subscription);
  const existingDroplet = await getUserDroplet(userId);

  if (newTier === "free" && existingDroplet) {
    // Downgrade: delete droplet
    console.log(`Downgrading user ${userId} to free - deleting droplet`);
    await deleteUserDroplet(existingDroplet.dropletId);

    // Mark as deleted
    await supabase
      .from("user_droplets")
      .update({ status: "deleted" })
      .eq("user_id", userId);
  } else if (newTier !== "free" && !existingDroplet) {
    // Upgrade: create droplet (reuse subscription created logic)
    await handleSubscriptionCreated(subscription);
  }
}

/**
 * Handle subscription cancellation (delete droplet)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Stripe] Subscription deleted: ${subscription.id}`);

  const customerId = subscription.customer as string;
  const userId = await getUserIdFromCustomer(customerId);

  if (!userId) {
    console.error(`Could not find user for customer ${customerId}`);
    return;
  }

  const droplet = await getUserDroplet(userId);
  if (droplet) {
    console.log(`Deleting droplet ${droplet.dropletId} for user ${userId}`);
    await deleteUserDroplet(droplet.dropletId);

    // Mark as deleted
    await supabase
      .from("user_droplets")
      .update({ status: "deleted" })
      .eq("user_id", userId);
  }
}

/**
 * Get tier from Stripe subscription
 */
function getTierFromSubscription(subscription: Stripe.Subscription): string {
  const priceId = (subscription.items.data[0]?.price.id as string) || "";

  // Map Stripe price IDs to tiers (you'll need to set these in your Stripe account)
  if (priceId.includes("starter")) return "starter";
  if (priceId.includes("pro")) return "pro";
  return "free";
}

/**
 * Get user ID from Stripe customer ID
 */
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (error) {
    console.error(`Error finding user: ${error.message}`);
    return null;
  }

  return data?.id || null;
}
