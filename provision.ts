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
    const WEBHOOK_TOKEN = 'webhook-secret-token-change-in-production';
    const INFERENCE_KEY = 'sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt';
    const instanceId = 'inst-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const cloudInitScript = [
      '#!/bin/bash',
      'exec > /var/log/laverdi-init.log 2>&1',
      'echo "=== LaVerdi Init Starting ==="',
      'curl -fsSL https://get.docker.com -o get-docker.sh',
      'sh get-docker.sh',
      'systemctl start docker',
      'systemctl enable docker',
      'echo "Docker installed."',
      'ufw allow 9000/tcp || true',
      'ufw allow 18789/tcp || true',
      'echo "Firewall configured."',
      'echo "Downloading image..."',
      'curl -L ' + PORTAL_URL + '/downloads/laverdi-openclaw.tar -o /tmp/image.tar',
      'docker load < /tmp/image.tar',
      'rm -f /tmp/image.tar',
      'echo "Image loaded."',
      'echo "Pre-creating OpenClaw config..."',
      'mkdir -p /opt/openclaw-config',
      'cat > /opt/openclaw-config/openclaw.json << OCEOF',
      '{',
      '  "gateway": {',
      '    "auth": {',
      '      "mode": "token"',
      '    },',
      '    "controlUi": {',
      '      "dangerouslyAllowHostHeaderOriginFallback": true,',
      '      "dangerouslyDisableDeviceAuth": true,',
      '      "allowedOrigins": ["https://' + userId + '.agent.laverdi.tech", "http://localhost:18789", "http://127.0.0.1:18789"]',
      '    }',
      '  },',
      '  "agents": {',
      '    "defaults": {',
      '      "model": "vultr/deepseek-v4-pro"',
      '    }',
      '  },',
      '  "models": {',
      '    "providers": {',
      '      "vultr": {',
      '        "baseUrl": "https://inference.do-ai.run/v1",',
      '        "apiKey": "' + INFERENCE_KEY + '",',
      '        "api": "openai-completions",',
      '        "models": [',
      '          {"id":"deepseek-v4-pro","name":"DeepSeek V4 Pro","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000},',
      '          {"id":"llama3.3-70b-instruct","name":"Llama 3.3 70B","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000},',
      '          {"id":"llama-4-maverick","name":"Llama 4 Maverick","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000},',
      '          {"id":"deepseek-3.2","name":"DeepSeek 3.2","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000},',
      '          {"id":"gemma-4-31B-it","name":"Gemma 4 31B","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000},',
      '          {"id":"mistral-3-14B","name":"Mistral 3 14B","reasoning":false,"input":["text"],"contextWindow":32000,"maxTokens":8000},',
      '          {"id":"alibaba-qwen3-32b","name":"Qwen 3 32B","reasoning":false,"input":["text"],"contextWindow":131072,"maxTokens":32000}',
      '        ]',
      '      }',
      '    }',
      '  }',
      '}',
      'OCEOF',
      'echo "Config pre-created."',
      '',
      'echo "Generating gateway auth token..."',
      'GATEWAY_TOKEN=$(openssl rand -hex 32)',
      'echo "Generated token: $GATEWAY_TOKEN"',
      '',
      '# Inject token into openclaw.json using jq',
      'jq ".gateway.auth.token = \\"$GATEWAY_TOKEN\\"" /opt/openclaw-config/openclaw.json > /tmp/openclaw.json && mv /tmp/openclaw.json /opt/openclaw-config/openclaw.json',
      '',
      '# Store token metadata for admin retrieval',
      'cat > /opt/openclaw-config/gateway-token.json << TOKENEOF',
      '{',
      '  "token": "$GATEWAY_TOKEN",',
      '  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",',
      '  "user_id": "' + userId + '",',
      '  "instance_id": "' + instanceId + '"',
      '}',
      'TOKENEOF',
      'chmod 600 /opt/openclaw-config/gateway-token.json',
      'echo "Token injected and stored."',
      '',
      'echo "Starting container..."',
      'docker run -d --name openclaw --restart unless-stopped -p 9000:9000 -p 18789:18789 -v /opt/openclaw-config:/root/.openclaw/.openclaw -e OPENCLAW_USER_ID="' + userId + '" -e OPENCLAW_INSTANCE_ID="' + instanceId + '" laverdi-openclaw:latest',
      'echo "Waiting for OpenClaw..."',
      'READY=0',
      'for i in $(seq 1 120); do',
      '  if docker logs openclaw 2>&1 | grep -q "gateway.*ready"; then READY=1; echo "Ready after $i seconds"; break; fi',
      '  sleep 2',
      'done',
      'if [ "$READY" -eq 0 ]; then echo "WARNING: OpenClaw may still be starting"; fi',
      'echo "Configuring API key..."',
      "docker exec openclaw node -e \"const fs=require('fs');const dir='/root/.openclaw/.openclaw/agents/main/agent';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/auth-profiles.json',JSON.stringify({profiles:{openai:{apiKey:'sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt',baseUrl:'https://inference.do-ai.run/v1'}}}));\"",
            
      'INSTANCE_IP=$(curl -sf http://169.254.169.254/v1.json 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin)[\'interfaces\'][0][\'ipv4\'][\'address\'])" 2>/dev/null || hostname -I | awk \'{print $1}\')',
      'echo "IP: $INSTANCE_IP"',
      'echo "Waiting 15 seconds for container to fully initialize..."',
      'sleep 15',
      'GATEWAY_TOKEN=$(docker exec openclaw node -e "process.stdout.write(JSON.parse(require(String.fromCharCode(102,115)).readFileSync(String.fromCharCode(47,114,111,117,116,47,46,111,112,101,110,99,108,97,119,47,46,111,112,101,110,99,108,97,119,47,111,112,101,110,99,108,97,119,46,106,115,111,110))).gateway.auth.token)")',
      'echo "Token: $GATEWAY_TOKEN"',
      '# Send token to portal via simple GET (avoids JSON escaping)',
      'curl -sf -G "' + PORTAL_URL + '/api/update-token" --data-urlencode "userId=' + userId + '" --data-urlencode "token=$GATEWAY_TOKEN" --data-urlencode "secret=' + WEBHOOK_TOKEN + '" || echo "Token update failed"',
      'echo "Calling webhook..."',
      'curl -sf -X POST ' + PORTAL_URL + '/api/webhooks/instance-ready -H "Content-Type: application/json" -d \'{"instanceId":"' + instanceId + '","userId":"' + userId + '","instanceIp":"\'"$INSTANCE_IP"\'","instancePort":9000,"token":"' + WEBHOOK_TOKEN + '","gatewayToken":"\'"$GATEWAY_TOKEN"\'"}\'  || echo "Webhook failed"',
      'echo "=== LaVerdi Init Complete ==="',
    ].join('\n');

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

    if (!response.ok) throw new Error('Vultr error: ' + response.statusText);
    const data = await response.json();
    const instance = data.instance;

    console.log('Created Vultr instance: ' + instance.id + ' for user: ' + userId);

    const { error: insertError } = await supabase.from('instances').insert({
  user_id: userId,
  container_id: instance.id,
  ip_address: instance.main_ip || '0.0.0.0',
  port: 9000,
  model_id: 'haiku-4.5',
  status: 'provisioning',
});
if (insertError) console.error('Insert failed:', JSON.stringify(insertError));


    await supabase.from('users').update({ status: 'provisioning' }).eq('id', userId);

    return res.status(200).json({ success: true, container: { id: instance.id, ip: instance.main_ip, port: 9000 } });
  } catch (error) {
    console.error('Provision error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
  }
}
