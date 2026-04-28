// Runs inside newly provisioned OpenClaw containers to configure gateway
const fs = require('fs');
const configPath = '/root/.openclaw/.openclaw/openclaw.json';

const token = process.env.GATEWAY_TOKEN || 'default-token';
const port = process.env.PORT || '9000';
const publicIp = process.env.PUBLIC_IP || '64.23.142.154';

let c = {};
try { c = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}

// Gateway config
c.gateway = c.gateway || {};
c.gateway.bind = '0.0.0.0';
c.gateway.auth = { mode: 'token', token };
c.gateway.controlUi = c.gateway.controlUi || {};
c.gateway.controlUi.allowedOrigins = [
    `http://${publicIp}:${port}`,
    'https://laverdi.tech',
    'http://localhost:18789',
    'http://127.0.0.1:18789'
];
c.gateway.controlUi.dangerouslyDisableDeviceAuth = true;

fs.mkdirSync(require('path').dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(c, null, 2));
console.log('Gateway configured: token=' + token.substring(0,8) + '..., port=' + port);
