import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Validate env vars
    const VULTR_API_KEY = process.env.VULTR_API_KEY;
    if (!VULTR_API_KEY) {
      console.error('VULTR_API_KEY not set');
      return res.status(500).json({ error: 'Server misconfiguration: missing VULTR_API_KEY' });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
      return res.status(500).json({ error: 'Server misconfiguration: missing Supabase config' });
    }

    const VULTR_API_BASE = 'https://api.vultr.com/v2';
    const PORTAL_URL = 'https://laverdi.tech';
    const WEBHOOK_TOKEN = process.env.INSTANCE_WEBHOOK_TOKEN || 'webhook-secret-token-change-in-production';
    const instanceId = 'inst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const cloudInitScript = `#!/bin/bash
set -e
exec > /var/log/laverdi-init.log 2>&1
echo "=== LaVerdi Cloud-Init Starting ==="
date

echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
echo "Docker installed."

echo "Downloading OpenClaw image..."
curl -L ${PORTAL_URL}/downloads/laverdi-openclaw.tar -o /tmp/image.tar
echo "Loading Docker image..."
docker load < /tmp/image.tar
rm /tmp/image.tar
echo "Image loaded."

echo "Starting OpenClaw container..."
docker run -d --name openclaw --restart unless-stopped -p 9000:9000 -e OPENCLAW_USER_ID="${userId}" -e OPENCLAW_INSTANCE_ID="${instanceId}" laverdi-openclaw:latest

echo "Waiting for OpenClaw to be ready..."
READY=0
for i in $(seq 1 120); do
  if curl -sf http://localhost:9000/ > /dev/null 2>&1; then
    READY=1
    echo "OpenClaw ready after $i seconds"
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "ERROR: OpenClaw failed to start within 120 seconds"
  exit 1
fi

INSTANCE_IP=$(curl -sf http://169.254.169.254/v1/interfaces/1/ipv4/address || hostname -I | awk '{print $1}')
echo "Instance IP: $INSTANCE_IP"

echo "Calling webhook..."
curl -sf -X POST ${PORTAL_URL}/api/webhooks/instance-ready \
  -H "Content-Type: application/json" \
  -d '{"instanceId":"${instanceId}","userId":"${userId}","instanceIp":"'"$INSTANCE_IP"'","instancePort":9000,"token":"${WEBHOOK_TOKEN}"}' \
  || echo "WARNING: Webhook call failed"

echo "=== LaVerdi Cloud-Init Complete ==="
`;

    // Create Vultr instance
    console.log('Creating Vultr instance for user:', userId);
    const response = await fetch(VULTR_API_BASE + '/instances', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + VULTR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        region: 'sea',
        plan: 'vc2-1c-1gb',
        os_id: 1743,
        label: 'openclaw-' + userId.substring(0, 8),
        user_data: Buffer.from(cloudInitScript).toString('base64'),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Vultr API error:', response.status, errBody);
      throw new Error('Vultr error: ' + response.status + ' ' + errBody);
    }

    const data = await response.json();
    const instance = data.instance;
    console.log('Vultr instance created:', instance.id, 'IP:', instance.main_ip);

    // Insert into instances table — CHECK for errors
    const { data: insertData, error: insertError } = await supabase.from('instances').insert({
      user_id: userId,
      container_id: instance.id,
      ip_address: instance.main_ip || '0.0.0.0',
      port: 9000,
      status: 'provisioning',
    });

    if (insertError) {
      console.error('Supabase instances insert FAILED:', JSON.stringify(insertError));
      // Don't fail the whole request — instance was created, just DB tracking failed
    } else {
      console.log('Supabase instances insert SUCCESS');
    }

    // Update user status
    const { error: updateError } = await supabase.from('users').update({ status: 'provisioning' }).eq('id', userId);
    if (updateError) {
      console.error('Supabase users update FAILED:', JSON.stringify(updateError));
    } else {
      console.log('Supabase user status updated to provisioning');
    }

    return res.status(200).json({
      success: true,
      container: {
        id: instance.id,
        ip: instance.main_ip,
        port: 9000,
      },
      db: {
        instanceInsert: insertError ? 'FAILED: ' + insertError.message : 'OK',
        userUpdate: updateError ? 'FAILED: ' + updateError.message : 'OK',
      }
    });
  } catch (error: any) {
    console.error('Provision error:', error);
    return res.status(500).json({ error: error.message || 'Failed to provision' });
  }
}
