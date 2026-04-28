/**
 * DigitalOcean Callback Webhook
 * Receives "I'm ready" signal from newly bootstrapped droplets
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { DropletProvisioner } from '../../../lib/droplet-provisioner';

/**
 * Interface for the callback payload from droplet
 */
interface DropletReadyCallback {
  user_id: string;
  droplet_id: number;
  status: 'ready' | 'error';
  ip_address?: string;
  ipv6_address?: string;
  pairing_token: string;
  bootstrapped_at: string;
  error?: string;
}

/**
 * Send email notification to user
 */
async function sendReadyNotification(
  userId: string,
  dropletId: number,
  ipAddress: string
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, just log it
  console.log(
    `[DO-Callback] Would send email to user ${userId}: Droplet ${dropletId} ready at ${ipAddress}`
  );

  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: userEmail,
  //   from: 'noreply@laverdi.dev',
  //   subject: `Your Droplet is Ready! (${ipAddress})`,
  //   html: `<h1>Your Agent Droplet is Ready</h1>
  //          <p>Connect to your agent at: <code>${ipAddress}</code></p>
  //          <a href="https://laverdi.dev/dashboard">View Dashboard</a>`,
  // });
}

/**
 * Mark droplet as ready in database
 */
async function markDropletReady(
  userId: string,
  dropletId: number,
  ipAddress: string
): Promise<void> {
  const provisioner = new DropletProvisioner();
  await provisioner.markDropletReady(userId, dropletId, ipAddress);
}

/**
 * Validate callback payload
 */
function validatePayload(data: any): data is DropletReadyCallback {
  if (!data.user_id || typeof data.user_id !== 'string') {
    return false;
  }
  if (!data.droplet_id || typeof data.droplet_id !== 'number') {
    return false;
  }
  if (!data.status || !['ready', 'error'].includes(data.status)) {
    return false;
  }
  if (data.status === 'ready' && !data.ip_address) {
    return false;
  }
  if (!data.pairing_token || typeof data.pairing_token !== 'string') {
    return false;
  }
  return true;
}

/**
 * Verify pairing token matches stored value
 */
async function verifyPairingToken(
  userId: string,
  dropletId: number,
  pairingToken: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data, error } = await supabase
    .from('user_droplets')
    .select('pairing_token')
    .eq('user_id', userId)
    .eq('droplet_id', dropletId)
    .single();

  if (error || !data) {
    console.error(`[DO-Callback] Failed to fetch pairing token: ${error}`);
    return false;
  }

  return data.pairing_token === pairingToken;
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

  const payload = req.body;

  // Validate payload
  if (!validatePayload(payload)) {
    console.error(
      `[DO-Callback] Invalid payload: ${JSON.stringify(payload)}`
    );
    return res.status(400).json({
      error: 'Invalid payload',
      required: [
        'user_id',
        'droplet_id',
        'status',
        'pairing_token',
      ],
    });
  }

  const {
    user_id,
    droplet_id,
    status,
    ip_address,
    pairing_token,
    bootstrapped_at,
    error: dropletError,
  } = payload;

  console.log(
    `[DO-Callback] Received callback: droplet ${droplet_id}, user ${user_id}, status ${status}`
  );

  try {
    // Verify pairing token
    const tokenValid = await verifyPairingToken(
      user_id,
      droplet_id,
      pairing_token
    );

    if (!tokenValid) {
      console.error(
        `[DO-Callback] Invalid pairing token for user ${user_id}, droplet ${droplet_id}`
      );
      return res.status(401).json({
        error: 'Invalid pairing token',
      });
    }

    if (status === 'error') {
      console.error(
        `[DO-Callback] Droplet reported error: ${dropletError}`
      );

      // Update database with error status
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      await supabase
        .from('user_droplets')
        .update({
          status: 'failed',
          bootstrap_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .eq('droplet_id', droplet_id);

      return res.status(200).json({
        acknowledged: true,
        status: 'error_recorded',
        message: 'Droplet error recorded',
      });
    }

    // Status is 'ready'
    if (!ip_address) {
      console.error(
        `[DO-Callback] Ready status but no IP address provided`
      );
      return res.status(400).json({
        error: 'Ready status requires ip_address',
      });
    }

    // Mark as ready in database
    await markDropletReady(user_id, droplet_id, ip_address);

    console.log(
      `[DO-Callback] Droplet ${droplet_id} marked as ready at ${ip_address}`
    );

    // Send notification email (async, don't wait)
    sendReadyNotification(user_id, droplet_id, ip_address).catch((error) => {
      console.error(
        `[DO-Callback] Failed to send notification: ${error.message}`
      );
    });

    return res.status(200).json({
      acknowledged: true,
      status: 'ready',
      message: `Droplet ${droplet_id} marked as ready`,
      ip_address: ip_address,
      bootstrapped_at: bootstrapped_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error(`[DO-Callback] Error processing callback: ${message}`);

    return res.status(500).json({
      error: 'Internal server error',
      message: message,
    });
  }
}
