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

    // Check for existing instance (prevent double-provision)
    const { data: existing } = await supabase
      .from('instances')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    if (existing && existing.length > 0) {
      return res.status(200).json({ success: true, message: 'Instance already exists', existing: true });
    }

    const VULTR_API_KEY = process.env.VULTR_API_KEY || '';
    const VULTR_API_BASE = 'https://api.vultr.com/v2';
    const PORTAL_URL = 'https://laverdi.tech';
    const WEBHOOK_TOKEN = process.env.INSTANCE_WEBHOOK_TOKEN || 'webhook-secret-token-change-in-production';
    const INFERENCE_KEY = 'sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt';
    const instanceId = 'inst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Build cloud-init script
    const cloudInit = [
      '#!/bin/bash',
      'exec > /var/log/laverdi-init.log 2>&1',
      'echo "=== LaVerdi Init Starting ==="',
      '',
      '# Install Docker',
      'curl -fsSL https://get.docker.com -o get-docker.sh',
      'sh get-docker.sh',
      'systemctl start docker',
      'systemctl enable docker',
      'echo "Docker installed."',
      '',
      '# Open firewall',
      'ufw allow 9000/tcp || true',
      'ufw allow 18789/tcp || true',
      'echo "Firewall configured."',
      '',
      '# Download and load image',
      'echo "Downloading image..."',
      `curl -L ${PORTAL_URL}/downloads/laverdi-openclaw.tar -o /tmp/image.tar`,
      'docker load < /tmp/image.tar',
      'rm -f /tmp/image.tar',
      'echo "Image loaded."',
      '',
      '# Start container with both ports',
      'echo "Starting container..."',
      `docker run -d --name openclaw --restart unless-stopped -p 9000:9000 -p 18789:18789 -e OPENCLAW_USER_ID="${userId}" -e OPENCLAW_INSTANCE_ID="${instanceId}" laverdi-openclaw:latest`,
      '',
      '# Wait for OpenClaw to boot',
      'echo "Waiting for OpenClaw..."',
      'READY=0',
      'for i in $(seq 1 120); do',
      '  if curl -sf http://localhost:9000/ > /dev/null 2>&1; then',
      '    READY=1',
      '    echo "Ready after $i seconds"',
      '    break',
      '  fi',
      '  sleep 1',
      'done',
      '',
      'if [ "$READY" -eq 0 ]; then',
      '  echo "ERROR: OpenClaw failed to start"',
      '  exit 1',
      'fi',
      '',
      '# Inject API key for Vultr inference',
      'echo "Configuring API key..."',
      `docker exec openclaw node -e "const fs=require('fs');const dir='/root/.openclaw/.openclaw/agents/main/agent';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/auth-profiles.json',JSON.stringify({profiles:{openai:{apiKey:'${INFERENCE_KEY}',baseUrl:'https://inference.do-ai.run/v1'}}}));"`,
      '',
      '# Set allowed origins for wildcard SSL proxy',
      'echo "Setting allowed origins..."',
      `docker exec openclaw node -e "const fs=require('fs');const f='/root/.openclaw/.openclaw/openclaw.json';const c=JSON.parse(fs.readFileSync(f));c.gateway=c.gateway||{};c.gateway.controlUi=c.gateway.controlUi||{};c.gateway.controlUi.allowedOrigins=['https://${userId}.agent.laverdi.tech','http://localhost:18789','http://127.0.0.1:18789'];fs.writeFileSync(f,JSON.stringify(c,null,2));"`,
      '',
      '# Restart to pick up new config',
      'docker restart openclaw',
      'sleep 15',
      '',
      '# Get instance IP',
      'INSTANCE_IP=$(curl -sf http://169.254.169.254/v1.json 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin)[\'interfaces\'][0][\'ipv4\'][\'address\'])" 2>/dev/null || hostname -I | awk \'{print $1}\')',
      'echo "IP: $INSTANCE_IP"',
      '',
      '# Call webhook to mark instance as ready',
      'echo "Calling webhook..."',
      `curl -sf -X POST ${PORTAL_URL}/api/webhooks/instance-ready -H "Content-Type: application/json" -d '{"instanceId":"${instanceId}","userId":"${userId}","instanceIp":"'"$INSTANCE_IP"'","instancePort":9000,"token":"${WEBHOOK_TOKEN}"}' || echo "Webhook call failed"`,
      '',
      'echo "=== LaVerdi Init Complete ==="',
    ].join('\n');

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
        user_data: Buffer.from(cloudInit).toString('base64'),
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Vultr API error:', response.status, errBody);
      throw new Error('Vultr error: ' + response.status);
    }

    const data = await response.json();
    const instance = data.instance;
    console.log('Vultr instance created:', instance.id, 'IP:', instance.main_ip);

    // Insert into instances table
    const { error: insertError } = await supabase.from('instances').insert({
      user_id: userId,
      container_id: instance.id,
      ip_address: instance.main_ip || '0.0.0.0',
      port: 9000,
      model_id: 'haiku-4.5',
      status: 'provisioning',
    });

    if (insertError) {
      console.error('Supabase instances insert FAILED:', JSON.stringify(insertError));
    } else {
      console.log('Supabase instances insert SUCCESS');
    }

    // Update user status
    const { error: updateError } = await supabase.from('users').update({ status: 'provisioning' }).eq('id', userId);
    if (updateError) {
      console.error('Supabase users update FAILED:', JSON.stringify(updateError));
    }

    return res.status(200).json({
      success: true,
      container: { id: instance.id, ip: instance.main_ip, port: 9000 },
    });
  } catch (error: any) {
    console.error('Provision error:', error);
    return res.status(500).json({ error: error.message || 'Failed to provision' });
  }
}
