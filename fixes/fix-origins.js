const fs = require('fs');
const path = '/root/.openclaw/.openclaw/openclaw.json';
const port = process.env.PORT || '9000';

const c = JSON.parse(fs.readFileSync(path, 'utf8'));
if (!c.gateway) c.gateway = {};
if (!c.gateway.controlUi) c.gateway.controlUi = {};
if (!c.gateway.controlUi.allowedOrigins) c.gateway.controlUi.allowedOrigins = [];

const origins = c.gateway.controlUi.allowedOrigins;
const newOrigins = [
    `http://64.23.142.154:${port}`,
    'https://laverdi.tech',
    'http://localhost:18789',
    'http://127.0.0.1:18789'
];
for (const o of newOrigins) {
    if (!origins.includes(o)) origins.push(o);
}

// Also set bind to 0.0.0.0 to ensure external access
c.gateway.bind = '0.0.0.0';

fs.writeFileSync(path, JSON.stringify(c, null, 2));
console.log('Updated allowedOrigins:', origins);
