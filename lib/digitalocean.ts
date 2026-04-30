import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createAdminClient } from './supabase';

export async function provisionDroplet(userId: string) {
  const DO_API_KEY = process.env.DIGITALOCEAN_API_KEY;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://laverdi.tech';
  const WEBHOOK_SECRET = process.env.DO_CALLBACK_SECRET || 'fallback-secret-change-me';

  if (!DO_API_KEY) {
    throw new Error('DigitalOcean API key not configured');
  }

  // 1. Generate a secure pairing token for this instance
  const pairingToken = crypto.randomBytes(32).toString('hex');

  // 2. Read the provisioning script
  const scriptPath = path.join(process.cwd(), 'scripts', 'do-provision.sh');
  let provisionScript = fs.readFileSync(scriptPath, 'utf8');

  // 3. Inject variables into the script
  provisionScript = provisionScript
    .replace(/\{\{USER_ID\}\}/g, userId)
    .replace(/\{\{PAIRING_TOKEN\}\}/g, pairingToken)
    .replace(/\{\{CALLBACK_URL\}\}/g, `${APP_URL}/api/webhooks/do-callback`)
    .replace(/\{\{WEBHOOK_SECRET\}\}/g, WEBHOOK_SECRET);

  // 4. Call DigitalOcean API to create the Droplet
  const doResponse = await fetch('https://api.digitalocean.com/v2/droplets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DO_API_KEY}`,
    },
    body: JSON.stringify({
      name: `openclaw-${userId.substring(0, 8)}-${Date.now()}`,
      region: 'nyc3',
      size: 's-1vcpu-2gb',
      image: 'ubuntu-24-04-x64',
      user_data: provisionScript,
      tags: ['openclaw-instance', 'trial'],
    }),
  });

  if (!doResponse.ok) {
    const errorData = await doResponse.json();
    throw new Error(`Failed to provision droplet: ${JSON.stringify(errorData)}`);
  }

  const dropletData = await doResponse.json();

  // 5. Store the pending droplet state in Supabase
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('instances').insert({
      user_id: userId,
      droplet_id: dropletData.droplet.id.toString(),
      status: 'provisioning',
      pairing_token: pairingToken,
    });
    
    if (error) {
      console.error('Failed to create instance record in Supabase:', error);
    }
  } catch (err) {
    console.error('Error creating admin client or storing instance:', err);
  }

  return {
    dropletId: dropletData.droplet.id,
    pairingToken
  };
}